import { useState } from "react";
import { X, Plus, Trash2, CheckCircle, ChevronRight, Copy, Check } from "lucide-react";
import type { Credit, Expense, ExpenseCategory, SavingsGoal, SavingsTimeline } from "@/types/finance";

interface SetupWizardProps {
  step: 1 | 2 | 3 | 4 | 5;
  userType?: "single" | "couple" | null;
  userEmail?: string | null;
  currentBalance: number;
  credits: Credit[];
  expenses: Expense[];
  savingsGoals: SavingsGoal[];
  onSetBalance: (amount: number) => void;
  onAddCredit: (credit: Omit<Credit, "id">) => void;
  onAddExpense: (expense: Omit<Expense, "id">) => void;
  onAddSavingsGoal: (goal: Omit<SavingsGoal, "id">) => void;
  onStepComplete: (step: 1 | 2 | 3 | 4 | 5, balance?: number) => void;
  onDismiss: () => void;
}

const EXPENSE_CATEGORIES: { key: ExpenseCategory; label: string; emoji: string }[] = [
  { key: "finances", label: "Finances", emoji: "💰" },
  { key: "logement", label: "Logement", emoji: "🏠" },
  { key: "loisirs", label: "Loisirs", emoji: "🎉" },
  { key: "transport", label: "Transport", emoji: "🚗" },
  { key: "sante", label: "Santé", emoji: "👨‍⚕️" },
  { key: "remboursements", label: "Remboursements", emoji: "🔄" },
  { key: "divers", label: "Divers", emoji: "🔀" },
];

const TIMELINE_OPTIONS: { key: SavingsTimeline; label: string; detail: string }[] = [
  { key: "court", label: "Court terme", detail: "0–6 mois" },
  { key: "moyen", label: "Moyen terme", detail: "6–18 mois" },
  { key: "long", label: "Long terme", detail: "18 mois+" },
];

const SAVINGS_ICONS = ["💰", "🏖️", "🏠", "🚗", "📚", "💎", "🎓", "✈️", "🏋️", "🎁"];

export function SetupWizard({
  step,
  userType,
  userEmail,
  currentBalance,
  credits,
  expenses,
  savingsGoals,
  onSetBalance,
  onAddCredit,
  onAddExpense,
  onAddSavingsGoal,
  onStepComplete,
  onDismiss,
}: SetupWizardProps) {
  const isCouple = userType === "couple";
  const TOTAL_STEPS = isCouple ? 5 : 4;

  const stepTitles = [
    "Mon solde de départ",
    "Mes crédits",
    "Mes charges",
    "Mon épargne",
    ...(isCouple ? ["Inviter mon partenaire"] : []),
  ];

  const stepSubtitles = [
    "Pour calculer votre budget mensuel",
    "Crédits et dettes en cours",
    "Charges fixes mensuelles",
    "Objectifs d'épargne personnels",
    ...(isCouple ? ["Partagez l'accès avec votre partenaire"] : []),
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      <div className="sticky top-0 bg-background border-b border-border z-10 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Étape {step} sur {TOTAL_STEPS}
            </p>
            <h1 className="text-lg font-black text-foreground">{stepTitles[step - 1]}</h1>
            <p className="text-sm text-muted-foreground">{stepSubtitles[step - 1]}</p>
          </div>
          <button
            onClick={onDismiss}
            data-testid="setup-wizard-dismiss"
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                i + 1 < step
                  ? "bg-green-500"
                  : i + 1 === step
                    ? "bg-primary"
                    : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {step === 1 && (
          <Step1Balance
            currentBalance={currentBalance}
            onSetBalance={onSetBalance}
            onComplete={(bal) => onStepComplete(1, bal)}
            onSkip={onDismiss}
          />
        )}
        {step === 2 && (
          <Step2Credits
            credits={credits}
            onAddCredit={onAddCredit}
            onComplete={() => onStepComplete(2)}
            onSkip={onDismiss}
          />
        )}
        {step === 3 && (
          <Step3Expenses
            expenses={expenses}
            onAddExpense={onAddExpense}
            onComplete={() => onStepComplete(3)}
            onSkip={onDismiss}
          />
        )}
        {step === 4 && (
          <Step4Savings
            savingsGoals={savingsGoals}
            onAddSavingsGoal={onAddSavingsGoal}
            onComplete={() => onStepComplete(4)}
            onSkip={onDismiss}
            isLastStep={!isCouple}
          />
        )}
        {step === 5 && (
          <Step5Couple
            userEmail={userEmail ?? null}
            onComplete={() => onStepComplete(5)}
          />
        )}
      </div>
    </div>
  );
}

function Step1Balance({
  currentBalance,
  onSetBalance,
  onComplete,
  onSkip,
}: {
  currentBalance: number;
  onSetBalance: (amount: number) => void;
  onComplete: (balance: number) => void;
  onSkip: () => void;
}) {
  const [balanceStr, setBalanceStr] = useState(
    currentBalance > 0 ? String(currentBalance) : ""
  );

  const handleSubmit = () => {
    const val = parseFloat(balanceStr.replace(",", "."));
    const balance = isNaN(val) ? 0 : val;
    onSetBalance(balance);
    onComplete(balance);
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto w-full space-y-6">
      <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 text-center space-y-1">
        <p className="text-4xl">💳</p>
        <p className="text-sm text-muted-foreground">
          Quel est votre solde actuel sur votre compte ?
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-foreground">Solde actuel</label>
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={balanceStr}
            onChange={(e) => setBalanceStr(e.target.value)}
            data-testid="input-starting-balance"
            className="w-full min-h-[56px] text-2xl font-black text-center rounded-2xl border-2 border-border bg-card px-4 pr-12 focus:outline-none focus:border-primary transition-colors"
            autoFocus
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">
            €
          </span>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Ce solde servira de base pour calculer votre budget mensuel
        </p>
      </div>

      <div className="space-y-3 pt-2">
        <button
          onClick={handleSubmit}
          data-testid="button-step1-continue"
          className="w-full min-h-[52px] rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          Voir mon dashboard
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={onSkip}
          data-testid="button-step1-skip"
          className="w-full min-h-[44px] rounded-2xl text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
        >
          Je le ferai plus tard
        </button>
      </div>
    </div>
  );
}

function Step2Credits({
  credits,
  onAddCredit,
  onComplete,
  onSkip,
}: {
  credits: Credit[];
  onAddCredit: (credit: Omit<Credit, "id">) => void;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [name, setName] = useState("");
  const [monthly, setMonthly] = useState("");
  const [remaining, setRemaining] = useState("");
  const [added, setAdded] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(credits.length === 0);

  const handleAdd = () => {
    if (!name.trim()) return;
    const monthlyVal = parseFloat(monthly.replace(",", ".")) || 0;
    const remainingVal = parseFloat(remaining.replace(",", ".")) || 0;
    onAddCredit({
      name: name.trim(),
      monthlyPayment: monthlyVal,
      remainingAmount: remainingVal,
      initialAmount: remainingVal,
      settled: false,
    });
    setAdded((prev) => [...prev, name.trim()]);
    setName("");
    setMonthly("");
    setRemaining("");
    setShowForm(false);
  };

  const allCredits = credits;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto w-full space-y-4">
      {allCredits.length > 0 && (
        <div className="space-y-2">
          {allCredits.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
            >
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-sm truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.monthlyPayment.toFixed(0)}€/mois — {c.remainingAmount.toFixed(0)}€ restant
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="rounded-2xl border-2 border-primary/30 bg-card p-4 space-y-3">
          <p className="text-sm font-bold text-foreground">Ajouter un crédit</p>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Ex: Crédit immobilier"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-credit-name"
              className="w-full min-h-[48px] text-base rounded-xl border border-border bg-background px-4 focus:outline-none focus:border-primary transition-colors"
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Mensualité"
                  value={monthly}
                  onChange={(e) => setMonthly(e.target.value)}
                  data-testid="input-credit-monthly"
                  className="w-full min-h-[48px] text-base rounded-xl border border-border bg-background px-4 pr-8 focus:outline-none focus:border-primary transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Capital restant"
                  value={remaining}
                  onChange={(e) => setRemaining(e.target.value)}
                  data-testid="input-credit-remaining"
                  className="w-full min-h-[48px] text-base rounded-xl border border-border bg-background px-4 pr-8 focus:outline-none focus:border-primary transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 min-h-[44px] rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleAdd}
              disabled={!name.trim()}
              data-testid="button-add-credit"
              className="flex-1 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 transition-opacity"
            >
              Ajouter
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          data-testid="button-show-credit-form"
          className="w-full min-h-[48px] rounded-2xl border-2 border-dashed border-primary/40 text-primary text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un crédit
        </button>
      )}

      <div className="space-y-3 pt-2">
        <button
          onClick={onComplete}
          data-testid="button-step2-continue"
          className="w-full min-h-[52px] rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          {allCredits.length > 0 ? "Continuer" : "Pas de crédit pour l'instant"}
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={onSkip}
          data-testid="button-step2-skip"
          className="w-full min-h-[44px] rounded-2xl text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
        >
          Je le ferai plus tard
        </button>
      </div>
    </div>
  );
}

function Step3Expenses({
  expenses,
  onAddExpense,
  onComplete,
  onSkip,
}: {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, "id">) => void;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>("logement");
  const [name, setName] = useState("");
  const [prevu, setPrevu] = useState("");
  const [showForm, setShowForm] = useState(expenses.length === 0);

  const handleAdd = () => {
    if (!name.trim()) return;
    const prevuVal = parseFloat(prevu.replace(",", ".")) || 0;
    onAddExpense({
      name: name.trim(),
      amount: prevuVal,
      actualAmount: 0,
      category: selectedCategory,
      custom: true,
    });
    setName("");
    setPrevu("");
    setShowForm(false);
  };

  const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
    ...cat,
    items: expenses.filter((e) => e.category === cat.key),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto w-full space-y-4">
      {byCategory.length > 0 && (
        <div className="space-y-3">
          {byCategory.map((cat) => (
            <div key={cat.key} className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-2 bg-muted/50 flex items-center gap-2">
                <span>{cat.emoji}</span>
                <span className="text-sm font-bold text-foreground">{cat.label}</span>
                <span className="text-xs text-muted-foreground ml-auto">{cat.items.length} charge{cat.items.length > 1 ? "s" : ""}</span>
              </div>
              {cat.items.map((item) => (
                <div key={item.id} className="px-4 py-2.5 flex items-center gap-3 border-t border-border/50">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="flex-1 text-sm text-foreground">{item.name}</span>
                  <span className="text-sm font-bold text-foreground">{item.amount.toFixed(0)}€</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="rounded-2xl border-2 border-primary/30 bg-card p-4 space-y-3">
          <p className="text-sm font-bold text-foreground">Ajouter une charge</p>

          <div className="flex gap-2 flex-wrap">
            {EXPENSE_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                data-testid={`button-category-${cat.key}`}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  selectedCategory === cat.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Ex: Loyer, Internet, Netflix..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-expense-name"
              className="w-full min-h-[48px] text-base rounded-xl border border-border bg-background px-4 focus:outline-none focus:border-primary transition-colors"
            />
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Montant prévu"
                value={prevu}
                onChange={(e) => setPrevu(e.target.value)}
                data-testid="input-expense-amount"
                className="w-full min-h-[48px] text-base rounded-xl border border-border bg-background px-4 pr-8 focus:outline-none focus:border-primary transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 min-h-[44px] rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleAdd}
              disabled={!name.trim()}
              data-testid="button-add-expense"
              className="flex-1 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 transition-opacity"
            >
              Ajouter
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          data-testid="button-show-expense-form"
          className="w-full min-h-[48px] rounded-2xl border-2 border-dashed border-primary/40 text-primary text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter une charge
        </button>
      )}

      <div className="space-y-3 pt-2">
        <button
          onClick={onComplete}
          data-testid="button-step3-continue"
          className="w-full min-h-[52px] rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          {expenses.length > 0 ? "Continuer" : "Aucune charge pour l'instant"}
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={onSkip}
          data-testid="button-step3-skip"
          className="w-full min-h-[44px] rounded-2xl text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
        >
          Je le ferai plus tard
        </button>
      </div>
    </div>
  );
}

function Step4Savings({
  savingsGoals,
  onAddSavingsGoal,
  onComplete,
  onSkip,
  isLastStep = true,
}: {
  savingsGoals: SavingsGoal[];
  onAddSavingsGoal: (goal: Omit<SavingsGoal, "id">) => void;
  onComplete: () => void;
  onSkip: () => void;
  isLastStep?: boolean;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [timeline, setTimeline] = useState<SavingsTimeline>("court");
  const [icon, setIcon] = useState("💰");
  const [showForm, setShowForm] = useState(savingsGoals.length === 0);

  const handleAdd = () => {
    if (!name.trim()) return;
    const targetVal = parseFloat(target.replace(",", ".")) || 0;
    const currentVal = parseFloat(current.replace(",", ".")) || 0;
    onAddSavingsGoal({ name: name.trim(), targetAmount: targetVal, currentAmount: currentVal, timeline, icon });
    setName("");
    setTarget("");
    setCurrent("");
    setTimeline("court");
    setIcon("💰");
    setShowForm(false);
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto w-full space-y-4">
      {savingsGoals.length > 0 && (
        <div className="space-y-2">
          {savingsGoals.map((g) => {
            const pct = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
            return (
              <div key={g.id} className="rounded-2xl border border-border bg-card px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">{g.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm truncate">{g.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.currentAmount.toFixed(0)}€ / {g.targetAmount.toFixed(0)}€ — {pct.toFixed(0)}%
                  </p>
                </div>
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      )}

      {showForm ? (
        <div className="rounded-2xl border-2 border-primary/30 bg-card p-4 space-y-3">
          <p className="text-sm font-bold text-foreground">Ajouter un objectif</p>

          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Icône</p>
            <div className="flex gap-2 flex-wrap">
              {SAVINGS_ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-colors ${
                    icon === ic ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-muted/70"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            placeholder="Ex: Fonds d'urgence, Vacances..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="input-savings-name"
            className="w-full min-h-[48px] text-base rounded-xl border border-border bg-background px-4 focus:outline-none focus:border-primary transition-colors"
          />

          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Objectif"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                data-testid="input-savings-target"
                className="w-full min-h-[48px] text-base rounded-xl border border-border bg-background px-4 pr-8 focus:outline-none focus:border-primary transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
            </div>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Déjà épargné"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                data-testid="input-savings-current"
                className="w-full min-h-[48px] text-base rounded-xl border border-border bg-background px-4 pr-8 focus:outline-none focus:border-primary transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Horizon</p>
            <div className="grid grid-cols-3 gap-2">
              {TIMELINE_OPTIONS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTimeline(t.key)}
                  data-testid={`button-timeline-${t.key}`}
                  className={`py-2 px-2 rounded-xl text-center transition-colors ${
                    timeline === t.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <p className="text-xs font-bold">{t.label}</p>
                  <p className="text-[10px] opacity-70">{t.detail}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 min-h-[44px] rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleAdd}
              disabled={!name.trim()}
              data-testid="button-add-savings-goal"
              className="flex-1 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 transition-opacity"
            >
              Ajouter
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          data-testid="button-show-savings-form"
          className="w-full min-h-[48px] rounded-2xl border-2 border-dashed border-primary/40 text-primary text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un objectif
        </button>
      )}

      <div className="space-y-3 pt-2">
        <button
          onClick={onComplete}
          disabled={savingsGoals.length === 0 && !showForm}
          data-testid="button-step4-continue"
          className="w-full min-h-[52px] rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {savingsGoals.length > 0
            ? isLastStep ? "Terminer la configuration 🎉" : "Continuer"
            : isLastStep ? "Terminer sans objectif" : "Continuer sans objectif"}
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={onSkip}
          data-testid="button-step4-skip"
          className="w-full min-h-[44px] rounded-2xl text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
        >
          Je le ferai plus tard
        </button>
      </div>
    </div>
  );
}

function Step5Couple({
  userEmail,
  onComplete,
}: {
  userEmail: string | null;
  onComplete: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!userEmail) return;
    try {
      await navigator.clipboard.writeText(userEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard not available
    }
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto w-full space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-6 flex flex-col items-center gap-3 text-center">
        <span className="text-5xl">👫</span>
        <p className="text-base font-black text-foreground">
          Gérez votre budget ensemble
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Votre partenaire peut se connecter avec le même compte en utilisant vos identifiants.
          Vous verrez chacun votre profil séparé une fois connecté.
        </p>
      </div>

      {userEmail && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
            Votre adresse e-mail de connexion
          </p>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3">
            <p
              className="flex-1 text-sm font-medium text-foreground truncate"
              data-testid="text-user-email"
            >
              {userEmail}
            </p>
            <button
              onClick={handleCopy}
              data-testid="button-copy-email"
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copier
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground px-1">
            Partagez cette adresse et votre mot de passe avec votre partenaire pour qu'il puisse se connecter.
          </p>
        </div>
      )}

      <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4 space-y-1.5">
        <p className="text-sm font-bold text-blue-800 dark:text-blue-300">💡 Comment ça marche</p>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
          <li>Votre partenaire se connecte avec vos identifiants</li>
          <li>Il choisit son profil « Épouse » à la connexion</li>
          <li>Chaque profil a son propre espace personnel</li>
          <li>Vos données communes sont partagées en temps réel</li>
        </ul>
      </div>

      <button
        onClick={onComplete}
        data-testid="button-step5-continue"
        className="w-full min-h-[52px] rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
      >
        Terminer la configuration 🎉
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
