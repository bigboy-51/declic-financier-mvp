import { useState, useEffect, useMemo, useRef } from "react";

const DEFAULT_REWARDS = {
  totalPoints: 0,
  badges: [],
  currentStreak: 0,
  lastPaymentDate: null,
  achievements: {
    firstPayment: false,
    monthWithoutOverspend: false,
    snowballTriggered: false,
    budgetRespected: false,
    threeMonthsStreak: false,
  },
};

export function useRewards(credits, expenses, fbData, onSave) {
  const [rewards, setRewards] = useState(() => {
    return fbData && typeof fbData === "object" ? fbData : DEFAULT_REWARDS;
  });

  const lastLocalWrite = useRef(0);
  const onSaveRef = useRef(onSave);
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

  // Sync Firebase updates into local state
  useEffect(() => {
    if (fbData == null) return;
    if (Date.now() - lastLocalWrite.current < 4000) return;
    setRewards(typeof fbData === "object" ? fbData : DEFAULT_REWARDS);
  }, [fbData]);

  // Save to Firebase on every local change
  useEffect(() => {
    lastLocalWrite.current = Date.now();
    onSaveRef.current(rewards);
  }, [rewards]);

  const monthlyStats = useMemo(() => {
    const totalDebt = credits?.reduce((sum, c) => sum + (c.remainingAmount || 0), 0) || 0;
    const totalExpensesBudget = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    const totalExpensesReal = expenses?.reduce((sum, e) => sum + (e.actualAmount || 0), 0) || 0;
    const monthlyPayment = credits?.reduce((sum, c) => sum + (c.monthlyPayment || 0), 0) || 0;
    const debtProgression = totalDebt > 0 ? "negative" : "cleared";
    const budgetRespected = totalExpensesReal <= totalExpensesBudget;
    return { totalDebt, totalExpensesBudget, totalExpensesReal, monthlyPayment, debtProgression, budgetRespected };
  }, [credits, expenses]);

  const addPoints = (amount, reason) => {
    setRewards((prev) => ({ ...prev, totalPoints: prev.totalPoints + amount }));
    window.dispatchEvent(new CustomEvent("challenge-completed", { detail: { points: amount, reason } }));
  };

  const unlockBadge = (badgeId, badgeName, description) => {
    setRewards((prev) => {
      if (prev.badges.some((b) => b.id === badgeId)) return prev;
      return {
        ...prev,
        badges: [
          ...prev.badges,
          { id: badgeId, name: badgeName, description, unlockedAt: new Date().toISOString(), points: 50 },
        ],
        totalPoints: prev.totalPoints + 50,
      };
    });
  };

  const recordPayment = () => {
    const now = new Date().toISOString();
    addPoints(100, "Paiement mensuel appliqué");
    if (!rewards.achievements.firstPayment) {
      unlockBadge("first-payment", "🎯 Premier pas", "Appliquer le premier paiement");
      setRewards((prev) => ({
        ...prev,
        achievements: { ...prev.achievements, firstPayment: true },
      }));
    }
    setRewards((prev) => ({
      ...prev,
      lastPaymentDate: now,
      currentStreak: prev.currentStreak + 1,
    }));
    if (rewards.currentStreak + 1 >= 3) {
      unlockBadge("three-month-streak", "🔥 3 mois consécutifs", "Effectuer 3 paiements d'affilée");
      setRewards((prev) => ({
        ...prev,
        achievements: { ...prev.achievements, threeMonthsStreak: true },
      }));
    }
  };

  const checkBudgetRespected = () => {
    if (monthlyStats.budgetRespected && !rewards.achievements.budgetRespected) {
      addPoints(75, "Budget respecté ce mois");
      unlockBadge("budget-master", "💰 Budget Master", "Respecter le budget ce mois-ci");
      setRewards((prev) => ({
        ...prev,
        achievements: { ...prev.achievements, budgetRespected: true },
      }));
    }
  };

  const checkSnowballProgress = () => {
    if (monthlyStats.debtProgression === "negative" && !rewards.achievements.snowballTriggered) {
      addPoints(150, "🎉 Snowball en action !");
      unlockBadge("snowball-rolling", "❄️ Snowball en route", "Les dettes diminuent !");
      setRewards((prev) => ({
        ...prev,
        achievements: { ...prev.achievements, snowballTriggered: true },
      }));
    }
  };

  const resetMonthlyAchievements = () => {
    setRewards((prev) => ({
      ...prev,
      achievements: {
        firstPayment: prev.achievements.firstPayment,
        monthWithoutOverspend: false,
        snowballTriggered: false,
        budgetRespected: false,
        threeMonthsStreak: prev.achievements.threeMonthsStreak,
      },
    }));
  };

  return {
    rewards,
    monthlyStats,
    addPoints,
    unlockBadge,
    recordPayment,
    checkBudgetRespected,
    checkSnowballProgress,
    resetMonthlyAchievements,
  };
}
