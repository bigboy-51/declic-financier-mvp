import { useEffect, useState, useCallback } from "react";
import { ref, onValue, off, push, remove, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export type MoyenPaiement = "CB" | "Cash" | "Retrait" | "Chèque";

export interface Course {
  id: string;
  date: string;
  montant: number;
  label: string;
  moyenPaiement: MoyenPaiement;
  createdAt: string;
}

export function useCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const r = ref(db, `users/${user.uid}/courses`);
    const unsub = onValue(r, (snap) => {
      const raw = snap.val() ?? {};
      const loaded: Course[] = Object.entries(raw).map(([id, val]) => {
        const v = val as Record<string, unknown>;
        return {
          id,
          date: String(v.date ?? ""),
          montant: Number(v.montant ?? 0),
          label: String(v.label ?? ""),
          moyenPaiement: (v.moyenPaiement ?? "CB") as MoyenPaiement,
          createdAt: String(v.createdAt ?? ""),
        };
      });
      loaded.sort((a, b) => b.date.localeCompare(a.date));
      setCourses(loaded);
      setLoading(false);
    });

    return () => off(r, "value", unsub);
  }, [user]);

  const addCourse = useCallback(async (
    date: string,
    montant: number,
    label: string,
    moyenPaiement: MoyenPaiement,
  ) => {
    if (!user) return;
    const now = new Date().toISOString();
    await push(ref(db, `users/${user.uid}/courses`), {
      date,
      montant: parseFloat(montant.toFixed(2)),
      label,
      moyenPaiement,
      createdAt: now,
    });
  }, [user]);

  const deleteCourse = useCallback(async (id: string) => {
    if (!user) return;
    await remove(ref(db, `users/${user.uid}/courses/${id}`));
  }, [user]);

  const updateCourse = useCallback(async (id: string, updates: Partial<Omit<Course, "id">>) => {
    if (!user) return;
    await update(ref(db, `users/${user.uid}/courses/${id}`), updates);
  }, [user]);

  const getTotalForMonth = (year: number, month: number) =>
    courses
      .filter((c) => {
        const [y, m] = c.date.split("-");
        return parseInt(y) === year && parseInt(m) === month;
      })
      .reduce((s, c) => s + c.montant, 0);

  const now = new Date();
  const totalCurrentMonth = getTotalForMonth(now.getFullYear(), now.getMonth() + 1);

  return {
    courses,
    loading,
    totalCurrentMonth,
    getTotalForMonth,
    addCourse,
    deleteCourse,
    updateCourse,
  };
}
