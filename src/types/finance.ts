export interface Income {
  id: string;
  name: string;
  amount: number;
  receiptDate?: number;
  receivedDate?: string | null;
}

export interface Credit {
  id: string;
  name: string;
  monthlyPayment: number;
  remainingAmount: number;
  initialAmount: number;
  settled?: boolean;
}

export type ExpenseCategory =
  | "logement"
  | "transport"
  | "sante"
  | "finances"
  | "loisirs"
  | "remboursements"
  | "divers";

export interface Expense {
  id: string;
  name: string;
  amount: number;
  actualAmount: number;
  custom?: boolean;
  category?: ExpenseCategory;
}

export interface GroceryExpense {
  id: string;
  date: string;
  type: "course" | "retrait" | "autres";
  customType?: string;
  amount: number;
  paymentMethod: "cb" | "especes" | "virement" | "autre";
}

export type SavingsTimeline = "court" | "moyen" | "long";

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  timeline: SavingsTimeline;
  icon: string;
}

export interface FinanceData {
  incomes: Income[];
  credits: Credit[];
  expenses: Expense[];
  groceryBudget: number;
  startingBalance: number;
  groceryExpenses: GroceryExpense[];
  expensesLocked: boolean;
  creditsLocked: boolean;
  lastPaymentMonth?: string;
  appliedCreditsAmount: number;
  variableSpends?: {
    [key: string]: {
      entries: {
        id: string;
        dateISO: string;
        amount: number;
      }[];
    };
  };
}
