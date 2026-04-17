import { SurplusChargesCard } from "./SurplusChargesCard";
import { useState } from "react";
import { getMsg } from "@/lib/messages";
import type { UserType } from "@/context/AuthContext";
import { getProfile } from "@/lib/profiles";
import type { ProfileType } from "@/lib/profiles";
import {
  TrendingDown,
  Wallet,
  CalendarCheck,
  CalendarClock,
  Pencil,
  ChevronDown,
  ChevronUp,
  Zap,
  ShoppingCart,
  CalendarX2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardHeroProps {
  totalIncome: number;
  totalCredits: number;
  totalExpenses: number;
  groceryBudget: number;
  surplus: number;
  startingBalance: number;
  incomes: Array<{
    id: string;
    name: string;
    amount: number;
    receiptDate?: number;
    receivedDate?: string | null;
  }>;
  credits: Array<{
    id: string;
    name: string;
    monthlyPayment: number;
    remainingAmount: number;
    initialAmount: number;
    settled?: boolean;
  }>;
  projection: Array<{ month: number; debt: number; treasury: number }>;
  onUpdateIncome: (
    id: string,
    updates: {
      amount?: number;
      receiptDate?: number;
      receivedDate?: string | null;
    },
  ) => void;
  onUpdateStartingBalance: (amount: number) => void;
  onCloseMonth?: () => void;
  currentMonth?: string;
  monthlyRewards?: number;
  expenses: Array<{
    id: string;
    name: string;
    amount: number;
    actualAmount: number;
  }>;
  totalDebt: number;
  monthlyPayment: number;
  onAttributeToCredits?: (amount: number) => void;
  groceryExpenses?: Array<{ id: string; name: string; amount: number; date?: string }>;
  appliedCreditsAmount?: number;
  lastPaymentMonth?: string;
  onNavigateToExpenses?: () => void;
  userType?: UserType | null;
  profileType?: ProfileType | null;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

function ProgressBar({
  pct,
  color = "bg-primary",
  height = "h-2.5",
}: {
  pct: number;
  color?: string;
  height?: string;
}) {
  return (
    <div className={`w-full bg-muted rounded-full ${height} overflow-hidden`}>
      <div
        className={`${height} rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

export const DashboardHero = ({
  totalIncome,
  totalCredits,
  totalExpenses,
  expenses,
  groceryBudget,
  surplus,
  startingBalance,
  incomes,
  credits,
  projection,
  onUpdateIncome,
  onUpdateStartingBalance,
  onCloseMonth,
  currentMonth,
  monthlyRewards,
  totalDebt,
  monthlyPayment,
  onAttributeToCredits,
  groceryExpenses = [],
  appliedCreditsAmount = 0,
  lastPaymentMonth,
  onNavigateToExpenses,
  userType = null,
  profileType = null,
}: DashboardHeroProps): JSX.Element => {
  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceValue, setBalanceValue] = useState(startingBalance);
  const [showDebtChart, setShowDebtChart] = useState(false);
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [incomeAmountValue, setIncomeAmountValue] = useState(0);
  const [incomeDateValue, setIncomeDateValue] = useState(1);
  const [savingIncomeId, setSavingIncomeId] = useState<string | null>(null);

  // ── Grocery budget calc ──────────────────────────────────────────
  const totalGrocerySpent = groceryExpenses.reduce((sum, e) => sum + e.amount, 0);
  const groceryRestant = groceryBudget - totalGrocerySpent;
  const groceryPct = groceryBudget > 0 ? Math.round((totalGrocerySpent / groceryBudget) * 100) : 0;
  const isGroceryOnTrack = groceryRestant >= 0;

  // Current week label
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekLabel = `${monday.getDate()}–${sunday.getDate()} ${sunday.toLocaleDateString("fr-FR", { month: "long" })}`;

  // ── Debt-free projection ─────────────────────────────────────────
  const initialTotalDebt = credits.reduce((sum, c) => sum + (c.initialAmount || c.remainingAmount), 0);
  const eliminatedDebt = Math.max(0, initialTotalDebt - totalDebt);
  const progressPct = initialTotalDebt > 0 ? Math.round((eliminatedDebt / initialTotalDebt) * 100) : 0;
  const monthsLeft = monthlyPayment > 0 && totalDebt > 0 ? Math.ceil(totalDebt / monthlyPayment) : 0;
  const debtFreeDate = new Date();
  if (monthsLeft > 0) debtFreeDate.setMonth(debtFreeDate.getMonth() + monthsLeft);
  const debtFreeDateStr = totalDebt <= 0
    ? "🎉 DEBT-FREE !"
    : debtFreeDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  // ── Dynamic balance ──────────────────────────────────────────────
  const receivedSalaries = incomes.reduce((sum, i) => sum + (i.receivedDate ? i.amount : 0), 0);
  const totalFixedSpent = expenses.reduce((sum, e) => sum + e.actualAmount, 0);
  const dynamicBalance = startingBalance + receivedSalaries - totalGrocerySpent - totalFixedSpent - appliedCreditsAmount;

  // ── Quick wins ───────────────────────────────────────────────────
  const receivedIncomes = incomes.filter((i) => i.receivedDate);
  const allSalariesReceived = receivedIncomes.length === incomes.length;
  const paymentAppliedThisMonth = !!lastPaymentMonth && lastPaymentMonth === currentMonth;
  const expensesWithinBudget = expenses.filter((e) => e.actualAmount > 0 && e.actualAmount <= e.amount).length;
  const expensesEntered = expenses.filter((e) => e.actualAmount > 0).length;
  const budgetRespected = expensesEntered > 0 && expensesWithinBudget === expensesEntered;

  // ── Next action ──────────────────────────────────────────────────
  const unreceivedIncomes = incomes.filter((i) => !i.receivedDate);
  let nextActionType: "salary" | "payment" | "close" = "close";
  if (unreceivedIncomes.length > 0) nextActionType = "salary";
  else if (!paymentAppliedThisMonth) nextActionType = "payment";

  // ── Income editing ───────────────────────────────────────────────
  const startEditingIncome = (income: { id: string; amount: number; receiptDate?: number }) => {
    setEditingIncomeId(income.id);
    setIncomeAmountValue(income.amount);
    setIncomeDateValue(income.receiptDate ?? 1);
  };

  const handleMarkReceived = (id: string) => {
    onUpdateIncome(id, { receivedDate: new Date().toISOString().split("T")[0] });
  };

  const handleIncomeSave = (id: string) => {
    setSavingIncomeId(id);
    onUpdateIncome(id, { amount: incomeAmountValue, receiptDate: incomeDateValue });
    setTimeout(() => { setEditingIncomeId(null); setSavingIncomeId(null); }, 500);
  };

  const handleIncomeKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") handleIncomeSave(id);
    if (e.key === "Escape") setEditingIncomeId(null);
  };

  const handleBalanceSave = () => {
    onUpdateStartingBalance(balanceValue);
    setEditingBalance(false);
  };

  return (
    <div className="space-y-3 pb-6">

      {/* ═══════════════════════════════════════════════════════════
          1. BUDGET COURSES — large sticky card
      ════════════════════════════════════════════════════════════ */}
      <div className="w-full -mx-3 md:-mx-6 px-3 md:px-6 [transform:translateZ(0)] [will-change:transform]">
        <button
          onClick={onNavigateToExpenses}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl border-l-4 text-left transition-all active:scale-[0.99] group ${
            isGroceryOnTrack
              ? "border-sky-400 bg-sky-400/10 hover:bg-sky-400/15"
              : "border-red-300 bg-red-300/10 hover:bg-red-300/15"
          }`}
          style={{ minHeight: "45px" }}
          data-testid="button-go-to-courses"
        >
          <span className="text-sm font-black whitespace-nowrap">💰 {getMsg(userType, "budget_label")}</span>
          <span className={`text-sm font-bold whitespace-nowrap flex-shrink-0 ${isGroceryOnTrack ? "text-sky-500 dark:text-sky-300" : "text-red-500 dark:text-red-300"}`}>
            {Math.round(totalGrocerySpent)}€/{Math.round(groceryBudget)}€
          </span>
          <div className="flex-1 min-w-0">
            <div className="h-2 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isGroceryOnTrack ? "bg-sky-400" : "bg-red-400"
                }`}
                style={{ width: `${Math.min(100, groceryPct)}%` }}
              />
            </div>
          </div>
          <span className={`text-sm font-bold whitespace-nowrap flex-shrink-0 ${isGroceryOnTrack ? "text-green-500 dark:text-green-300" : "text-red-500 dark:text-red-300"}`}>
            {isGroceryOnTrack ? `${Math.round(groceryRestant)}€ restant` : `+${Math.round(Math.abs(groceryRestant))}€ dépassé`}
          </span>
          <span className="text-base flex-shrink-0">{isGroceryOnTrack ? "✅" : "⚠️"}</span>
          <span className="text-xs font-semibold text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hidden md:inline">
            Aller aux courses
          </span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PROFILE INSIGHT — adapted to financial profile
      ════════════════════════════════════════════════════════════ */}
      {profileType && (() => {
        const p = getProfile(profileType);
        let insightEmoji = p.emoji;
        let insightText = "";

        if (p.dashboardFocus === "wins") {
          const winCount = expensesWithinBudget;
          insightText = winCount > 0
            ? `${winCount} charge${winCount > 1 ? "s" : ""} dans le budget ce mois — chaque victoire compte !`
            : "Commencez à entrer vos charges pour voir vos victoires.";
        } else if (p.dashboardFocus === "savings") {
          insightText = surplus > 0
            ? `Épargne potentielle : ${fmt(surplus)} / mois. Faites-la travailler !`
            : "Équilibrez vos dépenses pour libérer de l'épargne.";
        } else if (p.dashboardFocus === "actions") {
          insightText = expensesEntered > 0
            ? `${expensesEntered} action${expensesEntered > 1 ? "s" : ""} enregistrée${expensesEntered > 1 ? "s" : ""} ce mois. La discipline crée la richesse.`
            : "Aucune dépense enregistrée. Commencez maintenant.";
        } else if (p.dashboardFocus === "cta") {
          insightEmoji = "👉";
          insightText = "Prochaine action : enregistrez vos dépenses d'aujourd'hui.";
        } else {
          insightText = totalDebt > 0
            ? `Progression dette-libre : ${progressPct}%. Restez stratégique !`
            : "Objectif atteint : vous êtes debt-free ! 🏆";
        }

        return (
          <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-muted/50 border border-border text-sm" data-testid="profile-insight-card">
            <span className="text-xl flex-shrink-0 mt-0.5">{insightEmoji}</span>
            <div className="min-w-0">
              <span className="font-semibold text-foreground">{p.name} · </span>
              <span className="text-muted-foreground">{insightText}</span>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════
          2. QUICK WINS — real achievements only
      ════════════════════════════════════════════════════════════ */}
      {(() => {
        const wins: { key: string; label: string }[] = [];
        incomes.forEach((income) => {
          if (income.receivedDate) {
            wins.push({ key: `income-${income.id}`, label: `Salaire ${income.name} reçu (+${fmt(income.amount)})` });
          }
        });
        if (paymentAppliedThisMonth) {
          wins.push({ key: "payment", label: `${getMsg(userType, "payment_applied")} (${fmt(monthlyPayment)})` });
        }
        if (budgetRespected) {
          wins.push({ key: "budget", label: `${getMsg(userType, "budget_charges_respected")} (${expensesWithinBudget}/${expensesEntered})` });
        }
        return (
          <div className="card-finance">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">{getMsg(userType, "quick_wins_title")}</p>
            {wins.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">{getMsg(userType, "no_wins_yet")}</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {wins.map((w) => (
                  <div key={w.key} className="flex items-center gap-2 text-sm rounded-lg px-3 py-2 bg-green-500/10">
                    <span className="text-green-500">✅</span>
                    <span className="text-green-500 dark:text-green-300 font-medium">{w.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════
          3. PROGRESSION DEBT-FREE
      ════════════════════════════════════════════════════════════ */}
      {initialTotalDebt > 0 && (
        <div className="card-finance bg-gradient-to-br from-primary/10 to-primary/5 border-l-4 border-primary">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">🎯 Progression Debt-Free</p>
            <span className="text-xs font-bold text-primary">{progressPct}% complété</span>
          </div>
          {eliminatedDebt > 0 && (
            <p className="text-sm font-bold text-amber-400 dark:text-amber-300 mb-2">
              🎊 {getMsg(userType, "debt_celebration")} {fmt(eliminatedDebt)} !
            </p>
          )}
          <ProgressBar pct={progressPct} color="bg-sky-400" height="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>0€</span>
            <span>{fmt(initialTotalDebt)}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="bg-background/60 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">Restant</p>
              <p className="text-base font-black text-foreground">{fmt(totalDebt)}</p>
              {monthlyPayment > 0 && (
                <p className="text-xs text-green-500 dark:text-green-300">↘ -{fmt(monthlyPayment)}/mois</p>
              )}
            </div>
            <div className="bg-background/60 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">Debt-free prévu</p>
              <p className="text-sm font-black text-primary">{debtFreeDateStr}</p>
              {monthsLeft > 0 && <p className="text-xs text-muted-foreground">{monthsLeft} mois</p>}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          4. TOTAL DETTES (collapsible chart)
      ════════════════════════════════════════════════════════════ */}
      <div className="card-finance">
        <button
          onClick={() => setShowDebtChart(!showDebtChart)}
          className="w-full flex items-center justify-between min-h-[44px]"
          data-testid="button-toggle-debt-chart"
        >
          <div className="flex items-start gap-3 text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">📊 Dettes totales</p>
              <p className="text-2xl font-black text-foreground mt-0.5">{fmt(totalDebt)}</p>
              {monthlyPayment > 0 && (
                <p className="text-xs text-green-500 dark:text-green-300 font-semibold">↘ -{fmt(monthlyPayment)} ce mois • {getMsg(userType, "debt_free_on_track")}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground flex-shrink-0 ml-2">
            <span className="text-xs">{showDebtChart ? "Masquer" : "Détails"}</span>
            {showDebtChart ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showDebtChart && projection.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-primary" />
              <p className="text-xs font-semibold text-muted-foreground">Trajectoire 24 mois (Snowball)</p>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projection}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={(v) => `M${v}`} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number, name: string) => [fmt(value), name === "debt" ? "Dettes" : "Trésorerie"]}
                    labelFormatter={(label) => `Mois ${label}`}
                  />
                  <Line type="monotone" dataKey="debt" stroke="#f87171" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="treasury" stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {credits.filter(c => !c.settled && c.remainingAmount > 0).slice(0, 3).map(c => (
                <div key={c.id} className="bg-muted/50 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground truncate">{c.name}</p>
                  <p className="text-sm font-bold text-foreground">{fmt(c.remainingAmount)}</p>
                  <p className="text-xs text-primary">-{fmt(c.monthlyPayment)}/m</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          5. NEXT ACTION — dynamic, context-aware
      ════════════════════════════════════════════════════════════ */}
      <div className={`card-finance border-l-4 ${
        nextActionType === "close" ? "border-sky-400 bg-gradient-to-br from-sky-400/10 to-blue-500/5"
        : nextActionType === "salary" ? "border-amber-400 bg-gradient-to-br from-amber-400/10 to-yellow-500/5"
        : "border-sky-400 bg-gradient-to-br from-sky-400/10 to-blue-500/5"
      }`}>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">💡 Prochaine action</p>

        {nextActionType === "salary" && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Marquer {unreceivedIncomes.map(i => i.name).join(" & ")} comme reçu{unreceivedIncomes.length > 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {unreceivedIncomes.map((income) => (
                <button
                  key={income.id}
                  onClick={() => handleMarkReceived(income.id)}
                className="w-full min-h-[44px] bg-sky-400 hover:bg-sky-500 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  data-testid={`button-next-action-received-${income.id}`}
                >
                  ✅ Marquer {income.name} reçu ({fmt(income.amount)})
                </button>
              ))}
            </div>
          </div>
        )}

        {nextActionType === "payment" && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Appliquer paiement crédits du mois</p>
            <p className="text-xs text-muted-foreground">Tous les salaires sont reçus — il est temps d'appliquer les mensualités crédits.</p>
            {onAttributeToCredits && surplus > 0 && (
              <button
                onClick={() => onAttributeToCredits(surplus)}
                className="w-full min-h-[44px] bg-sky-400 hover:bg-sky-500 text-white rounded-lg font-bold text-sm transition flex items-center justify-center gap-2"
                data-testid="button-next-action-payment"
              >
                <Zap className="w-4 h-4" />
                Appliquer {fmt(monthlyPayment)} maintenant
              </button>
            )}
          </div>
        )}

        {nextActionType === "close" && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">✅ Paiement crédits appliqué !</p>
            <p className="text-xs text-muted-foreground">
              Prochaine étape : ajouter vos courses de la semaine.
            </p>
            {onNavigateToExpenses && (
              <button
                onClick={onNavigateToExpenses}
                className="w-full min-h-[44px] bg-sky-400 hover:bg-sky-500 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                data-testid="button-next-action-courses"
              >
                <ShoppingCart className="w-4 h-4" />
                Ajouter vos courses
              </button>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          6. SOLDE + REVENUS (editable, below fold)
      ════════════════════════════════════════════════════════════ */}
      <div className="card-finance bg-gradient-to-br from-secondary/10 to-primary/5 border-l-4 border-secondary">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Solde du compte joint</p>
            {editingBalance ? (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  value={balanceValue}
                  onChange={(e) => setBalanceValue(Number(e.target.value))}
                  className="w-32 min-h-[44px] px-3 py-2 rounded bg-muted text-lg font-bold"
                  autoFocus
                  data-testid="input-balance"
                />
                <button onClick={handleBalanceSave} className="text-primary text-sm font-bold min-w-[44px] min-h-[44px] flex items-center justify-center" data-testid="button-save-balance">✓</button>
                <button onClick={() => setEditingBalance(false)} className="text-muted-foreground text-sm min-w-[44px] min-h-[44px] flex items-center justify-center">✗</button>
              </div>
            ) : (
              <p
                onClick={() => { setBalanceValue(startingBalance); setEditingBalance(true); }}
                className={`text-2xl font-bold cursor-pointer mt-1 transition ${dynamicBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
              >
                {fmt(dynamicBalance)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Solde initial : {fmt(startingBalance)} (cliquer pour modifier)</p>
          </div>
          <Wallet className="w-6 h-6 text-secondary opacity-50 flex-shrink-0" />
        </div>
      </div>

      {/* Revenus */}
      <div className="card-finance space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Revenus mensuels</p>
        <div className="space-y-2">
          {incomes.map((income) => {
            const rd = income.receiptDate;
            const hasDate = rd !== undefined && rd >= 1 && rd <= 31;
            const isReceived = !!income.receivedDate;
            const receivedDay = isReceived ? new Date(income.receivedDate!).getDate() : null;
            const isEditing = editingIncomeId === income.id;
            const isSaving = savingIncomeId === income.id;

            if (isEditing) {
              return (
                <div key={income.id} className={`space-y-2 p-2 rounded-lg bg-muted/50 ${isSaving ? "opacity-60 pointer-events-none" : ""}`} data-testid={`income-row-${income.id}`}>
                  {isSaving && <p className="text-xs text-primary font-medium animate-pulse">Enregistrement...</p>}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16">Montant</span>
                    <input type="number" value={incomeAmountValue} onChange={(e) => setIncomeAmountValue(Number(e.target.value))} onKeyDown={(e) => handleIncomeKeyDown(e, income.id)} onFocus={(e) => e.target.select()} autoFocus disabled={isSaving} className="flex-1 min-h-[44px] px-3 py-2 rounded bg-muted text-base font-bold disabled:opacity-50" data-testid={`input-income-amount-${income.id}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16">Jour</span>
                    <input type="number" min={1} max={31} value={incomeDateValue} onChange={(e) => setIncomeDateValue(Math.min(31, Math.max(1, Number(e.target.value))))} onKeyDown={(e) => handleIncomeKeyDown(e, income.id)} disabled={isSaving} className="w-20 min-h-[44px] px-3 py-2 rounded bg-muted text-base font-bold disabled:opacity-50" data-testid={`input-income-date-${income.id}`} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleIncomeSave(income.id)} disabled={isSaving} className="flex-1 min-h-[44px] bg-primary text-primary-foreground rounded-lg font-medium text-sm disabled:opacity-50" data-testid={`button-save-income-${income.id}`}>{isSaving ? "Enregistrement..." : "Enregistrer"}</button>
                    <button onClick={() => setEditingIncomeId(null)} disabled={isSaving} className="flex-1 min-h-[44px] bg-muted rounded-lg font-medium text-sm disabled:opacity-50" data-testid={`button-cancel-income-${income.id}`}>Annuler</button>
                  </div>
                </div>
              );
            }

            return (
              <div key={income.id} className="space-y-1" data-testid={`income-row-${income.id}`}>
                <div
                  className={`flex justify-between items-center text-sm min-h-[44px] px-2 rounded-lg cursor-pointer hover:bg-muted/50 transition ${isSaving ? "opacity-50" : ""}`}
                  onClick={() => startEditingIncome(income)}
                >
                  <div className="flex items-center gap-2">
                    {isReceived ? <CalendarCheck className="w-4 h-4 text-green-500" /> : <CalendarClock className="w-4 h-4 text-muted-foreground" />}
                    <span className={isReceived ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"}>{income.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${isReceived ? "text-green-600 dark:text-green-400" : "text-primary"}`}>{fmt(income.amount)}</span>
                    {isReceived ? (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400">reçu le {receivedDay}</span>
                    ) : hasDate ? (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">prévu le {rd}</span>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">date non définie</span>
                    )}
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
                {!isReceived && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMarkReceived(income.id); }}
                    className="w-full min-h-[40px] px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition flex items-center justify-center gap-1.5"
                    data-testid={`button-mark-received-${income.id}`}
                  >
                    ✅ Marquer comme reçu
                  </button>
                )}
              </div>
            );
          })}
          <div className="border-t pt-1 mt-1 flex justify-between font-bold text-sm">
            <span>Total</span>
            <span className="text-green-600 dark:text-green-400">{fmt(totalIncome)}</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          7. SURPLUS CHARGES CARD
      ════════════════════════════════════════════════════════════ */}
      <SurplusChargesCard
        expenses={expenses}
        totalCredits={totalCredits}
        totalDebt={totalDebt}
        monthlyPayment={monthlyPayment}
        onAttributeToCredits={onAttributeToCredits}
      />

    </div>
  );
};
