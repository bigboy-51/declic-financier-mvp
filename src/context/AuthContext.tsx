import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ref, get, set, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { computeProfile, PROFILES } from "@/lib/profiles";
import type { ProfileType, QuizAnswers } from "@/lib/profiles";
import { CHARGE_CATEGORIES } from "@/constants/chargeCategories";
import { CHARGES_DATA } from "@/data/chargesData";
import { migrateGroceryToBudgetCourses } from "@/utils/migrateGrocery";
import { runLocalStorageMigration } from "@/lib/migration";
import type { MigrationResult } from "@/lib/migration";

export type UserType = "single" | "couple";

export interface ProfileHistoryEntry {
  type: ProfileType;
  timestamp: string;
}

interface UserProfile {
  userType: UserType | null;
  firstTimeSetupComplete: boolean;
  namesCompleted: boolean;
  memberName: string | null;
  partnerName: string | null;
  quizCompleted: boolean;
  quizAnswers: QuizAnswers | null;
  profileType: ProfileType | null;
  profileTimestamp: string | null;
  profileHistory: ProfileHistoryEntry[];
  partnerQuizCompleted: boolean;
  partnerProfileType: ProfileType | null;
  migrationComplete?: boolean;
  setupBalanceDone: boolean;
  setupCreditsDone: boolean;
  setupExpensesDone: boolean;
  setupSavingsDone: boolean;
  setupCoupleDone: boolean;
  quizEscalationSkipCount: number;
  quizEscalationDismissed: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userProfile: UserProfile;
  migrationStatus: MigrationResult | "running" | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  saveUserProfile: (userType: UserType) => Promise<void>;
  saveNames: (memberName: string, partnerName: string | null) => Promise<void>;
  saveQuizAnswers: (answers: QuizAnswers) => Promise<{ previousProfile: ProfileType | null; newProfile: ProfileType }>;
  savePartnerQuizAnswers: (answers: QuizAnswers) => Promise<{ newProfile: ProfileType }>;
  skipQuiz: () => Promise<void>;
  resetQuiz: () => Promise<void>;
  resetPartnerQuiz: () => Promise<void>;
  resetNamesCompleted: () => Promise<void>;
  dismissMigration: () => void;
  saveSetupStep: (step: "balance" | "credits" | "expenses" | "savings" | "couple") => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
  saveFinancesInitialBalance: (amount: number) => Promise<void>;
  saveCoupleInviteCode: () => Promise<string>;
  incrementEscalationSkip: () => Promise<void>;
  setEscalationDismissed: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEFAULT_PROFILE: UserProfile = {
  userType: null,
  firstTimeSetupComplete: false,
  namesCompleted: false,
  memberName: null,
  partnerName: null,
  quizCompleted: false,
  quizAnswers: null,
  profileType: null,
  profileTimestamp: null,
  profileHistory: [],
  partnerQuizCompleted: false,
  partnerProfileType: null,
  migrationComplete: false,
  setupBalanceDone: false,
  setupCreditsDone: false,
  setupExpensesDone: false,
  setupSavingsDone: false,
  setupCoupleDone: false,
  quizEscalationSkipCount: 0,
  quizEscalationDismissed: false,
};

async function loadProfileFromFirebase(userId: string): Promise<UserProfile> {
  try {
    const [profileSnap, onboardingSnap] = await Promise.all([
      get(ref(db, `users/${userId}/profile`)),
      get(ref(db, `users/${userId}/onboarding`)),
    ]);
    const p = profileSnap.val();
    const o = onboardingSnap.val();
    const onboardingCompleted = o?.completed === true;
    if (p) {
      const setupBalanceDone  = onboardingCompleted || p.setupBalanceDone === true;
      const setupCreditsDone  = onboardingCompleted || p.setupCreditsDone === true;
      const setupExpensesDone = onboardingCompleted || p.setupExpensesDone === true;
      const setupSavingsDone  = onboardingCompleted || p.setupSavingsDone === true;
      const setupCoupleDone   = onboardingCompleted || p.setupCoupleDone === true;
      if (onboardingCompleted && !(p.setupBalanceDone && p.setupCreditsDone && p.setupExpensesDone && p.setupSavingsDone)) {
        update(ref(db, `users/${userId}/profile`), {
          setupBalanceDone: true, setupCreditsDone: true,
          setupExpensesDone: true, setupSavingsDone: true,
        }).catch(console.error);
      }
      return {
        userType: p.userType ?? null,
        firstTimeSetupComplete: p.firstTimeSetupComplete === true,
        namesCompleted: p.namesCompleted === true,
        memberName: p.memberName ?? null,
        partnerName: p.partnerName ?? null,
        quizCompleted: p.quizCompleted === true,
        quizAnswers: p.quizAnswers ?? null,
        profileType: p.profileType ?? null,
        profileTimestamp: p.profileTimestamp ?? null,
        profileHistory: p.profileHistory ?? [],
        partnerQuizCompleted: p.partnerQuizCompleted === true,
        partnerProfileType: p.partnerProfileType ?? null,
        migrationComplete: p.migrationComplete === true,
        setupBalanceDone,
        setupCreditsDone,
        setupExpensesDone,
        setupSavingsDone,
        setupCoupleDone,
        quizEscalationSkipCount: typeof p.quizEscalationSkipCount === "number" ? p.quizEscalationSkipCount : 0,
        quizEscalationDismissed: p.quizEscalationDismissed === true,
      };
    }
  } catch (err) {
    console.error("Firebase profile load error:", err);
  }
  return DEFAULT_PROFILE;
}

async function initializeChargesForNewUser(userId: string): Promise<void> {
  const chargesSnap = await get(ref(db, `users/${userId}/charges`));
  if (!chargesSnap.exists()) {
    const now = new Date().toISOString();
    const writes: Promise<void>[] = [];

    for (const cat of CHARGE_CATEGORIES) {
      writes.push(
        set(ref(db, `users/${userId}/charges/${cat.id}`), {
          name: cat.name,
          icon: cat.icon,
          order: cat.order,
          locked: true,
          createdAt: now,
        })
      );
    }

    for (const charge of CHARGES_DATA) {
      writes.push(
        set(ref(db, `users/${userId}/charges/${charge.categoryId}/rubriques/${charge.id}`), {
          name: charge.name,
          prevu: charge.montantPrevu,
          reel: 0,
          locked: true,
          createdAt: now,
          updatedAt: now,
        })
      );
    }

    await Promise.all(writes);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [migrationStatus, setMigrationStatus] = useState<MigrationResult | "running" | null>(null);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const lastActivity = parseInt(localStorage.getItem("last-activity") || "0");
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - lastActivity > thirtyDays) {
          await signOut(auth);
          setLoading(false);
          return;
        }
        const profile = await loadProfileFromFirebase(firebaseUser.uid);
        setUserProfile(profile);
        localStorage.setItem("last-activity", Date.now().toString());
        initializeChargesForNewUser(firebaseUser.uid).catch(console.error);
        migrateGroceryToBudgetCourses().then((result) => {
          if (result.success && result.migrated > 0) {
            console.log(`✅ ${result.migrated} dépenses grocery migrées vers budgetCourses`);
          }
        }).catch(console.error);

        const hasLocalData = !!localStorage.getItem("debt-snowball-data");
        if (hasLocalData && !profile.migrationComplete) {
          setMigrationStatus("running");
          const result = await runLocalStorageMigration(
            firebaseUser.uid,
            profile.migrationComplete ?? false
          );
          setMigrationStatus(result.status !== "skipped" ? result : null);
        }
      } else {
        setUserProfile(DEFAULT_PROFILE);
        setMigrationStatus(null);
      }
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
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
    localStorage.removeItem("currentProfile");
    localStorage.removeItem("wizard-dismissed");
  };

  const saveUserProfile = async (userType: UserType) => {
    if (!user) return;
    const profile = {
      userType,
      firstTimeSetupComplete: true,
      namesCompleted: false,
      memberName: null,
      partnerName: null,
      quizCompleted: false,
      quizAnswers: null,
      profileType: null,
      profileTimestamp: null,
      profileHistory: [],
    };
    await set(ref(db, `users/${user.uid}/profile`), profile);
    setUserProfile((prev) => ({ ...prev, ...profile }));
  };

  const saveNames = async (memberName: string, partnerName: string | null) => {
    if (!user) return;
    await update(ref(db, `users/${user.uid}/profile`), {
      namesCompleted: true,
      memberName,
      partnerName,
    });
    setUserProfile((prev) => ({ ...prev, namesCompleted: true, memberName, partnerName }));
  };

  const saveQuizAnswers = async (answers: QuizAnswers) => {
    if (!user) return { previousProfile: null, newProfile: computeProfile(answers) };
    const newProfileType = computeProfile(answers);
    const timestamp = new Date().toISOString();

    const prevHistory: ProfileHistoryEntry[] = userProfile.profileHistory ?? [];
    const previousProfile = userProfile.profileType;
    const updatedHistory: ProfileHistoryEntry[] =
      previousProfile && previousProfile !== newProfileType
        ? [
            ...prevHistory,
            {
              type: previousProfile,
              timestamp: userProfile.profileTimestamp ?? timestamp,
            },
          ]
        : prevHistory;

    await update(ref(db, `users/${user.uid}/profile`), {
      quizCompleted: true,
      quizAnswers: answers,
      profileType: newProfileType,
      profileTimestamp: timestamp,
      profileHistory: updatedHistory,
    });

    setUserProfile((prev) => ({
      ...prev,
      quizCompleted: true,
      quizAnswers: answers,
      profileType: newProfileType,
      profileTimestamp: timestamp,
      profileHistory: updatedHistory,
    }));

    const perProfileKey = userProfile.userType === "couple" ? "boss_profile" : "single_profile";
    await update(ref(db, `users/${user.uid}/${perProfileKey}`), {
      quizCompleted: true,
      profileType: newProfileType,
      profileDescription: PROFILES[newProfileType].description,
      quizCompletedAt: timestamp,
      quizAnswers: answers,
    });

    return { previousProfile, newProfile: newProfileType };
  };

  const skipQuiz = async () => {
    if (!user) return;
    await update(ref(db, `users/${user.uid}/profile`), { quizCompleted: true });
    setUserProfile((prev) => ({ ...prev, quizCompleted: true }));
  };

  const resetQuiz = async () => {
    if (!user) return;
    await update(ref(db, `users/${user.uid}/profile`), { quizCompleted: false });
    setUserProfile((prev) => ({ ...prev, quizCompleted: false }));
  };

  const savePartnerQuizAnswers = async (answers: QuizAnswers): Promise<{ newProfile: ProfileType }> => {
    const newProfileType = computeProfile(answers);
    const timestamp = new Date().toISOString();
    if (user) {
      await update(ref(db, `users/${user.uid}/profile`), {
        partnerQuizCompleted: true,
        partnerProfileType: newProfileType,
      });
      setUserProfile((prev) => ({
        ...prev,
        partnerQuizCompleted: true,
        partnerProfileType: newProfileType,
      }));
      await update(ref(db, `users/${user.uid}/wife_profile`), {
        quizCompleted: true,
        profileType: newProfileType,
        profileDescription: PROFILES[newProfileType].description,
        quizCompletedAt: timestamp,
        quizAnswers: answers,
      });
    }
    return { newProfile: newProfileType };
  };

  const resetPartnerQuiz = async () => {
    if (!user) return;
    await update(ref(db, `users/${user.uid}/profile`), { partnerQuizCompleted: false });
    setUserProfile((prev) => ({ ...prev, partnerQuizCompleted: false }));
  };

  const resetNamesCompleted = async () => {
    if (!user) return;
    await update(ref(db, `users/${user.uid}/profile`), { namesCompleted: false });
    setUserProfile((prev) => ({ ...prev, namesCompleted: false }));
  };

  const dismissMigration = () => setMigrationStatus(null);

  const saveSetupStep = async (step: "balance" | "credits" | "expenses" | "savings" | "couple") => {
    if (!user) return;
    const key = `setup${step.charAt(0).toUpperCase() + step.slice(1)}Done` as keyof UserProfile;
    await update(ref(db, `users/${user.uid}/profile`), { [key]: true });
    setUserProfile((prev) => ({ ...prev, [key]: true }));
    await update(ref(db, `users/${user.uid}/onboarding`), {
      [`step${["balance","credits","expenses","savings","couple"].indexOf(step) + 1}_completed`]: true,
      lastUpdated: new Date().toISOString(),
    });
  };

  const markOnboardingComplete = async () => {
    if (!user) return;
    const now = new Date().toISOString();
    await Promise.all([
      update(ref(db, `users/${user.uid}/onboarding`), {
        completed: true,
        lastUpdated: now,
      }),
      update(ref(db, `users/${user.uid}/profile`), {
        setupBalanceDone: true,
        setupCreditsDone: true,
        setupExpensesDone: true,
        setupSavingsDone: true,
      }),
    ]);
    setUserProfile((prev) => ({
      ...prev,
      setupBalanceDone: true,
      setupCreditsDone: true,
      setupExpensesDone: true,
      setupSavingsDone: true,
    }));
  };

  const saveFinancesInitialBalance = async (amount: number) => {
    if (!user) return;
    await update(ref(db, `users/${user.uid}/finances`), {
      initialBalance: amount,
      currentBalance: amount,
      lastUpdated: new Date().toISOString(),
    });
  };

  const saveCoupleInviteCode = async (): Promise<string> => {
    const code = Math.random().toString(36).slice(2, 10).toUpperCase();
    if (user) {
      await update(ref(db, `users/${user.uid}/couple`), {
        inviteCode: code,
        createdAt: new Date().toISOString(),
      });
    }
    return code;
  };

  const incrementEscalationSkip = async () => {
    if (!user) return;
    const newCount = userProfile.quizEscalationSkipCount + 1;
    await update(ref(db, `users/${user.uid}/profile`), { quizEscalationSkipCount: newCount });
    setUserProfile((prev) => ({ ...prev, quizEscalationSkipCount: newCount }));
  };

  const setEscalationDismissed = async () => {
    if (!user) return;
    await update(ref(db, `users/${user.uid}/profile`), { quizEscalationDismissed: true });
    setUserProfile((prev) => ({ ...prev, quizEscalationDismissed: true }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        userProfile,
        migrationStatus,
        login,
        register,
        logout,
        saveUserProfile,
        saveNames,
        saveQuizAnswers,
        savePartnerQuizAnswers,
        skipQuiz,
        resetQuiz,
        resetPartnerQuiz,
        resetNamesCompleted,
        dismissMigration,
        saveSetupStep,
        markOnboardingComplete,
        saveFinancesInitialBalance,
        saveCoupleInviteCode,
        incrementEscalationSkip,
        setEscalationDismissed,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
