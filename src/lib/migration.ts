import { ref, get, set, update } from "firebase/database";
import { db } from "@/lib/firebase";

export type MigrationResult =
  | { status: "skipped" }
  | { status: "success"; itemCount: number }
  | { status: "error"; error: string };

const LS_KEYS = {
  finance: "debt-snowball-data",
  monthly: "monthly-history",
  variableSpends: "variable-spends",
  rewards: "rewards-data",
  challenges: "challenges-data",
  coupleMessages: "couple-messages",
} as const;

function readLS(key: string): any | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function countItems(financeData: any, monthly: any): number {
  let count = 0;
  if (financeData) {
    count += (financeData.groceryExpenses ?? []).length;
    count += (financeData.credits ?? []).length;
    count += (financeData.expenses ?? []).length;
  }
  if (monthly && typeof monthly === "object") {
    count += Object.keys(monthly).length;
  }
  return count;
}

export async function runLocalStorageMigration(
  userId: string,
  migrationComplete: boolean
): Promise<MigrationResult> {
  const hasLocalData = !!localStorage.getItem(LS_KEYS.finance);

  if (!hasLocalData || migrationComplete) {
    return { status: "skipped" };
  }

  try {
    const financePath    = `users/${userId}/debt_snowball_data`;
    const monthlyPath    = `users/${userId}/monthly_history`;
    const messagesPath   = `users/${userId}/couple_messages`;
    const oldVarPath     = `users/${userId}/variable_spends`;

    const financeRaw         = readLS(LS_KEYS.finance);
    const monthlyRaw         = readLS(LS_KEYS.monthly);
    const variableSpendsRaw  = readLS(LS_KEYS.variableSpends);
    const rewardsRaw         = readLS(LS_KEYS.rewards);
    const challengesRaw      = readLS(LS_KEYS.challenges);
    const messagesRaw        = readLS(LS_KEYS.coupleMessages);

    let mergedFinance = financeRaw ?? {};

    if (variableSpendsRaw) {
      mergedFinance = { ...mergedFinance, variableSpends: variableSpendsRaw };
    }

    if (!mergedFinance.variableSpends) {
      try {
        const oldVarSnap = await get(ref(db, oldVarPath));
        if (oldVarSnap.exists()) {
          mergedFinance = { ...mergedFinance, variableSpends: oldVarSnap.val() };
        }
      } catch {
        // best-effort merge — ignore failure
      }
    }

    const existingFinanceSnap = await get(ref(db, financePath));
    const existingMonthlySnap = await get(ref(db, monthlyPath));

    const targetFinance = existingFinanceSnap.exists()
      ? {
          ...mergedFinance,
          variableSpends:
            mergedFinance.variableSpends ??
            existingFinanceSnap.val()?.variableSpends,
        }
      : mergedFinance;

    const targetMonthly = existingMonthlySnap.exists()
      ? existingMonthlySnap.val()
      : monthlyRaw;

    const writes: Promise<void>[] = [];

    if (targetFinance && Object.keys(targetFinance).length > 0) {
      writes.push(set(ref(db, financePath), targetFinance));
    }
    if (targetMonthly && Object.keys(targetMonthly).length > 0) {
      writes.push(set(ref(db, monthlyPath), targetMonthly));
    }
    if (rewardsRaw) {
      writes.push(set(ref(db, `users/${userId}/rewards_data`), rewardsRaw));
    }
    if (challengesRaw) {
      writes.push(set(ref(db, `users/${userId}/challenges_data`), challengesRaw));
    }
    if (messagesRaw) {
      writes.push(set(ref(db, messagesPath), messagesRaw));
    }

    await Promise.all(writes);

    await update(ref(db, `users/${userId}/profile`), { migrationComplete: true });

    return {
      status: "success",
      itemCount: countItems(targetFinance, targetMonthly),
    };
  } catch (err: any) {
    console.error("Migration error:", err);
    return { status: "error", error: err?.message ?? "Erreur inconnue" };
  }
}
