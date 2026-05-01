import { useState, useEffect } from "react";
import { LogOut, LayoutDashboard, CreditCard, ShoppingCart, Sun, Moon } from "lucide-react";

function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}
import { useAuth } from "@/context/AuthContext";
import { FinancialProfileQuiz } from "@/components/FinancialProfileQuiz";
import { OnboardingSetup } from "@/components/OnboardingSetup";
import DashboardTab from "@/components/DashboardTab";
import ChargesTab from "@/components/ChargesTab";
import CoursesTab from "@/components/CoursesTab";
import { FeedbackButton } from "@/components/FeedbackButton";
import Login from "@/pages/Login";
import type { QuizAnswers } from "@/lib/profiles";

type Tab = "dashboard" | "charges" | "courses";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Tableau", icon: LayoutDashboard },
  { id: "charges", label: "Charges", icon: CreditCard },
  { id: "courses", label: "Courses", icon: ShoppingCart },
];

export default function Index() {
  const { user, loading, userProfile, saveQuizAnswers, skipQuiz } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-pulse">⚙️</div>
          <p className="text-muted-foreground text-sm">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  // Step 1: Quiz
  if (!userProfile.quizCompleted) {
    return (
      <FinancialProfileQuiz
        onComplete={async (answers: QuizAnswers) => { await saveQuizAnswers(answers); }}
        onSkip={skipQuiz}
        skipLabel="Passer le questionnaire"
      />
    );
  }

  // Step 2: Onboarding (name + balance)
  if (!userProfile.onboardingComplete) {
    return <OnboardingSetup />;
  }

  // Step 3: Main app
  return <AppMain />;
}

function AppMain() {
  const { userProfile, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");
  const { dark, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo-bleu.png" alt="Déclic Financier" className="hidden dark:block h-9 w-auto" />
            <img src="/logo-blanc.png" alt="Déclic Financier" className="block dark:hidden h-9 w-auto" />
            {userProfile.memberName && (
              <span className="text-sm text-muted-foreground">· {userProfile.memberName}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggle}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Changer le thème"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[36px] px-2"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Tab content */}
      <main className="flex-1 overflow-y-auto pb-20" style={{ backgroundColor: "hsl(var(--content-bg, var(--background)))" }}>
        {tab === "dashboard" && <DashboardTab />}
        {tab === "charges" && <ChargesTab />}
        {tab === "courses" && <CoursesTab />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-lg mx-auto flex">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              data-testid={`tab-${id}`}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-semibold transition-colors ${
                tab === id ? "text-sky-400" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${tab === id ? "stroke-[2.5]" : ""}`} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <FeedbackButton />
    </div>
  );
}
