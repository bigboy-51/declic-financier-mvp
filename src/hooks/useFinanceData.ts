import { useState, useEffect, useCallback, useRef } from "react";
import {
  FinanceData,
  Income,
  Credit,
  Expense,
  GroceryExpense,
  ExpenseCategory,
} from "@/types/finance";

// ============================================
// CATALOGUE (source de vérité) — 31 charges fixes
// ============================================
const CATALOGUE_CHARGES_FIXES = [
  { id: "fix-edf", name: "EDF", montantDefaut: 151 },
  { id: "fix-essence", name: "Essence", montantDefaut: 200 },
  { id: "fix-assurance-voiture", name: "Assurance voiture", montantDefaut: 56 },
  { id: "fix-assurance-vie", name: "Assurance vie", montantDefaut: 30 },
  { id: "fix-foncier", name: "Foncier", montantDefaut: 105 },
  { id: "fix-impot-prelevement", name: "Impôt prélèvement", montantDefaut: 8 },
  { id: "fix-freebox", name: "Freebox", montantDefaut: 39 },
  { id: "fix-aide-maman", name: "Aide maman", montantDefaut: 30 },
  { id: "fix-veolia", name: "Veolia", montantDefaut: 60 },
  { id: "fix-cot.-bancaire", name: "Cot. bancaire", montantDefaut: 16 },
  { id: "fix-eau", name: "Eau", montantDefaut: 22 },
  { id: "fix-coiffeur", name: "Coiffeur", montantDefaut: 40 },
  { id: "fix-loisirs-famille", name: "Loisirs famille", montantDefaut: 50 },
  { id: "fix-cigare", name: "Cigare", montantDefaut: 40 },
  { id: "fix-chat", name: "Chat", montantDefaut: 40 },
  { id: "fix-cantine", name: "Cantine", montantDefaut: 50 },
  { id: "fix-prevoyance-min", name: "Prévoyance Min", montantDefaut: 52 },
  { id: "fix-charge-copro", name: "Charge de copro", montantDefaut: 65 },
  { id: "fix-noel", name: "Noël", montantDefaut: 40 },
  { id: "fix-free-mobile", name: "Free Mobile", montantDefaut: 92 },
  { id: "fix-ass-hab-cep", name: "Ass Hab C.Ep", montantDefaut: 30 },
  { id: "fix-cotisation-cep", name: "Cotisation C.Ep", montantDefaut: 12 },
  { id: "fix-mgp", name: "MGP", montantDefaut: 28.32 },
  { id: "fix-geoz", name: "GEOZ (JP)", montantDefaut: 28 },
  { id: "fix-tram", name: "TRAM (TransDev)", montantDefaut: 17 },
  { id: "fix-apple", name: "Apple (ChatGPT)", montantDefaut: 22.99 },
  { id: "fix-cplus", name: "C+", montantDefaut: 21.99 },
  { id: "fix-cadeau", name: "Cadeau", montantDefaut: 50 },
  { id: "fix-pharmacie", name: "Pharmacie fixe", montantDefaut: 35 },
  { id: "fix-obleu", name: "OBleu", montantDefaut: 28 },
  { id: "fix-entretien-voiture", name: "Entretien voiture", montantDefaut: 30 },
  { id: "fix-travaux", name: "Travaux", montantDefaut: 100 },
];

const CATALOGUE_CATEGORIES: Record<string, ExpenseCategory> = {
  "fix-edf": "logement",
  "fix-essence": "transport",
  "fix-assurance-voiture": "transport",
  "fix-assurance-vie": "finances",
  "fix-foncier": "logement",
  "fix-impot-prelevement": "finances",
  "fix-freebox": "finances",
  "fix-aide-maman": "divers",
  "fix-veolia": "logement",
  "fix-cot.-bancaire": "finances",
  "fix-eau": "logement",
  "fix-coiffeur": "divers",
  "fix-loisirs-famille": "loisirs",
  "fix-cigare": "loisirs",
  "fix-chat": "divers",
  "fix-cantine": "logement",
  "fix-prevoyance-min": "sante",
  "fix-charge-copro": "logement",
  "fix-noel": "loisirs",
  "fix-free-mobile": "finances",
  "fix-ass-hab-cep": "finances",
  "fix-cotisation-cep": "finances",
  "fix-mgp": "sante",
  "fix-geoz": "sante",
  "fix-tram": "transport",
  "fix-apple": "divers",
  "fix-cplus": "loisirs",
  "fix-cadeau": "loisirs",
  "fix-pharmacie": "sante",
  "fix-obleu": "logement",
  "fix-entretien-voiture": "transport",
  "fix-travaux": "logement",
};

function normalizeName(s = ""): string {
  return s
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function migrateExpenses(storedExpenses: Expense[]): Expense[] {
  if (!storedExpenses || storedExpenses.length === 0) {
    return CATALOGUE_CHARGES_FIXES.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.montantDefaut,
      actualAmount: 0,
      custom: false,
      category: CATALOGUE_CATEGORIES[item.id] ?? "divers",
    }));
  }

  const used = new Set<string>();

  const migrated = CATALOGUE_CHARGES_FIXES.map((catalogItem) => {
    let existing = storedExpenses.find((e) => e.id === catalogItem.id);

    if (!existing) {
      const target = normalizeName(catalogItem.name);
      existing = storedExpenses.find(
        (e) => normalizeName(e.name) === target && !used.has(e.id),
      );
    }

    if (existing) {
      used.add(existing.id);
      return {
        id: existing.id || catalogItem.id,
        name: catalogItem.name,
        amount: existing.amount,
        actualAmount: existing.actualAmount ?? 0,
        custom: false,
        category: (CATALOGUE_CATEGORIES[catalogItem.id] ??
          existing.category ??
          "divers") as ExpenseCategory,
      };
    }

    return {
      id: catalogItem.id,
      name: catalogItem.name,
      amount: catalogItem.montantDefaut,
      actualAmount: 0,
      custom: false,
      category: (CATALOGUE_CATEGORIES[catalogItem.id] ?? "divers") as ExpenseCategory,
    };
  });

  const custom = storedExpenses
    .filter((e) => !used.has(e.id) && e.custom === true)
    .map((e) => ({
      ...e,
      category: (e.category ?? "divers") as ExpenseCategory,
    }));

  return [...migrated, ...custom];
}

const defaultData: FinanceData = {
  incomes: [
    { id: "1", name: "JP", amount: 2090, receiptDate: 23 },
    { id: "2", name: "Nadia", amount: 2700, receiptDate: 28 },
  ],
  credits: [
    { id: "1", name: "AIRPOD", monthlyPayment: 49, remainingAmount: 342, initialAmount: 342 },
    { id: "2", name: "FRIGO", monthlyPayment: 74, remainingAmount: 442, initialAmount: 442 },
    { id: "3", name: "C. EP", monthlyPayment: 40, remainingAmount: 900, initialAmount: 900 },
    { id: "4", name: "MCBOOK", monthlyPayment: 107, remainingAmount: 961, initialAmount: 961 },
    { id: "5", name: "TRESO 2", monthlyPayment: 109, remainingAmount: 2785, initialAmount: 2785 },
    { id: "6", name: "IPHONE", monthlyPayment: 74, remainingAmount: 1740, initialAmount: 1740 },
    { id: "7", name: "IMMO", monthlyPayment: 849, remainingAmount: 80840, initialAmount: 80840 },
    { id: "8", name: "PRET TRESO", monthlyPayment: 767, remainingAmount: 44000, initialAmount: 44000 },
    { id: "9", name: "INTERET 1", monthlyPayment: 38, remainingAmount: 35000, initialAmount: 35000 },
    { id: "10", name: "INT 2", monthlyPayment: 28, remainingAmount: 15000, initialAmount: 15000 },
  ],
  expenses: CATALOGUE_CHARGES_FIXES.map((item) => ({
    id: item.id,
    name: item.name,
    amount: item.montantDefaut,
    actualAmount: 0,
    custom: false,
    category: (CATALOGUE_CATEGORIES[item.id] ?? "divers") as ExpenseCategory,
  })),
  groceryBudget: 700,
  startingBalance: -1500,
  groceryExpenses: [],
  expensesLocked: false,
  creditsLocked: false,
  lastPaymentMonth: undefined,
  appliedCreditsAmount: 0,
};

function migrateCredits(credits: Credit[]): Credit[] {
  if (!Array.isArray(credits)) return [];
  return credits.map((c) => {
    if (c.id === "7" && c.name === "IMMO") {
      const needsUpdate =
        c.initialAmount === 77991 ||
        (c.remainingAmount === 77991 && c.initialAmount !== 80840);
      if (needsUpdate) {
        return { ...c, remainingAmount: 80840, initialAmount: 80840 };
      }
    }
    return c;
  });
}

function migrateGroceryTypes(expenses: GroceryExpense[]): GroceryExpense[] {
  if (!Array.isArray(expenses)) return [];
  const OLD_TO_NEW: Record<string, GroceryExpense["type"]> = {
    courses: "course",
    pharmacie: "autres",
    docteur: "autres",
    vetements: "autres",
    loisirs: "autres",
    autre: "autres",
  };
  return expenses.map((e) => {
    const mapped = OLD_TO_NEW[e.type];
    if (mapped) return { ...e, type: mapped };
    return e;
  });
}

function buildFromRaw(raw: any): FinanceData {
  const base = raw && typeof raw === "object" ? raw : {};
  const currentExpenses = Array.isArray(base.expenses) ? base.expenses : [];
  const variableSpends = {
    Essence: { entries: base.variableSpends?.Essence?.entries ?? [] },
    Cadeau: { entries: base.variableSpends?.Cadeau?.entries ?? [] },
    Pharmacie: { entries: base.variableSpends?.Pharmacie?.entries ?? [] },
    Travaux: { entries: base.variableSpends?.Travaux?.entries ?? [] },
    "Entretien voiture": {
      entries: base.variableSpends?.["Entretien voiture"]?.entries ?? [],
    },
    "Loisirs famille": {
      entries: base.variableSpends?.["Loisirs famille"]?.entries ?? [],
    },
  };
  return {
    ...defaultData,
    ...base,
    incomes: base.incomes ?? defaultData.incomes,
    credits: migrateCredits(base.credits ?? defaultData.credits),
    expenses: migrateExpenses(currentExpenses),
    groceryExpenses: migrateGroceryTypes(base.groceryExpenses ?? []),
    groceryBudget: base.groceryBudget ?? defaultData.groceryBudget,
    startingBalance: base.startingBalance ?? defaultData.startingBalance,
    expensesLocked: base.expensesLocked ?? false,
    creditsLocked: base.creditsLocked ?? false,
    lastPaymentMonth: base.lastPaymentMonth ?? undefined,
    appliedCreditsAmount: base.appliedCreditsAmount ?? 0,
    variableSpends,
  };
}

export function useFinanceData(
  fbData: FinanceData | null,
  onSave: (data: FinanceData) => void,
) {
  const [data, setData] = useState<FinanceData>(() =>
    fbData ? buildFromRaw(fbData) : defaultData,
  );

  const lastLocalWrite = useRef(0);
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // Sync incoming Firebase data into local state (partner update or new device)
  useEffect(() => {
    if (fbData == null) return;
    if (Date.now() - lastLocalWrite.current < 4000) return;
    setData(buildFromRaw(fbData));
  }, [fbData]);

  // Save to Firebase on every local change
  useEffect(() => {
    lastLocalWrite.current = Date.now();
    onSaveRef.current(data);
  }, [data]);

  const totalIncome = data.incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalCredits = data.credits.reduce((sum, c) => sum + c.monthlyPayment, 0);
  const grossExpenses = data.expenses
    .filter((e) => e.category !== "remboursements")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalReimbursementsPlanned = data.expenses
    .filter((e) => e.category === "remboursements")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = grossExpenses - totalReimbursementsPlanned;
  const surplus = totalIncome - totalCredits - totalExpenses - data.groceryBudget;
  const totalDebt = data.credits.reduce((sum, c) => sum + c.remainingAmount, 0);

  const updateIncome = useCallback(
    (id: string, updates: Partial<Pick<Income, "amount" | "receiptDate" | "receivedDate">>) => {
      setData((prev) => ({
        ...prev,
        incomes: prev.incomes.map((i) => (i.id === id ? { ...i, ...updates } : i)),
      }));
    },
    [],
  );

  const updateCredit = useCallback((id: string, updates: Partial<Credit>) => {
    setData((prev) => ({
      ...prev,
      credits: prev.credits.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  }, []);

  const deleteCredit = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      credits: prev.credits.filter((c) => c.id !== id),
    }));
  }, []);

  const addCredit = useCallback((credit: Omit<Credit, "id">) => {
    setData((prev) => ({
      ...prev,
      credits: [...prev.credits, { ...credit, id: Date.now().toString() }],
    }));
  }, []);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  }, []);

  const addExpense = useCallback((expense: Omit<Expense, "id">) => {
    setData((prev) => ({
      ...prev,
      expenses: [
        ...prev.expenses,
        {
          ...expense,
          actualAmount: expense.actualAmount ?? 0,
          custom: true,
          id: Date.now().toString(),
        },
      ],
    }));
  }, []);

  const toggleExpensesLock = useCallback(() => {
    setData((prev) => ({ ...prev, expensesLocked: !prev.expensesLocked }));
  }, []);

  const toggleCreditsLock = useCallback(() => {
    setData((prev) => ({ ...prev, creditsLocked: !prev.creditsLocked }));
  }, []);

  const applyMonthlyPayment = useCallback(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    setData((prev) => {
      if (prev.lastPaymentMonth === currentMonth) return prev;

      const unsettled = prev.credits.filter((c) => !c.settled);
      const totalApplied = unsettled.reduce((sum, c) => sum + c.monthlyPayment, 0);

      const updatedCredits = prev.credits.map((c) => {
        if (c.settled) return c;
        const newRemaining = Math.max(0, c.remainingAmount - c.monthlyPayment);
        return {
          ...c,
          remainingAmount: newRemaining,
          settled: newRemaining === 0 ? true : undefined,
        };
      });

      return {
        ...prev,
        credits: updatedCredits,
        lastPaymentMonth: currentMonth,
        appliedCreditsAmount: (prev.appliedCreditsAmount ?? 0) + totalApplied,
      };
    });
  }, []);

  const resetLastPaymentMonth = useCallback(() => {
    setData((prev) => ({
      ...prev,
      lastPaymentMonth: undefined,
      appliedCreditsAmount: 0,
    }));
  }, []);

  const updateGroceryBudget = useCallback((amount: number) => {
    setData((prev) => ({ ...prev, groceryBudget: amount }));
  }, []);

  const updateStartingBalance = useCallback((amount: number) => {
    setData((prev) => ({ ...prev, startingBalance: amount }));
  }, []);

  const addGroceryExpense = useCallback((expense: Omit<GroceryExpense, "id">) => {
    setData((prev) => ({
      ...prev,
      groceryExpenses: [
        ...prev.groceryExpenses,
        { ...expense, id: Date.now().toString() },
      ],
    }));
  }, []);

  const updateGroceryExpense = useCallback(
    (id: string, updates: Partial<GroceryExpense>) => {
      setData((prev) => ({
        ...prev,
        groceryExpenses: prev.groceryExpenses.map((e) =>
          e.id === id ? { ...e, ...updates } : e,
        ),
      }));
    },
    [],
  );

  const deleteGroceryExpense = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      groceryExpenses: prev.groceryExpenses.filter((e) => e.id !== id),
    }));
  }, []);

  const resetData = useCallback(() => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => ({ ...e, actualAmount: 0 })),
      incomes: prev.incomes.map((i) => ({ ...i, receivedDate: null })),
      groceryExpenses: [],
      lastPaymentMonth: undefined,
      appliedCreditsAmount: 0,
    }));
  }, []);

  const resetVariableSpends = useCallback(() => {
    setData((prev) => ({
      ...prev,
      variableSpends: {
        Essence: { entries: [] },
        Cadeau: { entries: [] },
        Pharmacie: { entries: [] },
        Travaux: { entries: [] },
        "Entretien voiture": { entries: [] },
        "Loisirs famille": { entries: [] },
      },
    }));
  }, []);

  const addVariableSpend = useCallback(
    (label: string, dateISO: string, amount: number) => {
      setData((prev) => {
        const spends = prev.variableSpends ?? {};
        const existing = spends[label] ?? { entries: [] };
        return {
          ...prev,
          variableSpends: {
            ...spends,
            [label]: {
              entries: [
                ...existing.entries,
                { id: crypto.randomUUID(), dateISO, amount },
              ],
            },
          },
        };
      });
    },
    [],
  );

  const deleteVariableSpend = useCallback((label: string, id: string) => {
    setData((prev) => {
      const spends = prev.variableSpends ?? {};
      const existing = spends[label] ?? { entries: [] };
      return {
        ...prev,
        variableSpends: {
          ...spends,
          [label]: {
            entries: existing.entries.filter(
              (e: { id: string }) => e.id !== id,
            ),
          },
        },
      };
    });
  }, []);

  const projection = calculateProjection(
    data.credits,
    surplus,
    data.startingBalance,
    totalIncome,
    totalCredits,
    totalExpenses,
    data.groceryBudget,
  );

  return {
    data,
    totalIncome,
    totalCredits,
    totalExpenses,
    surplus,
    totalDebt,
    projection,
    updateIncome,
    updateCredit,
    deleteCredit,
    addCredit,
    updateExpense,
    deleteExpense,
    addExpense,
    updateGroceryBudget,
    updateStartingBalance,
    addGroceryExpense,
    updateGroceryExpense,
    deleteGroceryExpense,
    toggleExpensesLock,
    toggleCreditsLock,
    applyMonthlyPayment,
    resetLastPaymentMonth,
    resetData,
    resetVariableSpends,
    addVariableSpend,
    deleteVariableSpend,
  };
}

function calculateProjection(
  credits: Credit[],
  monthlySurplus: number,
  startingBalance: number,
  totalIncome: number,
  totalCredits: number,
  totalExpenses: number,
  groceryBudget: number,
) {
  const months: Array<{
    month: number;
    label: string;
    totalDebt: number;
    monthlyPayment: number;
    surplus: number;
    balance: number;
    settledThisMonth: string[];
  }> = [];

  let currentCredits = credits.map((c) => ({ ...c }));
  let runningBalance = startingBalance;

  for (let m = 0; m < 24; m++) {
    const now = new Date();
    now.setMonth(now.getMonth() + m);
    const label = now.toLocaleDateString("fr-FR", {
      month: "short",
      year: "2-digit",
    });

    const unsettled = currentCredits.filter((c) => !c.settled);
    const monthPayment = unsettled.reduce((s, c) => s + c.monthlyPayment, 0);
    const surplus = totalIncome - monthPayment - totalExpenses - groceryBudget;
    const settledThisMonth: string[] = [];

    currentCredits = currentCredits.map((c) => {
      if (c.settled) return c;
      const newRemaining = Math.max(0, c.remainingAmount - c.monthlyPayment);
      if (newRemaining === 0) settledThisMonth.push(c.name);
      return { ...c, remainingAmount: newRemaining, settled: newRemaining === 0 };
    });

    const totalDebt = currentCredits.reduce(
      (s, c) => s + (c.settled ? 0 : c.remainingAmount),
      0,
    );
    runningBalance += surplus;

    months.push({
      month: m + 1,
      label,
      totalDebt,
      monthlyPayment: monthPayment,
      surplus,
      balance: runningBalance,
      settledThisMonth,
    });
  }

  return months;
}
