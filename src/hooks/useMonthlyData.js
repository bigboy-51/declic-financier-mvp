import { useState, useEffect, useRef } from "react";

export function useMonthlyData(fbData, onSave) {
  const [monthlyHistory, setMonthlyHistory] = useState(() => {
    return fbData && typeof fbData === "object" ? fbData : {};
  });

  const [currentMonth, setCurrentMonth] = useState(() => {
    const saved = localStorage.getItem("current-month");
    return saved || new Date().toISOString().slice(0, 7);
  });

  const lastLocalWrite = useRef(0);
  const onSaveRef = useRef(onSave);
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

  // Sync Firebase updates into local state
  useEffect(() => {
    if (fbData == null) return;
    if (Date.now() - lastLocalWrite.current < 4000) return;
    setMonthlyHistory(typeof fbData === "object" ? fbData : {});
  }, [fbData]);

  // Save to Firebase on every local change
  useEffect(() => {
    lastLocalWrite.current = Date.now();
    onSaveRef.current(monthlyHistory);
  }, [monthlyHistory]);

  // Keep current-month in localStorage (local UI state only)
  useEffect(() => {
    localStorage.setItem("current-month", currentMonth);
  }, [currentMonth]);

  const captureMonthSnapshot = (credits, expenses, groceryExpenses) => {
    const totalCredits = credits.reduce((sum, c) => sum + (c.remainingAmount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalActualExpenses = expenses.reduce((sum, e) => sum + (e.actualAmount || 0), 0);
    const totalGroceryBudget = groceryExpenses.reduce((sum, g) => sum + (g.amount || 0), 0);
    const totalGrocerySpent = groceryExpenses.reduce((sum, g) => sum + (g.spent || 0), 0);

    return {
      month: currentMonth,
      timestamp: new Date().toISOString(),
      state: { credits, expenses, groceryExpenses },
      totals: {
        totalCredits,
        totalExpenses,
        totalActualExpenses,
        totalGroceryBudget,
        totalGrocerySpent,
        allCharges: totalExpenses + totalGroceryBudget,
      },
    };
  };

  const closeMonth = (credits, expenses, groceryExpenses) => {
    const snapshot = captureMonthSnapshot(credits, expenses, groceryExpenses);
    setMonthlyHistory((prev) => ({ ...prev, [currentMonth]: snapshot }));
    const nextMonth = getNextMonth(currentMonth);
    setCurrentMonth(nextMonth);
    return { success: true, closedMonth: currentMonth, nextMonth, snapshot };
  };

  const calculateDebtFreeProjection = (credits, monthlyPayment) => {
    const totalDebt = credits.reduce((sum, c) => sum + (c.remainingAmount || 0), 0);
    if (totalDebt <= 0) {
      return {
        scenarioA: { months: 0, date: new Date(), message: "✅ DEBT-FREE !" },
        scenarioB: { months: 0, date: new Date(), message: "✅ DEBT-FREE !" },
      };
    }
    const monthsA = Math.ceil(totalDebt / monthlyPayment);
    const dateA = new Date();
    dateA.setMonth(dateA.getMonth() + monthsA);
    const monthsB = Math.ceil(totalDebt / (monthlyPayment * 2));
    const dateB = new Date();
    dateB.setMonth(dateB.getMonth() + monthsB);
    return {
      scenarioA: {
        months: monthsA,
        date: dateA,
        message: `Rythme actuel: ${monthsA} mois (${dateA.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })})`,
      },
      scenarioB: {
        months: monthsB,
        date: dateB,
        message: `Si tu doubles: ${monthsB} mois (${dateB.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })})`,
        savings: monthsA - monthsB,
      },
    };
  };

  const getMonthComparison = (month1, month2) => {
    const snap1 = monthlyHistory[month1];
    const snap2 = monthlyHistory[month2];
    if (!snap1 || !snap2) return null;
    const progression = {
      debts: snap1.totals.totalCredits - snap2.totals.totalCredits,
      expenses: snap1.totals.totalExpenses - snap2.totals.totalExpenses,
      actual: snap1.totals.totalActualExpenses - snap2.totals.totalActualExpenses,
      grocery: snap1.totals.totalGrocerySpent - snap2.totals.totalGrocerySpent,
    };
    return {
      month1, month2, snap1, snap2, progression,
      snowballProgress: progression.debts > 0 ? "📈 Snowball progresse !" : "⚠️ Stagnation",
    };
  };

  const getNextMonth = (month) => {
    const [year, monthNum] = month.split("-");
    const next = parseInt(monthNum) + 1;
    if (next > 12) return parseInt(year) + 1 + "-01";
    return year + "-" + String(next).padStart(2, "0");
  };

  const getPreviousMonth = (month) => {
    const date = new Date(month + "-01");
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 7);
  };

  const getAllMonths = () => Object.keys(monthlyHistory).sort().reverse();

  return {
    monthlyHistory,
    currentMonth,
    setCurrentMonth,
    captureMonthSnapshot,
    closeMonth,
    calculateDebtFreeProjection,
    getMonthComparison,
    getNextMonth,
    getPreviousMonth,
    getAllMonths,
  };
}
