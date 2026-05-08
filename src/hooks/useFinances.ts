import { useEffect, useState, useCallback } from "react";
import { ref, onValue, off, set, push, remove, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export interface Income {
  id: string;
  name: string;
  amount: number;
  receiptDay: number;
  receivedDate: string | null;
}

export interface FinancesState {
  startingBalance: number;
  currentMonth: string;
}

export function useFinances() {
  const { user } = useAuth();
  const [finances, setFinances] = useState<FinancesState>({ startingBalance: 0, currentMonth: "" });
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    let finLoaded = false;
    let incLoaded = false;

    const checkDone = () => {
      if (finLoaded && incLoaded) setLoading(false);
    };

    const finRef = ref(db, `users/${user.uid}/finances`);
    const finUnsub = onValue(finRef, (snap) => {
      const v = snap.val() ?? {};
      setFinances({
        startingBalance: Number(v.startingBalance ?? 0),
        currentMonth: String(v.currentMonth ?? ""),
      });
      finLoaded = true;
      checkDone();
    });

    const incRef = ref(db, `users/${user.uid}/incomes`);
    const incUnsub = onValue(incRef, (snap) => {
      const raw = snap.val() ?? {};
      const loaded: Income[] = Object.entries(raw).map(([id, val]) => {
        const v = val as Record<string, unknown>;
        return {
          id,
          name: String(v.name ?? ""),
          amount: Number(v.amount ?? 0),
          receiptDay: Number(v.receiptDay ?? 1),
          receivedDate: v.receivedDate ? String(v.receivedDate) : null,
        };
      });
      loaded.sort((a, b) => a.name.localeCompare(b.name, "fr"));
      setIncomes(loaded);
      incLoaded = true;
      checkDone();
    });

    return () => {
      off(finRef, "value", finUnsub);
      off(incRef, "value", incUnsub);
    };
  }, [user]);

  const addIncome = useCallback(async (name: string, amount: number, receiptDay: number) => {
    if (!user) return;
    await push(ref(db, `users/${user.uid}/incomes`), {
      name,
      amount,
      receiptDay,
      receivedDate: null,
      createdAt: new Date().toISOString(),
    });
  }, [user]);

  const markReceived = useCallback(async (id: string, date: string | null) => {
    if (!user) return;
    await update(ref(db, `users/${user.uid}/incomes/${id}`), {
      receivedDate: date,
      updatedAt: new Date().toISOString(),
    });
  }, [user]);

  const updateIncome = useCallback(async (id: string, name: string, amount: number, receiptDay: number) => {
    if (!user) return;
    await update(ref(db, `users/${user.uid}/incomes/${id}`), {
      name, amount, receiptDay, updatedAt: new Date().toISOString(),
    });
  }, [user]);

  const deleteIncome = useCallback(async (id: string) => {
    if (!user) return;
    await remove(ref(db, `users/${user.uid}/incomes/${id}`));
  }, [user]);

  const updateStartingBalance = useCallback(async (amount: number) => {
    if (!user) return;
    await update(ref(db, `users/${user.uid}/finances`), {
      startingBalance: amount,
      updatedAt: new Date().toISOString(),
    });
  }, [user]);

  const totalExpected = incomes.reduce((s, i) => s + i.amount, 0);
  const totalReceived = incomes.filter((i) => i.receivedDate).reduce((s, i) => s + i.amount, 0);

  return {
    finances,
    incomes,
    loading,
    totalExpected,
    totalReceived,
    addIncome,
    markReceived,
    updateIncome,
    deleteIncome,
    updateStartingBalance,
  };
}
