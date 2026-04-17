import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { ref, onValue, set, off } from "firebase/database";
import { db } from "@/lib/firebase";
import type { FinanceData, SavingsGoal } from "@/types/finance";

export interface CoupleNotification {
  id: string;
  text: string;
  senderName: string;
  senderRole: "boss" | "wife";
  forProfile: "boss" | "wife";
  timestamp: number;
  seen: boolean;
}

type SyncStatus = "idle" | "syncing" | "synced" | "error";

interface FirebaseDataState {
  financeData: FinanceData | null;
  monthlyHistory: Record<string, any> | null;
  rewardsData: any | null;
  challengesData: any | null;
  coupleMessages: any | null;
  notifications: Record<string, CoupleNotification> | null;
  savingsData: SavingsGoal[] | null;
  loading: boolean;
  syncStatus: SyncStatus;
}

interface FirebaseDataContextType extends FirebaseDataState {
  saveFinanceData: (data: FinanceData) => void;
  saveMonthlyHistory: (data: Record<string, any>) => void;
  saveRewardsData: (data: any) => void;
  saveChallengesData: (data: any) => void;
  saveCoupleMessages: (data: any) => void;
  saveSavingsData: (data: SavingsGoal[]) => void;
  saveNotification: (notif: Omit<CoupleNotification, "seen">) => Promise<void>;
  markNotificationSeen: (id: string) => Promise<void>;
  exportAll: () => void;
  importAll: (file: File) => void;
}

const FirebaseDataContext = createContext<FirebaseDataContextType | null>(null);

const SELF_WRITE_GRACE = 4000;
const DEBOUNCE_MS = 800;

interface Props {
  userId: string;
  children: ReactNode;
}

export function FirebaseDataProvider({ userId, children }: Props) {
  const [financeData, setFinanceData] = useState<FinanceData | null>(null);
  const [monthlyHistory, setMonthlyHistory] = useState<Record<string, any> | null>(null);
  const [rewardsData, setRewardsData] = useState<any | null>(null);
  const [challengesData, setChallengesData] = useState<any | null>(null);
  const [coupleMessages, setCoupleMessages] = useState<any | null>(null);
  const [notifications, setNotifications] = useState<Record<string, CoupleNotification> | null>(null);
  const [savingsData, setSavingsData] = useState<SavingsGoal[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  const lastWriteTime = useRef<Record<string, number>>({});
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const loadedKeys = useRef(new Set<string>());
  const expectedCount = useRef(0);

  const markLoaded = useCallback((key: string) => {
    loadedKeys.current.add(key);
    if (loadedKeys.current.size >= expectedCount.current) {
      setLoading(false);
    }
  }, []);

  const debouncedSave = useCallback(
    (path: string, key: string, data: any) => {
      if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
      setSyncStatus("syncing");
      lastWriteTime.current[key] = Date.now();
      saveTimers.current[key] = setTimeout(async () => {
        try {
          await set(ref(db, path), data ?? null);
          setSyncStatus("synced");
        } catch (err) {
          console.error("Firebase save error:", err);
          setSyncStatus("error");
        }
      }, DEBOUNCE_MS);
    },
    [],
  );

  useEffect(() => {
    if (!userId) return;

    const financePath        = `users/${userId}/debt_snowball_data`;
    const monthlyPath        = `users/${userId}/monthly_history`;
    const rewardsPath        = `users/${userId}/rewards_data`;
    const challengesPath     = `users/${userId}/challenges_data`;
    const messagesPath       = `users/${userId}/couple_messages`;
    const notificationsPath  = `users/${userId}/notifications`;
    const savingsPath        = `users/${userId}/savings_data`;

    const KEYS = ["finances", "monthly", "rewards", "challenges", "messages", "notifications", "savings"];
    expectedCount.current = KEYS.length;
    loadedKeys.current.clear();
    setLoading(true);

    const guard = (key: string) =>
      Date.now() - (lastWriteTime.current[key] ?? 0) < SELF_WRITE_GRACE;

    const unsubFinance = onValue(ref(db, financePath), (snap) => {
      if (guard("finances")) { markLoaded("finances"); return; }
      setFinanceData(snap.exists() ? snap.val() : null);
      markLoaded("finances");
    });

    const unsubMonthly = onValue(ref(db, monthlyPath), (snap) => {
      if (guard("monthly")) { markLoaded("monthly"); return; }
      setMonthlyHistory(snap.exists() ? snap.val() : null);
      markLoaded("monthly");
    });

    const unsubRewards = onValue(ref(db, rewardsPath), (snap) => {
      if (guard("rewards")) { markLoaded("rewards"); return; }
      setRewardsData(snap.exists() ? snap.val() : null);
      markLoaded("rewards");
    });

    const unsubChallenges = onValue(ref(db, challengesPath), (snap) => {
      if (guard("challenges")) { markLoaded("challenges"); return; }
      setChallengesData(snap.exists() ? snap.val() : null);
      markLoaded("challenges");
    });

    const unsubMessages = onValue(ref(db, messagesPath), (snap) => {
      if (guard("messages")) { markLoaded("messages"); return; }
      setCoupleMessages(snap.exists() ? snap.val() : null);
      markLoaded("messages");
    });

    const unsubNotifications = onValue(ref(db, notificationsPath), (snap) => {
      setNotifications(snap.exists() ? snap.val() : null);
      markLoaded("notifications");
    });

    const unsubSavings = onValue(ref(db, savingsPath), (snap) => {
      if (guard("savings")) { markLoaded("savings"); return; }
      setSavingsData(snap.exists() ? snap.val() : null);
      markLoaded("savings");
    });

    return () => {
      unsubFinance();
      unsubMonthly();
      unsubRewards();
      unsubChallenges();
      unsubMessages();
      unsubNotifications();
      unsubSavings();
      Object.values(saveTimers.current).forEach(clearTimeout);
    };
  }, [userId, markLoaded]);

  const financePath   = `users/${userId}/debt_snowball_data`;
  const monthlyPath   = `users/${userId}/monthly_history`;
  const messagesPath  = `users/${userId}/couple_messages`;

  const saveFinanceData = useCallback(
    (data: FinanceData) => {
      setFinanceData(data);
      debouncedSave(financePath, "finances", data);
    },
    [financePath, debouncedSave],
  );

  const saveMonthlyHistory = useCallback(
    (data: Record<string, any>) => {
      setMonthlyHistory(data);
      debouncedSave(monthlyPath, "monthly", data);
    },
    [monthlyPath, debouncedSave],
  );

  const saveRewardsData = useCallback(
    (data: any) => {
      setRewardsData(data);
      debouncedSave(`users/${userId}/rewards_data`, "rewards", data);
    },
    [userId, debouncedSave],
  );

  const saveChallengesData = useCallback(
    (data: any) => {
      setChallengesData(data);
      debouncedSave(`users/${userId}/challenges_data`, "challenges", data);
    },
    [userId, debouncedSave],
  );

  const saveCoupleMessages = useCallback(
    (data: any) => {
      setCoupleMessages(data);
      debouncedSave(messagesPath, "messages", data);
    },
    [messagesPath, debouncedSave],
  );

  const saveSavingsData = useCallback(
    (data: SavingsGoal[]) => {
      setSavingsData(data);
      debouncedSave(`users/${userId}/savings_data`, "savings", data);
    },
    [userId, debouncedSave],
  );

  const saveNotification = useCallback(
    async (notif: Omit<CoupleNotification, "seen">) => {
      await set(ref(db, `users/${userId}/notifications/${notif.id}`), { ...notif, seen: false });
    },
    [userId],
  );

  const markNotificationSeen = useCallback(
    async (id: string) => {
      await set(ref(db, `users/${userId}/notifications/${id}/seen`), true);
    },
    [userId],
  );

  const exportAll = useCallback(() => {
    const backup = { financeData, monthlyHistory, rewardsData, challengesData };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SB-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [financeData, monthlyHistory, rewardsData, challengesData]);

  const importAll = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target?.result as string);
          if (backup.financeData) saveFinanceData(backup.financeData);
          if (backup.monthlyHistory) saveMonthlyHistory(backup.monthlyHistory);
          if (backup.rewardsData) saveRewardsData(backup.rewardsData);
          if (backup.challengesData) saveChallengesData(backup.challengesData);
          setTimeout(() => window.location.reload(), 1200);
        } catch (err) {
          console.error("Failed to restore backup", err);
          alert("Erreur lors de la restauration de la sauvegarde.");
        }
      };
      reader.readAsText(file);
    },
    [saveFinanceData, saveMonthlyHistory, saveRewardsData, saveChallengesData],
  );

  return (
    <FirebaseDataContext.Provider
      value={{
        financeData,
        monthlyHistory,
        rewardsData,
        challengesData,
        coupleMessages,
        notifications,
        savingsData,
        loading,
        syncStatus,
        saveFinanceData,
        saveMonthlyHistory,
        saveRewardsData,
        saveChallengesData,
        saveCoupleMessages,
        saveSavingsData,
        saveNotification,
        markNotificationSeen,
        exportAll,
        importAll,
      }}
    >
      {children}
    </FirebaseDataContext.Provider>
  );
}

export function useFirebaseData() {
  const ctx = useContext(FirebaseDataContext);
  if (!ctx) throw new Error("useFirebaseData must be used within FirebaseDataProvider");
  return ctx;
}
