import { useState, useEffect } from "react";
import { ref, onValue, off } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export type MoyenPaiement = "CB" | "Cash" | "Retrait" | "Chèque";

export interface BudgetCourse {
  id: string;
  date: string;
  montant: number;
  moyenPaiement: MoyenPaiement;
  label?: string;
  createdAt: string;
  updatedAt: string;
  source?: string;
  originalGroceryId?: string;
}

export const useBudgetCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<BudgetCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const r = ref(db, `users/${user.uid}/budgetCourses`);
    const unsub = onValue(
      r,
      (snap) => {
        const raw = snap.val() ?? {};
        const loaded: BudgetCourse[] = Object.entries(raw).map(([id, val]) => {
          const v = val as Record<string, unknown>;
          return {
            id,
            date:           String(v.date ?? ""),
            montant:        Number(v.montant ?? 0),
            moyenPaiement:  (v.moyenPaiement ?? "CB") as MoyenPaiement,
            label:          String(v.label ?? ""),
            createdAt:      String(v.createdAt ?? ""),
            updatedAt:      String(v.updatedAt ?? ""),
            source:         String(v.source ?? "manual"),
            originalGroceryId: v.originalGroceryId ? String(v.originalGroceryId) : undefined,
          };
        });

        // Trier par date décroissante
        loaded.sort((a, b) => b.date.localeCompare(a.date));
        setCourses(loaded);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Erreur fetch budgetCourses:", error);
        setLoading(false);
      }
    );

    return () => off(r, "value", unsub);
  }, [user]);

  const getTotalsByMonth = (year: number, month: number): number => {
    return courses
      .filter((c) => {
        const [y, m] = c.date.split("-");
        return parseInt(y) === year && parseInt(m) === month;
      })
      .reduce((sum, c) => sum + c.montant, 0);
  };

  const getTotalsByWeek = (startDate: Date): number => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    return courses
      .filter((c) => {
        const d = new Date(c.date);
        return d >= startDate && d <= endDate;
      })
      .reduce((sum, c) => sum + c.montant, 0);
  };

  const getTotalByPaymentMethod = (): Record<MoyenPaiement, number> => ({
    CB:       courses.filter((c) => c.moyenPaiement === "CB").reduce((s, c) => s + c.montant, 0),
    Cash:     courses.filter((c) => c.moyenPaiement === "Cash").reduce((s, c) => s + c.montant, 0),
    Retrait:  courses.filter((c) => c.moyenPaiement === "Retrait").reduce((s, c) => s + c.montant, 0),
    Chèque:   courses.filter((c) => c.moyenPaiement === "Chèque").reduce((s, c) => s + c.montant, 0),
  });

  const totalGlobal = courses.reduce((s, c) => s + c.montant, 0);

  return {
    courses,
    loading,
    totalGlobal,
    getTotalsByMonth,
    getTotalsByWeek,
    getTotalByPaymentMethod,
  };
};
