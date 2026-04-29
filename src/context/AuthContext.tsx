import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ref, get, set, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { computeProfile } from "@/lib/profiles";
import type { ProfileType, QuizAnswers } from "@/lib/profiles";

export interface UserProfile {
  memberName: string | null;
  financialProfile: ProfileType | null;
  quizCompleted: boolean;
  onboardingComplete: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userProfile: UserProfile;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  saveQuizAnswers: (answers: QuizAnswers) => Promise<void>;
  skipQuiz: () => Promise<void>;
  saveOnboarding: (memberName: string, startingBalance: number) => Promise<void>;
  updateMemberName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEFAULT_PROFILE: UserProfile = {
  memberName: null,
  financialProfile: null,
  quizCompleted: false,
  onboardingComplete: false,
};

async function loadProfile(userId: string): Promise<UserProfile> {
  try {
    const snap = await get(ref(db, `users/${userId}/profile`));
    const p = snap.val();
    if (p) {
      return {
        memberName: p.memberName ?? null,
        financialProfile: p.financialProfile ?? null,
        quizCompleted: p.quizCompleted === true,
        onboardingComplete: p.onboardingComplete === true,
      };
    }
  } catch (err) {
    console.error("Profile load error:", err);
  }
  return DEFAULT_PROFILE;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await loadProfile(firebaseUser.uid);
        setUserProfile(profile);
        localStorage.setItem("last-activity", Date.now().toString());
      } else {
        setUserProfile(DEFAULT_PROFILE);
      }
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    localStorage.setItem("last-activity", Date.now().toString());
  };

  const register = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
    localStorage.setItem("last-activity", Date.now().toString());
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("last-activity");
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const saveQuizAnswers = async (answers: QuizAnswers) => {
    if (!user) return;
    const profileType = computeProfile(answers);
    await update(ref(db, `users/${user.uid}/profile`), {
      quizCompleted: true,
      financialProfile: profileType,
      quizAnswers: answers,
      quizCompletedAt: new Date().toISOString(),
    });
    setUserProfile((prev) => ({ ...prev, quizCompleted: true, financialProfile: profileType }));
  };

  const skipQuiz = async () => {
    if (!user) return;
    await update(ref(db, `users/${user.uid}/profile`), { quizCompleted: true });
    setUserProfile((prev) => ({ ...prev, quizCompleted: true }));
  };

  const saveOnboarding = async (memberName: string, startingBalance: number) => {
    if (!user) return;
    const currentMonth = new Date().toISOString().slice(0, 7);
    await Promise.all([
      update(ref(db, `users/${user.uid}/profile`), {
        memberName,
        onboardingComplete: true,
        type: "single",
      }),
      set(ref(db, `users/${user.uid}/finances`), {
        startingBalance,
        currentMonth,
        updatedAt: new Date().toISOString(),
      }),
    ]);
    setUserProfile((prev) => ({ ...prev, memberName, onboardingComplete: true }));
  };

  const updateMemberName = async (name: string) => {
    if (!user) return;
    await update(ref(db, `users/${user.uid}/profile`), { memberName: name });
    setUserProfile((prev) => ({ ...prev, memberName: name }));
  };

  return (
    <AuthContext.Provider value={{
      user, loading, userProfile,
      login, register, logout, resetPassword,
      saveQuizAnswers, skipQuiz, saveOnboarding, updateMemberName,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
