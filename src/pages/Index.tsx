import { DashboardHero } from "@/components/DashboardHero";
import { Challenges } from "@/components/Challenges";
import { Couple } from "@/components/Couple";
import { LogOut, Heart, Settings, X } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { Home, CreditCard, Receipt, RotateCcw, Swords, PiggyBank, Lock, ShoppingCart } from "lucide-react";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useMonthlyData } from "@/hooks/useMonthlyData";
import { useRewards } from "@/hooks/useRewards";
import { useChallenges } from "@/hooks/useChallenges";
import { MonthlyReset } from "@/components/MonthlyReset";
import { MonthlyHistory } from "@/components/MonthlyHistory";
import { Credits } from "@/components/Credits";
import ChargesTab from "@/components/ChargesTab";
import BudgetCoursesTab from "@/components/BudgetCoursesTab";
import { ChargesDashboardWidget } from "@/components/ChargesDashboardWidget";
import { BudgetCoursesDashboardWidget } from "@/components/BudgetCoursesDashboardWidget";
import { useToast } from "@/hooks/use-toast";
import { ToastContainer } from "@/components/ToastContainer";
import { useAuth } from "@/context/AuthContext";
import { UserTypeModal } from "@/components/UserTypeModal";
import { NamesModal } from "@/components/NamesModal";
import { FinancialProfileQuiz } from "@/components/FinancialProfileQuiz";
import { FirebaseDataProvider, useFirebaseData } from "@/context/FirebaseDataContext";
import { CoupleProfileModal } from "@/components/CoupleProfileModal";
import { getProfile } from "@/lib/profiles";
import { MessageToast } from "@/components/MessageToast";
import { SetupWizard } from "@/components/SetupWizard";
import { Savings } from "@/components/Savings";
import { EscalationSystem, EscalationDashboardCard, EscalationBanner } from "@/components/EscalationSystem";
import { usePerProfileEscalation } from "@/hooks/usePerProfileEscalation";
import type { ProfileType } from "@/lib/profiles";
import type { CoupleNotification } from "@/context/FirebaseDataContext";
import type { SavingsGoal } from "@/types/finance";
import Login from "@/pages/Login";

type CoupleProfile = "boss" | "wife";

type Tab = "dashboard" | "credits" | "expenses" | "defis" | "couple" | "savings" | "courses";

const Index = () => {
  const { user, loading: authLoading, migrationStatus } = useAuth();

  if (authLoading) {
    const isMigrating = migrationStatus === "running";
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-pulse">{isMigrating ? "☁️" : "⚙️"}</div>
          <p className="text-muted-foreground text-sm">
            {isMigrating
              ? "Vos données sont en cours de sauvegarde..."
              : "Chargement..."}
          </p>
          {isMigrating && (
            <p className="text-xs text-muted-foreground/60">Première connexion — copie vers le cloud</p>
          )}
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return <AppWrapper />;
};

function AppWrapper() {
  const { user } = useAuth();
  return (
    <FirebaseDataProvider userId={user!.uid}>
      <AppContent />
    </FirebaseDataProvider>
  );
}

function AppContent() {
  const { loading: fbLoading } = useFirebaseData();

  if (fbLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-pulse">☁️</div>
          <p className="text-muted-foreground text-sm">Chargement de vos données...</p>
        </div>
      </div>
    );
  }

  return <AppMain />;
}

function AppMain() {
  const { user, logout, userProfile, saveUserProfile, saveNames, saveQuizAnswers, savePartnerQuizAnswers, skipQuiz, resetQuiz, resetPartnerQuiz, resetNamesCompleted, migrationStatus, dismissMigration, saveSetupStep, markOnboardingComplete, saveFinancesInitialBalance, saveCoupleInviteCode } = useAuth();
  const [profileEvolution, setProfileEvolution] = useState<{ from: string; to: string } | null>(null);
  const [partnerQuizSkippedThisSession, setPartnerQuizSkippedThisSession] = useState(false);
  const [escalationShowQuiz, setEscalationShowQuiz] = useState(false);
  const [escalationCompletedProfile, setEscalationCompletedProfile] = useState<ProfileType | null>(null);
  const [escalationBannerDismissedThisSession, setEscalationBannerDismissedThisSession] = useState(false);

  const [currentProfile, setCurrentProfile] = useState<CoupleProfile | null>(() => {
    const saved = localStorage.getItem("currentProfile");
    if (saved === "boss_profile") return "boss";
    if (saved === "wife_profile") return "wife";
    return null;
  });

  const escalationProfileKey: string | null =
    userProfile.userType === "single"
      ? "single_profile"
      : currentProfile === "boss"
        ? "boss_profile"
        : currentProfile === "wife"
          ? "wife_profile"
          : null;

  const perProfileEscalation = usePerProfileEscalation(user?.uid ?? null, escalationProfileKey);
  const {
    financeData,
    monthlyHistory,
    rewardsData,
    challengesData,
    notifications,
    savingsData,
    syncStatus,
    saveFinanceData,
    saveMonthlyHistory,
    saveRewardsData,
    saveChallengesData,
    saveSavingsData,
    markNotificationSeen,
    exportAll,
    importAll,
  } = useFirebaseData();

  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [showReset, setShowReset] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [setupWizardSkipped, setSetupWizardSkipped] = useState(() =>
    localStorage.getItem("wizard-dismissed") === "true"
  );
  const [messageNotif, setMessageNotif] = useState<CoupleNotification | null>(null);
  const shownNotifIds = useRef<Set<string>>(new Set());

  const handleSelectCoupleProfile = (profile: CoupleProfile) => {
    localStorage.setItem("currentProfile", profile === "boss" ? "boss_profile" : "wife_profile");
    setCurrentProfile(profile);
  };

  const handleSwitchCoupleProfile = () => {
    localStorage.removeItem("currentProfile");
    setCurrentProfile(null);
    setShowSettings(false);
  };

  // ── Derived constants (all declared before any useEffect) ──────────────────
  const memberName = userProfile.memberName;
  const partnerName = userProfile.partnerName;
  const needsNames = userProfile.firstTimeSetupComplete && !userProfile.namesCompleted;
  const isSetupComplete =
    userProfile.firstTimeSetupComplete &&
    userProfile.namesCompleted &&
    userProfile.quizCompleted;

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isSetupComplete && userProfile.userType === "single") {
      localStorage.setItem("currentProfile", "single_profile");
    }
  }, [isSetupComplete, userProfile.userType]);

  const resetNamesSetup = async () => {
    await resetNamesCompleted();
    setShowSettings(false);
  };

  const firstPendingStep: 1 | 2 | 3 | 4 | 5 | null =
    !isSetupComplete ? null :
    !userProfile.setupBalanceDone ? 1 :
    !userProfile.setupCreditsDone ? 2 :
    !userProfile.setupExpensesDone ? 3 :
    !userProfile.setupSavingsDone ? 4 :
    (userProfile.userType === "couple" && !userProfile.setupCoupleDone) ? 5 :
    null;

  const allSetupDone =
    userProfile.setupBalanceDone &&
    userProfile.setupCreditsDone &&
    userProfile.setupExpensesDone &&
    userProfile.setupSavingsDone &&
    (userProfile.userType !== "couple" || userProfile.setupCoupleDone);

  const wifeNeedsQuiz =
    isSetupComplete &&
    currentProfile === "wife" &&
    !userProfile.partnerQuizCompleted &&
    !partnerQuizSkippedThisSession;

  const { data: perEscalation } = perProfileEscalation;

  const profileQuizDone =
    currentProfile === "wife"
      ? !!userProfile.partnerProfileType
      : !!userProfile.profileType;

  const needsEscalation =
    isSetupComplete &&
    allSetupDone &&
    !!escalationProfileKey &&
    !profileQuizDone &&
    !wifeNeedsQuiz &&
    escalationCompletedProfile === null;

  const showEscalationModal =
    needsEscalation &&
    wizardStep === null &&
    !escalationShowQuiz &&
    escalationCompletedProfile === null &&
    (perEscalation.escalationLevel === 0 ||
      (perEscalation.escalationLevel === 3 && !perEscalation.userContinuedWithoutQuiz));

  const showE2Card =
    needsEscalation &&
    wizardStep === null &&
    perEscalation.escalationLevel >= 1 &&
    perEscalation.escalationLevel < 3;

  const showPersistentBanner =
    needsEscalation &&
    wizardStep === null &&
    perEscalation.escalationLevel === 3 &&
    perEscalation.userContinuedWithoutQuiz &&
    !escalationBannerDismissedThisSession;

  const handleEscalationQuizComplete = async (answers: Parameters<typeof saveQuizAnswers>[0]) => {
    let result: { previousProfile: ProfileType | null; newProfile: ProfileType };
    if (currentProfile === "wife") {
      const { newProfile } = await savePartnerQuizAnswers(answers);
      result = { previousProfile: userProfile.partnerProfileType, newProfile };
    } else {
      result = await saveQuizAnswers(answers);
    }
    await perProfileEscalation.markComplete();
    setEscalationShowQuiz(false);
    setEscalationCompletedProfile(result.newProfile);
    return result;
  };

  useEffect(() => {
    if (firstPendingStep !== null && !setupWizardSkipped && wizardStep === null) {
      setWizardStep(firstPendingStep);
    }
  }, [firstPendingStep, setupWizardSkipped]);

  const goals: SavingsGoal[] = savingsData ?? [];

  const addGoal = (goal: Omit<SavingsGoal, "id">) => {
    const newGoal: SavingsGoal = { ...goal, id: Date.now().toString() };
    saveSavingsData([...goals, newGoal]);
  };

  const updateGoal = (id: string, changes: Partial<Omit<SavingsGoal, "id">>) => {
    saveSavingsData(goals.map((g) => (g.id === id ? { ...g, ...changes } : g)));
  };

  const deleteGoal = (id: string) => {
    saveSavingsData(goals.filter((g) => g.id !== id));
  };

  const handleWizardStepComplete = async (step: 1 | 2 | 3 | 4 | 5, balance?: number) => {
    const stepKey = (["balance", "credits", "expenses", "savings", "couple"] as const)[step - 1];
    await saveSetupStep(stepKey);

    if (step === 1) {
      await saveFinancesInitialBalance(balance ?? data.startingBalance);
    }

    if (step === 5) {
      await saveCoupleInviteCode();
    }

    const isCouple = userProfile.userType === "couple";
    const doneMask = {
      balance: step >= 1 || userProfile.setupBalanceDone,
      credits: step >= 2 || userProfile.setupCreditsDone,
      expenses: step >= 3 || userProfile.setupExpensesDone,
      savings: step >= 4 || userProfile.setupSavingsDone,
      couple: step >= 5 || userProfile.setupCoupleDone,
    };
    const next: 1 | 2 | 3 | 4 | 5 | null =
      !doneMask.balance ? 1 :
      !doneMask.credits ? 2 :
      !doneMask.expenses ? 3 :
      !doneMask.savings ? 4 :
      (isCouple && !doneMask.couple) ? 5 :
      null;
    if (next !== null) {
      setWizardStep(next);
    } else {
      setWizardStep(null);
      localStorage.removeItem("wizard-dismissed");
      await markOnboardingComplete();
      toast({ title: "Configuration terminée ! 🎉", description: "Toutes les fonctionnalités sont maintenant disponibles." });
    }
  };

  const handleWizardDismiss = () => {
    setSetupWizardSkipped(true);
    localStorage.setItem("wizard-dismissed", "true");
    setWizardStep(null);
  };

  const openWizardAtStep = (step: 1 | 2 | 3 | 4) => {
    setSetupWizardSkipped(false);
    localStorage.removeItem("wizard-dismissed");
    setWizardStep(step);
  };

  const needsCoupleProfileSelection =
    isSetupComplete &&
    userProfile.userType === "couple" &&
    currentProfile === null;

  const effectiveProfileType =
    userProfile.userType === "couple" && currentProfile === "boss"
      ? (userProfile.quizCompleted ? "strategiste" : null)
      : userProfile.userType === "couple" && currentProfile === "wife"
        ? (userProfile.partnerProfileType ?? null)
        : (userProfile.quizCompleted ? userProfile.profileType : null);

  const activeName =
    userProfile.userType === "couple"
      ? currentProfile === "boss"
        ? (memberName || "Vous")
        : currentProfile === "wife"
          ? (partnerName || "Partenaire")
          : null
      : (memberName || null);

  const coupleProfileLabel =
    userProfile.userType === "couple" && currentProfile === "boss"
      ? `🎯 ${memberName || "Vous"}`
      : userProfile.userType === "couple" && currentProfile === "wife"
        ? `🛡️ ${partnerName || "Partenaire"}`
        : null;

  const {
    data,
    totalIncome,
    totalCredits,
    totalExpenses,
    surplus,
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
    resetData,
    resetLastPaymentMonth,
    resetVariableSpends,
    addVariableSpend,
    deleteVariableSpend,
  } = useFinanceData(financeData, saveFinanceData);

  const monthlyData = useMonthlyData(monthlyHistory, saveMonthlyHistory);
  const rewards = useRewards(data.credits, data.expenses, rewardsData, saveRewardsData);
  const { toasts, toast, dismiss } = useToast();

  useEffect(() => {
    const handleChallenge = (e: any) => {
      toast({
        title: "Défi complété ! 🎉",
        description: `${e.detail.reason} (+${e.detail.points} pts)`,
      });
    };
    window.addEventListener("challenge-completed", handleChallenge);
    return () => window.removeEventListener("challenge-completed", handleChallenge);
  }, [toast]);

  useEffect(() => {
    if (!notifications || !currentProfile) return;
    const notifList = Object.values(notifications) as CoupleNotification[];
    for (const notif of notifList) {
      if (
        !notif.seen &&
        notif.forProfile === currentProfile &&
        !shownNotifIds.current.has(notif.id)
      ) {
        shownNotifIds.current.add(notif.id);
        setMessageNotif(notif);
        markNotificationSeen(notif.id);
        break;
      }
    }
  }, [notifications, currentProfile, markNotificationSeen]);

  const dynamicBalance = useMemo(() => {
    const receivedSalaries = data.incomes.reduce(
      (sum, i) => sum + (i.receivedDate ? i.amount : 0),
      0,
    );
    const grocerySpent = data.groceryExpenses.reduce((sum, e) => sum + e.amount, 0);
    const regularSpent = data.expenses
      .filter((e) => e.category !== "remboursements")
      .reduce((sum, e) => sum + e.actualAmount, 0);
    const reimbursementsReceived = data.expenses
      .filter((e) => e.category === "remboursements")
      .reduce((sum, e) => sum + e.actualAmount, 0);
    const fixedSpent = regularSpent - reimbursementsReceived;
    return (
      data.startingBalance +
      receivedSalaries -
      grocerySpent -
      fixedSpent -
      (data.appliedCreditsAmount ?? 0)
    );
  }, [data]);

  const totalDebt = data.credits.reduce(
    (sum, c) => sum + (c.settled ? 0 : c.remainingAmount),
    0,
  );

  const challenges = useChallenges(
    {
      incomes: data.incomes,
      groceryExpenses: data.groceryExpenses,
      groceryBudget: data.groceryBudget,
      expenses: data.expenses,
      dynamicBalance,
      totalDebt,
      lastPaymentMonth: data.lastPaymentMonth,
      addPoints: rewards.addPoints,
    },
    challengesData,
    saveChallengesData,
  );

  const today = new Date();
  const week = Math.floor(today.getDate() / 7);
  const citations = [
    "Le sage prévoit tout, l'insensé improvise.",
    "L'argent est un maître sévère mais un bon serviteur.",
    "Chaque centime économisé est une victoire.",
    "La discipline est le pont entre rêves et réalité.",
    "Ton avenir te remerciera pour tes choix d'aujourd'hui.",
    "L'accumulation est plus puissante que la perfection.",
  ];
  const citation = citations[week % citations.length];

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true";
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  const handleReset = () => {
    resetData();
    setShowReset(false);
  };

  const syncLabel =
    syncStatus === "syncing"
      ? "⏳ Sync..."
      : syncStatus === "error"
        ? "❌ Sync"
        : "☁️";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!userProfile.firstTimeSetupComplete && (
        <UserTypeModal onSelect={saveUserProfile} />
      )}
      {needsNames && userProfile.userType !== null && (
        <NamesModal userType={userProfile.userType} onComplete={saveNames} />
      )}
      {userProfile.firstTimeSetupComplete && userProfile.namesCompleted && !userProfile.quizCompleted && (
        <FinancialProfileQuiz
          onComplete={async (answers) => {
            const { previousProfile, newProfile } = await saveQuizAnswers(answers);
            if (previousProfile && previousProfile !== newProfile) {
              const fromProfile = getProfile(previousProfile);
              const toProfile = getProfile(newProfile);
              setProfileEvolution({ from: `${fromProfile.emoji} ${fromProfile.name}`, to: `${toProfile.emoji} ${toProfile.name}` });
            }
          }}
          onSkip={skipQuiz}
          previousProfileType={userProfile.profileType}
        />
      )}

      {needsCoupleProfileSelection && (
        <CoupleProfileModal
          onSelect={handleSelectCoupleProfile}
          memberName={memberName}
          partnerName={partnerName}
        />
      )}

      {wifeNeedsQuiz && (
        <FinancialProfileQuiz
          onComplete={savePartnerQuizAnswers}
          onSkip={() => setPartnerQuizSkippedThisSession(true)}
          previousProfileType={userProfile.partnerProfileType}
          title={`Profil de ${partnerName || "votre partenaire"}`}
          subtitle="5 questions — Résultat personnalisé immédiat"
          skipLabel="Je ferai ça plus tard"
        />
      )}

      {wizardStep !== null && (
        <SetupWizard
          step={wizardStep}
          userType={userProfile.userType}
          userEmail={user?.email ?? null}
          currentBalance={data.startingBalance}
          credits={data.credits}
          expenses={data.expenses}
          savingsGoals={goals}
          onSetBalance={updateStartingBalance}
          onAddCredit={addCredit}
          onAddExpense={addExpense}
          onAddSavingsGoal={addGoal}
          onStepComplete={handleWizardStepComplete}
          onDismiss={handleWizardDismiss}
        />
      )}

      {(showEscalationModal || escalationShowQuiz || escalationCompletedProfile !== null) && (
        <EscalationSystem
          escalationLevel={perEscalation.escalationLevel}
          skipCount={perEscalation.skipCount}
          userContinuedWithoutQuiz={perEscalation.userContinuedWithoutQuiz}
          showQuiz={escalationShowQuiz}
          completedProfile={escalationCompletedProfile}
          onSkip={perProfileEscalation.skip}
          onContinueWithoutQuiz={perProfileEscalation.continueWithoutQuiz}
          onStartQuiz={() => setEscalationShowQuiz(true)}
          onQuizComplete={handleEscalationQuizComplete}
          onQuizSkip={() => setEscalationShowQuiz(false)}
          onResultClose={() => setEscalationCompletedProfile(null)}
        />
      )}

      {profileEvolution && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4">
          <div className="bg-card border-2 border-primary/30 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3">
            <span className="text-2xl">🎊</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Évolution de profil !</p>
              <p className="text-xs text-muted-foreground truncate">
                {profileEvolution.from} → {profileEvolution.to}
              </p>
            </div>
            <button
              onClick={() => setProfileEvolution(null)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Settings Panel ────────────────────────────────────── */}
      {showSettings && (() => {
        const profile = effectiveProfileType ? getProfile(effectiveProfileType) : null;
        return (
          <div className="fixed inset-0 z-[90] bg-background/95 backdrop-blur flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border sticky top-0 bg-background z-10">
              <h2 className="text-lg font-black text-foreground">Paramètres</h2>
              <button
                onClick={() => setShowSettings(false)}
                data-testid="settings-close"
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-6">

              {/* Profile section */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Profil financier</h3>
                  {currentProfile === "wife" && !userProfile.partnerQuizCompleted && (
                    <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                      À compléter
                    </span>
                  )}
                </div>

                {/* Wife profile — not yet completed */}
                {currentProfile === "wife" && !userProfile.partnerQuizCompleted ? (
                  <div className="rounded-2xl border-2 border-red-500/30 bg-red-500/5 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">📋</span>
                      <div>
                        <p className="font-bold text-foreground text-sm">Profil non complété</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {partnerName || "Votre partenaire"} n'a pas encore répondu au questionnaire financier.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setPartnerQuizSkippedThisSession(false); setShowSettings(false); }}
                      data-testid="settings-complete-partner-quiz"
                      className="w-full min-h-[44px] rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
                    >
                      Compléter le profil maintenant
                    </button>
                  </div>
                ) : profile ? (
                  <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{profile.emoji}</span>
                      <div>
                        <p className="font-bold text-foreground">{profile.name}</p>
                        <p className="text-sm text-muted-foreground">{profile.description}</p>
                      </div>
                    </div>

                    <div className="px-3 py-2.5 rounded-xl bg-sky-400/10 border border-sky-400/20">
                      <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 mb-0.5">Conseil pour votre profil</p>
                      <p className="text-sm text-foreground">{profile.tip}</p>
                    </div>

                    {currentProfile !== "wife" && userProfile.profileHistory && userProfile.profileHistory.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold mb-1.5">Évolution</p>
                        <div className="space-y-1">
                          {userProfile.profileHistory.map((h, i) => {
                            const hp = getProfile(h.type);
                            return (
                              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{hp.emoji} {hp.name}</span>
                                <span>→</span>
                                <span className="text-foreground">{new Date(h.timestamp).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {currentProfile === "wife" ? (
                      <button
                        onClick={async () => { await resetPartnerQuiz(); setPartnerQuizSkippedThisSession(false); setShowSettings(false); }}
                        data-testid="settings-retake-partner-quiz"
                        className="w-full min-h-[44px] rounded-xl border-2 border-border bg-card hover:bg-muted text-sm font-semibold text-foreground transition-colors"
                      >
                        Refaire mon profil financier
                      </button>
                    ) : (
                      <button
                        onClick={async () => { await resetQuiz(); setShowSettings(false); }}
                        data-testid="settings-retake-quiz"
                        className="w-full min-h-[44px] rounded-xl border-2 border-border bg-card hover:bg-muted text-sm font-semibold text-foreground transition-colors"
                      >
                        Refaire mon profil financier
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={`rounded-2xl border p-4 space-y-3 ${needsEscalation ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30" : "border-border bg-card"}`}>
                    {needsEscalation && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📋</span>
                        <div>
                          <p className="font-bold text-blue-800 dark:text-blue-200 text-sm">Complétez votre profil</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">Obtenez des défis et conseils personnalisés</p>
                        </div>
                      </div>
                    )}
                    {!needsEscalation && (
                      <p className="text-sm text-muted-foreground">Vous n'avez pas encore de profil financier.</p>
                    )}
                    <button
                      onClick={() => { setEscalationShowQuiz(true); setShowSettings(false); }}
                      data-testid="settings-take-quiz"
                      className="w-full min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors"
                    >
                      {needsEscalation ? "Faire le quiz maintenant" : "Découvrir mon profil"}
                    </button>
                  </div>
                )}
              </section>

              {/* Names section */}
              {userProfile.namesCompleted && (
                <section>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Prénoms</h3>
                  <div className="rounded-2xl border border-border bg-card divide-y divide-border">
                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Votre prénom</span>
                      <span className="text-sm font-semibold text-foreground">{memberName || "—"}</span>
                    </div>
                    {userProfile.userType === "couple" && (
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Prénom du partenaire</span>
                        <span className="text-sm font-semibold text-foreground">{partnerName || "—"}</span>
                      </div>
                    )}
                    <button
                      onClick={async () => { await resetNamesSetup(); }}
                      data-testid="settings-edit-names"
                      className="w-full px-4 py-3 text-left text-sm text-sky-600 dark:text-sky-400 font-semibold hover:bg-muted transition-colors rounded-b-2xl"
                    >
                      Modifier les prénoms
                    </button>
                  </div>
                </section>
              )}

              {/* Account section */}
              <section>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Compte</h3>
                <div className="rounded-2xl border border-border bg-card divide-y divide-border">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm font-medium text-foreground truncate max-w-[180px]">{user?.email}</span>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Statut</span>
                    <span className="text-sm font-medium text-foreground">
                      {userProfile.userType === "couple" ? "👥 En couple" : "🧍 Célibataire"}
                    </span>
                  </div>
                  {userProfile.userType === "couple" && currentProfile && (
                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Profil actif</span>
                      <span className="text-sm font-semibold text-foreground">{coupleProfileLabel}</span>
                    </div>
                  )}
                </div>
              </section>

              {userProfile.userType === "couple" && (
                <section>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Profil actif</h3>
                  <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{currentProfile === "boss" ? "🎯" : currentProfile === "wife" ? "🛡️" : "👥"}</span>
                      <div>
                        <p className="font-bold text-foreground text-sm">
                          {currentProfile === "boss"
                            ? (memberName || "Vous")
                            : currentProfile === "wife"
                              ? (partnerName || "Partenaire")
                              : "Aucun profil sélectionné"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {currentProfile === "boss" ? "Vue Stratège — vision long terme" : currentProfile === "wife" ? "Vue Économe — sécurité avant tout" : "Choisissez votre profil"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleSwitchCoupleProfile}
                      data-testid="settings-switch-couple-profile"
                      className="w-full min-h-[44px] rounded-xl border-2 border-border bg-card hover:bg-muted text-sm font-semibold text-foreground transition-colors"
                    >
                      Changer de profil
                    </button>
                  </div>
                </section>
              )}

              {/* Appearance */}
              <section>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Apparence</h3>
                <div className="rounded-2xl border border-border bg-card">
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-foreground hover:bg-muted transition-colors rounded-2xl"
                    data-testid="settings-dark-mode"
                  >
                    <span>Mode sombre</span>
                    <span>{darkMode ? "☀️ Désactiver" : "🌙 Activer"}</span>
                  </button>
                </div>
              </section>

              {/* Danger zone */}
              <section>
                <button
                  onClick={() => { setShowSettings(false); logout(); }}
                  className="w-full min-h-[44px] rounded-xl border-2 border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/10 transition-colors"
                  data-testid="settings-logout"
                >
                  Se déconnecter
                </button>
              </section>
            </div>
          </div>
        );
      })()}

      <header className="bg-card shadow-[var(--shadow-card)] sticky top-0 z-50 border-b border-border">
        <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-2 md:gap-8">
          <div className="flex items-center gap-2 flex-shrink-0">
            <img src="/favicon.png" alt="logo" className="w-7 h-7 rounded-full flex-shrink-0" />
            <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-black text-foreground leading-tight">
              {activeName ? `Bienvenue, ${activeName}` : "Déclic Financier"}
            </h1>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span title={syncStatus}>{syncLabel}</span>
              <span className="truncate max-w-[120px] hidden sm:inline">{user?.email}</span>
              {userProfile.userType && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium hidden sm:inline">
                  {coupleProfileLabel
                    ? coupleProfileLabel
                    : userProfile.userType === "couple"
                      ? "👥 En couple"
                      : "🧍 Célibataire"}
                </span>
              )}
            </div>
            </div>
          </div>
          <div className="flex-1 text-center hidden sm:block">
            <p className="text-sm md:text-lg font-semibold text-secondary line-clamp-1">
              "{citation}"
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={exportAll}
              className="p-3 min-w-[44px] min-h-[44px] text-muted-foreground hover:text-foreground flex items-center justify-center"
              title="Télécharger sauvegarde"
              data-testid="button-export"
            >
              📥
            </button>
            <label
              className="p-3 min-w-[44px] min-h-[44px] text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer"
              title="Restaurer sauvegarde"
            >
              📤
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (confirm("Restaurer cette sauvegarde ? Cela écrasera vos données actuelles.")) {
                      importAll(file);
                    }
                  }
                }}
              />
            </label>
            <button
              onClick={() => setShowReset(true)}
              className="p-3 min-w-[44px] min-h-[44px] text-muted-foreground hover:text-foreground flex items-center justify-center"
              data-testid="button-reset"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 min-w-[44px] min-h-[44px] text-muted-foreground hover:text-foreground flex items-center justify-center"
              data-testid="button-dark-mode"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-3 min-w-[44px] min-h-[44px] text-muted-foreground hover:text-foreground flex items-center justify-center"
              title="Paramètres"
              data-testid="button-settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={logout}
              className="p-3 min-w-[44px] min-h-[44px] text-muted-foreground hover:text-destructive flex items-center justify-center"
              title={`Déconnexion (${user?.email})`}
              data-testid="button-logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-2 sm:hidden">
          <p className="text-sm font-semibold text-secondary text-center line-clamp-2">
            "{citation}"
          </p>
        </div>

        <div className="sticky top-[72px] z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 overflow-x-auto border-t border-border">
          <div className="flex px-2 md:px-6 min-w-max">
            <TabButton
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
              icon={<Home className="w-5 h-5 md:w-4 md:h-4" />}
              label="Dashboard"
            />
            <TabButton
              active={activeTab === "credits"}
              onClick={() => setActiveTab("credits")}
              icon={<CreditCard className="w-5 h-5 md:w-4 md:h-4" />}
              label="Crédits"
            />
            <TabButton
              active={activeTab === "expenses"}
              onClick={() => setActiveTab("expenses")}
              icon={<Receipt className="w-5 h-5 md:w-4 md:h-4" />}
              label="Charges"
            />
            <TabButton
              active={activeTab === "courses"}
              onClick={() => setActiveTab("courses")}
              icon={<ShoppingCart className="w-5 h-5 md:w-4 md:h-4" />}
              label="Courses"
            />
            <TabButton
              active={activeTab === "savings"}
              onClick={() => setActiveTab("savings")}
              icon={
                <div className="relative">
                  <PiggyBank className="w-5 h-5 md:w-4 md:h-4" />
                  {!userProfile.setupSavingsDone && (
                    <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1 text-amber-500" />
                  )}
                </div>
              }
              label="Épargne"
            />
            <TabButton
              active={activeTab === "couple"}
              onClick={() => setActiveTab("couple")}
              icon={<Heart className="w-5 h-5 md:w-4 md:h-4" />}
              label={userProfile.userType === "couple" ? "Couple" : "Motivation"}
            />
            <TabButton
              active={activeTab === "defis"}
              onClick={() => setActiveTab("defis")}
              icon={<Swords className="w-5 h-5 md:w-4 md:h-4" />}
              label="Défis"
            />
          </div>
        </div>
      </header>

      {migrationStatus && migrationStatus !== "running" && migrationStatus.status !== "skipped" && (
        <div
          className={`px-4 py-3 flex items-center justify-between gap-3 text-sm font-medium ${
            migrationStatus.status === "success"
              ? "bg-green-500/10 border-b border-green-500/20 text-green-700 dark:text-green-400"
              : "bg-destructive/10 border-b border-destructive/20 text-destructive"
          }`}
          data-testid="migration-banner"
        >
          <span>
            {migrationStatus.status === "success"
              ? `✅ ${migrationStatus.itemCount} éléments importés depuis votre appareil vers le cloud`
              : `⚠️ Erreur lors de la migration : ${migrationStatus.error}`}
          </span>
          <button
            onClick={dismissMigration}
            data-testid="migration-dismiss"
            className="flex-shrink-0 text-xs underline opacity-70 hover:opacity-100"
          >
            Fermer
          </button>
        </div>
      )}

      {showPersistentBanner && (
        <EscalationBanner
          onStartQuiz={() => setEscalationShowQuiz(true)}
          onDismiss={() => setEscalationBannerDismissedThisSession(true)}
        />
      )}

      <main className="px-3 md:px-6 py-4 md:py-8 max-w-2xl mx-auto">
        {activeTab === "dashboard" && showE2Card && (
          <EscalationDashboardCard
            skipCount={perEscalation.skipCount}
            onSkip={perProfileEscalation.skip}
            onStartQuiz={() => setEscalationShowQuiz(true)}
          />
        )}
        {activeTab === "dashboard" && (
          <>
            <DashboardHero
              totalIncome={totalIncome}
              totalCredits={totalCredits}
              totalExpenses={totalExpenses}
              groceryBudget={data.groceryBudget}
              surplus={surplus}
              startingBalance={data.startingBalance}
              incomes={data.incomes}
              credits={data.credits}
              projection={projection}
              lastPaymentMonth={data.lastPaymentMonth}
              onNavigateToExpenses={() => setActiveTab("expenses")}
              onUpdateIncome={updateIncome}
              onUpdateStartingBalance={updateStartingBalance}
              onCloseMonth={() => {
                try {
                  monthlyData.closeMonth(data.credits, data.expenses, data.groceryExpenses);
                  challenges.onMonthClosed(totalDebt);
                  resetLastPaymentMonth();
                  data.incomes.forEach((income) => {
                    updateIncome(income.id, { receivedDate: null });
                  });
                  toast({
                    title: "Mois clôturé",
                    description: "Les données ont été archivées et le nouveau mois est prêt.",
                  });
                } catch (error) {
                  console.error("❌ Erreur clôture:", error);
                }
              }}
              currentMonth={monthlyData.currentMonth}
              monthlyRewards={rewards.rewards.totalPoints}
              expenses={data.expenses}
              totalDebt={totalDebt}
              monthlyPayment={totalCredits}
              groceryExpenses={data.groceryExpenses}
              appliedCreditsAmount={data.appliedCreditsAmount}
              userType={userProfile.userType}
              profileType={effectiveProfileType}
              onAttributeToCredits={(surplusAmount: number) => {
                const unsettledCredits = data.credits
                  .filter((c) => !c.settled && c.remainingAmount > 0)
                  .sort((a, b) => a.remainingAmount - b.remainingAmount);
                if (unsettledCredits.length === 0) return;
                const smallest = unsettledCredits[0];
                updateCredit(smallest.id, {
                  monthlyPayment: smallest.monthlyPayment + surplusAmount,
                });
                challenges.onSurplusApplied();
                rewards.addPoints(50, "Surplus attribué");
                toast({
                  title: "Surplus attribué",
                  description: `Surplus de ${surplusAmount.toFixed(2)}€ ajouté au crédit ${smallest.name} !`,
                });
              }}
            />
            {userProfile.setupExpensesDone && (
              <ChargesDashboardWidget onNavigateToCharges={() => setActiveTab("expenses")} />
            )}
            <BudgetCoursesDashboardWidget onNavigateToCourses={() => setActiveTab("courses")} />
            <MonthlyReset
              currentMonth={monthlyData.currentMonth}
              credits={data.credits}
              expenses={data.expenses}
              groceryExpenses={data.groceryExpenses}
              onCloseMonth={() => {
                try {
                  monthlyData.closeMonth(data.credits, data.expenses, data.groceryExpenses);
                  resetLastPaymentMonth();
                  data.incomes.forEach((income) => {
                    updateIncome(income.id, { receivedDate: null });
                  });
                } catch (error) {
                  console.error("❌ Erreur clôture:", error);
                }
              }}
              onResetVariables={resetVariableSpends}
              onCloneCharges={() => {
                data.expenses.forEach((expense) => {
                  updateExpense(expense.id, { actualAmount: 0 });
                });
              }}
            />
            <MonthlyHistory
              monthlyHistory={monthlyData.monthlyHistory}
              currentMonth={monthlyData.currentMonth}
              allMonths={monthlyData.getAllMonths()}
              getMonthComparison={monthlyData.getMonthComparison}
              calculateDebtFreeProjection={monthlyData.calculateDebtFreeProjection}
              credits={data.credits}
            />
          </>
        )}

        {activeTab === "credits" && (
          !userProfile.setupCreditsDone ? (
            <LockedTabCard
              emoji="🏦"
              title="Crédits & Dettes"
              description="Ajoutez vos crédits pour suivre votre progression vers la liberté financière."
              onSetup={() => openWizardAtStep(2)}
            />
          ) : (
            <Credits
              credits={data.credits}
              totalCredits={totalCredits}
              creditsLocked={data.creditsLocked}
              lastPaymentMonth={data.lastPaymentMonth}
              onUpdateCredit={updateCredit}
              onDeleteCredit={deleteCredit}
              onAddCredit={addCredit}
              onToggleCreditsLock={toggleCreditsLock}
              onApplyMonthlyPayment={() => {
                applyMonthlyPayment();
                challenges.onPaymentApplied();
              }}
            />
          )
        )}

        {activeTab === "defis" && (
          <Challenges
            challengeData={challenges.challengeData}
            dailyCompleted={challenges.dailyCompleted}
            weeklyCompleted={challenges.weeklyCompleted}
            monthlyCompleted={challenges.monthlyCompleted}
            totalPoints={rewards.rewards.totalPoints}
            currentStreak={rewards.rewards.currentStreak}
          />
        )}

        {activeTab === "couple" && userProfile.userType === "couple" && (
          <Couple
            surplus={surplus}
            groceryBudget={data.groceryBudget}
            totalGrocerySpent={data.groceryExpenses.reduce((s, e) => s + e.amount, 0)}
            totalPoints={rewards?.rewards?.totalPoints ?? 0}
            dailyCompleted={challenges.dailyCompleted}
            weeklyCompleted={challenges.weeklyCompleted}
            monthlyCompleted={challenges.monthlyCompleted}
            totalDebt={totalDebt}
            memberName={memberName}
            partnerName={partnerName}
            currentProfile={currentProfile}
          />
        )}

        {activeTab === "couple" && userProfile.userType !== "couple" && (
          <div className="space-y-4">
            <div className="card-finance border-l-4 border-sky-400 bg-gradient-to-br from-sky-400/10 to-blue-500/5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">💪 Motivation personnelle</p>
              <p className="text-sm text-muted-foreground">Vos défis personnels cette semaine</p>
            </div>
            <div className="card-finance">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">🏆 Vos stats</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-black text-sky-500">{rewards?.rewards?.totalPoints ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Points gagnés</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-black text-amber-400">{rewards?.rewards?.currentStreak ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Jours de suite</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-black text-green-500">{challenges.dailyCompleted}</p>
                  <p className="text-xs text-muted-foreground mt-1">Défis quotidiens</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-black text-primary">{challenges.monthlyCompleted}</p>
                  <p className="text-xs text-muted-foreground mt-1">Défis mensuels</p>
                </div>
              </div>
            </div>
            <div className="card-finance">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">📊 Progression dette</p>
              <p className="text-2xl font-black text-foreground">
                {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(totalDebt)}
              </p>
              <p className="text-xs text-green-500 mt-1">↘ Restant à rembourser — continuez comme ça !</p>
            </div>
          </div>
        )}

        {activeTab === "expenses" && (
          !userProfile.setupExpensesDone ? (
            <LockedTabCard
              emoji="📊"
              title="Charges mensuelles"
              description="Saisissez vos charges fixes pour suivre votre budget mois après mois."
              onSetup={() => openWizardAtStep(3)}
            />
          ) : (
            <ChargesTab />
          )
        )}

        {activeTab === "savings" && (
          !userProfile.setupSavingsDone ? (
            <LockedTabCard
              emoji="💾"
              title="Épargne"
              description="Définissez vos objectifs d'épargne et suivez votre progression vers vos rêves."
              onSetup={() => openWizardAtStep(4)}
            />
          ) : (
            <Savings
              goals={goals}
              onAddGoal={addGoal}
              onUpdateGoal={updateGoal}
              onDeleteGoal={deleteGoal}
            />
          )
        )}

        {activeTab === "courses" && (
          <BudgetCoursesTab />
        )}
      </main>

      {showReset && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-xl p-6 max-w-sm w-full shadow-lg">
            <h3 className="font-semibold text-lg mb-3">
              Réinitialiser les données entrées ?
            </h3>
            <div className="text-muted-foreground text-sm space-y-3 mb-5">
              <p className="font-medium text-foreground">Seront effacés :</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Montants réels des charges</li>
                <li>Salaires marqués comme reçus</li>
                <li>Courses ajoutées</li>
                <li>Historique mensuel</li>
                <li>Points et défis</li>
              </ul>
              <p className="font-medium text-foreground pt-2">Conservés :</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Crédits et montants</li>
                <li>Budgets par défaut</li>
                <li>Salaires mensuels</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReset(false)}
                className="flex-1 min-h-[48px] py-3 px-4 rounded-lg bg-muted font-medium text-base"
                data-testid="button-cancel-reset"
              >
                Annuler
              </button>
              <button
                onClick={handleReset}
                className="flex-1 min-h-[48px] py-3 px-4 rounded-lg bg-destructive text-destructive-foreground font-medium text-base"
                data-testid="button-confirm-reset"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} dismiss={dismiss} />

      {messageNotif && (
        <MessageToast
          key={messageNotif.id}
          id={messageNotif.id}
          text={messageNotif.text}
          senderName={messageNotif.senderName}
          senderRole={messageNotif.senderRole}
          onDismiss={() => setMessageNotif(null)}
          onNavigate={() => { setActiveTab("couple"); setMessageNotif(null); }}
        />
      )}
    </div>
  );
}

interface LockedTabCardProps {
  emoji: string;
  title: string;
  description: string;
  onSetup: () => void;
}

function LockedTabCard({ emoji, title, description, onSetup }: LockedTabCardProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 space-y-5 text-center">
      <div className="relative">
        <span className="text-6xl opacity-30">{emoji}</span>
        <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1.5">
          <Lock className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      <div className="space-y-1.5 max-w-xs">
        <h3 className="text-lg font-black text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={onSetup}
        data-testid="button-unlock-tab"
        className="min-h-[52px] px-8 rounded-2xl bg-primary text-primary-foreground font-bold text-base hover:opacity-90 transition-opacity"
      >
        Configurer maintenant
      </button>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`tab-button flex items-center justify-center gap-2 ${active ? "tab-button-active" : ""}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default Index;
