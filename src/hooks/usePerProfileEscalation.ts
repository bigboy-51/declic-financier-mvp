import { useState, useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase";

export interface PerProfileEscalation {
  escalationLevel: 0 | 1 | 2 | 3;
  skipCount: number;
  lastSkippedAt: string | null;
  userContinuedWithoutQuiz: boolean;
  quizCompleted: boolean;
}

const DEFAULT_ESCALATION: PerProfileEscalation = {
  escalationLevel: 0,
  skipCount: 0,
  lastSkippedAt: null,
  userContinuedWithoutQuiz: false,
  quizCompleted: false,
};

export function usePerProfileEscalation(uid: string | null, profileKey: string | null) {
  const [data, setData] = useState<PerProfileEscalation>(DEFAULT_ESCALATION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !profileKey) {
      setData(DEFAULT_ESCALATION);
      setLoading(false);
      return;
    }
    const escalationRef = ref(db, `users/${uid}/${profileKey}/quizEscalation`);
    const unsub = onValue(escalationRef, (snap) => {
      if (snap.exists()) {
        const v = snap.val();
        setData({
          escalationLevel: (([0, 1, 2, 3].includes(v.escalationLevel) ? v.escalationLevel : 0)) as 0 | 1 | 2 | 3,
          skipCount: typeof v.skipCount === "number" ? v.skipCount : 0,
          lastSkippedAt: v.lastSkippedAt ?? null,
          userContinuedWithoutQuiz: v.userContinuedWithoutQuiz === true,
          quizCompleted: v.quizCompleted === true,
        });
      } else {
        setData(DEFAULT_ESCALATION);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [uid, profileKey]);

  const skip = async () => {
    if (!uid || !profileKey) return;
    const newSkipCount = data.skipCount + 1;
    const newLevel = Math.min(3, newSkipCount) as 0 | 1 | 2 | 3;
    await update(ref(db, `users/${uid}/${profileKey}/quizEscalation`), {
      skipCount: newSkipCount,
      escalationLevel: newLevel,
      lastSkippedAt: new Date().toISOString(),
    });
  };

  const continueWithoutQuiz = async () => {
    if (!uid || !profileKey) return;
    await update(ref(db, `users/${uid}/${profileKey}/quizEscalation`), {
      userContinuedWithoutQuiz: true,
      escalationLevel: 3,
      skipCount: Math.max(data.skipCount, 3),
      lastSkippedAt: new Date().toISOString(),
    });
  };

  const markComplete = async () => {
    if (!uid || !profileKey) return;
    await update(ref(db, `users/${uid}/${profileKey}/quizEscalation`), {
      quizCompleted: true,
    });
  };

  return { data, loading, skip, continueWithoutQuiz, markComplete };
}
