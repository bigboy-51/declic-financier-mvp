import { useState, useEffect, useCallback, useRef } from "react";

interface ChallengeEntry {
  completed: boolean;
  pointsAwarded: boolean;
}

interface StreakMeta {
  streak: number;
  lastDate: string;
}

interface ChallengesData {
  dailyKey: string;
  daily: {
    checkIn: ChallengeEntry;
    salaireRecu: ChallengeEntry;
    journeeSobre: ChallengeEntry;
    budgetCourses: ChallengeEntry;
  };
  weeklyKey: string;
  weekly: {
    paiementTemps: ChallengeEntry;
    tresoPositive: ChallengeEntry;
    actifDays: number;
    actifDaysSet: string[];
    streakDays: number;
  };
  monthlyKey: string;
  monthly: {
    moisAccompli: ChallengeEntry;
    dettesDiminuent: ChallengeEntry;
    budgetParfait: ChallengeEntry;
    surplusMaximise: ChallengeEntry;
    previousDebt: number;
  };
  streakMeta?: StreakMeta;
}

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function getWeekKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const onejan = new Date(year, 0, 1);
  const weekNum = Math.ceil(
    ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7,
  );
  return `${year}-W${String(weekNum).padStart(2, "0")}`;
}

function getMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const newEntry = (completed = false): ChallengeEntry => ({
  completed,
  pointsAwarded: false,
});

function getDefault(): ChallengesData {
  return {
    dailyKey: getTodayKey(),
    daily: {
      checkIn: newEntry(),
      salaireRecu: newEntry(),
      journeeSobre: newEntry(),
      budgetCourses: newEntry(),
    },
    weeklyKey: getWeekKey(),
    weekly: {
      paiementTemps: newEntry(),
      tresoPositive: newEntry(),
      actifDays: 0,
      actifDaysSet: [],
      streakDays: 0,
    },
    monthlyKey: getMonthKey(),
    monthly: {
      moisAccompli: newEntry(),
      dettesDiminuent: newEntry(),
      budgetParfait: newEntry(),
      surplusMaximise: newEntry(),
      previousDebt: 0,
    },
    streakMeta: { streak: 0, lastDate: "" },
  };
}

function loadAndMigrate(raw: ChallengesData | null): ChallengesData {
  if (!raw) return getDefault();
  const todayKey = getTodayKey();
  const weekKey = getWeekKey();
  const monthKey = getMonthKey();
  const def = getDefault();

  const parsed: ChallengesData = JSON.parse(JSON.stringify(raw));

  if (parsed.dailyKey !== todayKey) {
    parsed.daily = def.daily;
    parsed.dailyKey = todayKey;
  }
  if (parsed.weeklyKey !== weekKey) {
    parsed.weekly = def.weekly;
    parsed.weeklyKey = weekKey;
  }
  if (parsed.monthlyKey !== monthKey) {
    const prevDebt = parsed.monthly?.previousDebt ?? 0;
    parsed.monthly = { ...def.monthly, previousDebt: prevDebt };
    parsed.monthlyKey = monthKey;
  }

  parsed.daily = { ...def.daily, ...parsed.daily };
  parsed.weekly = { ...def.weekly, ...parsed.weekly };
  parsed.monthly = { ...def.monthly, ...parsed.monthly };
  parsed.streakMeta = parsed.streakMeta ?? def.streakMeta;

  return parsed;
}

interface UseChallengesParams {
  incomes: Array<{ receivedDate?: string | null }>;
  groceryExpenses: Array<{ date: string; amount: number }>;
  groceryBudget: number;
  expenses: Array<{ amount: number; actualAmount: number }>;
  dynamicBalance: number;
  totalDebt: number;
  lastPaymentMonth?: string;
  addPoints: (amount: number, reason: string) => void;
}

export function useChallenges(
  {
    incomes,
    groceryExpenses,
    groceryBudget,
    expenses,
    dynamicBalance,
    totalDebt,
    lastPaymentMonth,
    addPoints,
  }: UseChallengesParams,
  fbData: ChallengesData | null,
  onSave: (data: ChallengesData) => void,
) {
  const [data, setData] = useState<ChallengesData>(() => loadAndMigrate(fbData));
  const addPointsRef = useRef(addPoints);
  const lastLocalWrite = useRef(0);
  const onSaveRef = useRef(onSave);

  useEffect(() => { addPointsRef.current = addPoints; }, [addPoints]);
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

  // Sync Firebase updates into local state
  useEffect(() => {
    if (fbData == null) return;
    if (Date.now() - lastLocalWrite.current < 4000) return;
    setData(loadAndMigrate(fbData));
  }, [fbData]);

  // Save to Firebase on every local change
  useEffect(() => {
    lastLocalWrite.current = Date.now();
    onSaveRef.current(data);
  }, [data]);

  const currentMonthKey = getMonthKey();
  const todayKey = getTodayKey();

  const salaryReceived = incomes.some((i) => i.receivedDate != null);
  const todayGroceries = groceryExpenses.filter((e) => (e.date || "").startsWith(todayKey));
  const totalGrocerySpent = groceryExpenses.reduce((s, e) => s + e.amount, 0);
  const withinBudget = totalGrocerySpent <= groceryBudget;
  const journeeSobre = todayGroceries.length === 0;
  const paymentApplied = lastPaymentMonth === currentMonthKey;
  const tresoPositive = dynamicBalance > 0;
  const budgetParfait = expenses.every((e) => e.actualAmount <= e.amount);

  useEffect(() => {
    setData((prev) => {
      let changed = false;
      const next = JSON.parse(JSON.stringify(prev)) as ChallengesData;

      const tryComplete = (
        entry: ChallengeEntry,
        condition: boolean,
        points: number,
        reason: string,
      ) => {
        if (condition && !entry.completed) {
          entry.completed = true;
          changed = true;
        }
        if (entry.completed && !entry.pointsAwarded) {
          addPointsRef.current(points, reason);
          entry.pointsAwarded = true;
          changed = true;
        }
        if (!condition && entry.completed && !entry.pointsAwarded) {
          entry.completed = false;
          changed = true;
        }
      };

      tryComplete(next.daily.checkIn, true, 5, "Check-in financier ✓");
      tryComplete(next.daily.salaireRecu, salaryReceived, 20, "Salaire reçu ✓");
      tryComplete(next.daily.journeeSobre, journeeSobre, 10, "Journée sobre ✓");
      tryComplete(next.daily.budgetCourses, withinBudget, 15, "Budget courses respecté ✓");
      tryComplete(next.weekly.paiementTemps, paymentApplied, 30, "Paiement à temps ✓");
      tryComplete(next.weekly.tresoPositive, tresoPositive, 40, "Trésorerie positive ✓");
      tryComplete(
        next.monthly.dettesDiminuent,
        next.monthly.previousDebt > 0 && totalDebt < next.monthly.previousDebt,
        75,
        "Dettes en baisse ✓",
      );
      tryComplete(next.monthly.budgetParfait, budgetParfait, 60, "Budget parfait ✓");

      if (!next.weekly.actifDaysSet.includes(todayKey)) {
        next.weekly.actifDaysSet = [...next.weekly.actifDaysSet, todayKey];
        next.weekly.actifDays = next.weekly.actifDaysSet.length;
        changed = true;
      }

      // Streak tracking — stored in Firebase via streakMeta
      const meta = next.streakMeta ?? { streak: 0, lastDate: "" };
      if (meta.lastDate !== todayKey) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        const newStreak = meta.lastDate === yesterday ? meta.streak + 1 : 1;
        next.streakMeta = { streak: newStreak, lastDate: todayKey };
        next.weekly.streakDays = newStreak;
        changed = true;
      } else {
        next.weekly.streakDays = meta.streak;
      }

      if (!changed) return prev;
      return next;
    });
  }, [
    salaryReceived,
    journeeSobre,
    withinBudget,
    paymentApplied,
    tresoPositive,
    budgetParfait,
    totalDebt,
    todayKey,
  ]);

  const onMonthClosed = useCallback((currentDebt: number) => {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as ChallengesData;
      if (!next.monthly.moisAccompli.completed) {
        next.monthly.moisAccompli.completed = true;
        next.monthly.moisAccompli.pointsAwarded = true;
        addPointsRef.current(100, "Mois accompli ✓");
      }
      next.monthly.previousDebt = currentDebt;
      return next;
    });
  }, []);

  const onSurplusApplied = useCallback(() => {
    setData((prev) => {
      if (prev.monthly.surplusMaximise.completed) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as ChallengesData;
      next.monthly.surplusMaximise.completed = true;
      next.monthly.surplusMaximise.pointsAwarded = true;
      addPointsRef.current(50, "Surplus maximisé ✓");
      return next;
    });
  }, []);

  const onPaymentApplied = useCallback(() => {
    setData((prev) => {
      if (prev.weekly.paiementTemps.completed) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as ChallengesData;
      next.weekly.paiementTemps.completed = true;
      next.weekly.paiementTemps.pointsAwarded = true;
      addPointsRef.current(30, "Paiement à temps ✓");
      return next;
    });
  }, []);

  const dailyCompleted =
    (data.daily.checkIn.completed ? 1 : 0) +
    (data.daily.salaireRecu.completed ? 1 : 0) +
    (data.daily.journeeSobre.completed ? 1 : 0) +
    (data.daily.budgetCourses.completed ? 1 : 0);

  const weeklyCompleted =
    (data.weekly.paiementTemps.completed ? 1 : 0) +
    (data.weekly.tresoPositive.completed ? 1 : 0) +
    (data.weekly.actifDays >= 5 ? 1 : 0) +
    (data.weekly.streakDays >= 7 ? 1 : 0);

  const monthlyCompleted =
    (data.monthly.moisAccompli.completed ? 1 : 0) +
    (data.monthly.dettesDiminuent.completed ? 1 : 0) +
    (data.monthly.budgetParfait.completed ? 1 : 0) +
    (data.monthly.surplusMaximise.completed ? 1 : 0);

  return {
    challengeData: data,
    dailyCompleted,
    weeklyCompleted,
    monthlyCompleted,
    onMonthClosed,
    onSurplusApplied,
    onPaymentApplied,
  };
}
