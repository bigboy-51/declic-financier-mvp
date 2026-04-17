import { VariableExpenseCard } from "./VariableExpenseCard";
import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Receipt, Lock, Unlock, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { Expense, GroceryExpense, ExpenseCategory } from "@/types/finance";
import { GroceryExpenseTracker } from "./GroceryExpenseTracker";
import { cn } from "@/lib/utils";

const CATEGORY_CONFIG: Record<
  ExpenseCategory | "toutes",
  { emoji: string; label: string; color: string; bgColor: string; borderColor: string }
> = {
  toutes:         { emoji: "📋", label: "Toutes",         color: "text-foreground",       bgColor: "bg-muted",                  borderColor: "border-border" },
  logement:       { emoji: "🏠", label: "Logement",       color: "text-green-700 dark:text-green-400",   bgColor: "bg-green-50 dark:bg-green-950/30",  borderColor: "border-green-300 dark:border-green-700" },
  transport:      { emoji: "🚗", label: "Transport",      color: "text-blue-700 dark:text-blue-400",     bgColor: "bg-blue-50 dark:bg-blue-950/30",    borderColor: "border-blue-300 dark:border-blue-700" },
  sante:          { emoji: "👨‍⚕️", label: "Santé",         color: "text-red-700 dark:text-red-400",      bgColor: "bg-red-50 dark:bg-red-950/30",      borderColor: "border-red-300 dark:border-red-700" },
  finances:       { emoji: "💰", label: "Finances",       color: "text-amber-700 dark:text-amber-400",   bgColor: "bg-amber-50 dark:bg-amber-950/30",  borderColor: "border-amber-300 dark:border-amber-700" },
  loisirs:        { emoji: "🎉", label: "Loisirs",        color: "text-purple-700 dark:text-purple-400", bgColor: "bg-purple-50 dark:bg-purple-950/30", borderColor: "border-purple-300 dark:border-purple-700" },
  remboursements: { emoji: "🔄", label: "Rembours.",      color: "text-teal-700 dark:text-teal-400",     bgColor: "bg-teal-50 dark:bg-teal-950/30",    borderColor: "border-teal-300 dark:border-teal-700" },
  divers:         { emoji: "🛒", label: "Divers",         color: "text-gray-600 dark:text-gray-400",     bgColor: "bg-gray-50 dark:bg-gray-900/30",    borderColor: "border-gray-300 dark:border-gray-600" },
};

const CATEGORY_ORDER: ExpenseCategory[] = [
  "logement", "transport", "sante", "finances", "loisirs", "remboursements", "divers",
];

const FILTER_TABS: Array<ExpenseCategory | "toutes"> = [
  "toutes", ...CATEGORY_ORDER,
];

const fmt = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);

interface ExpensesProps {
  expenses: Expense[];
  totalExpenses: number;
  groceryBudget: number;
  groceryExpenses: GroceryExpense[];
  expensesLocked: boolean;
  onUpdateExpense: (id: string, updates: Partial<Expense>) => void;
  onDeleteExpense: (id: string) => void;
  onAddExpense: (expense: Omit<Expense, "id">) => void;
  onUpdateGroceryBudget: (amount: number) => void;
  onAddGroceryExpense: (expense: Omit<GroceryExpense, "id">) => void;
  onUpdateGroceryExpense: (id: string, updates: Partial<GroceryExpense>) => void;
  onDeleteGroceryExpense: (id: string) => void;
  onToggleExpensesLock: () => void;
  variableSpends: {
    [key: string]: { entries: { id: string; dateISO: string; amount: number }[] };
  };
  onAddVariableSpend: (label: string, dateISO: string, amount: number) => void;
  onDeleteVariableSpend: (label: string, id: string) => void;
}

export function Expenses({
  expenses,
  totalExpenses,
  groceryBudget,
  groceryExpenses,
  expensesLocked,
  onUpdateExpense,
  onDeleteExpense,
  onAddExpense,
  onUpdateGroceryBudget,
  onAddGroceryExpense,
  onUpdateGroceryExpense,
  onDeleteGroceryExpense,
  onToggleExpensesLock,
  variableSpends,
  onAddVariableSpend,
  onDeleteVariableSpend,
}: ExpensesProps) {
  const [activeFilter, setActiveFilter] = useState<ExpenseCategory | "toutes">("toutes");
  const [isAdding, setIsAdding] = useState(false);
  const [newExpense, setNewExpense] = useState<{
    name: string;
    amount: number;
    actualAmount: number;
    category: ExpenseCategory;
  }>({ name: "", amount: 0, actualAmount: 0, category: "divers" });
  const [editingGrocery, setEditingGrocery] = useState(false);
  const [groceryValue, setGroceryValue] = useState(groceryBudget);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showGrocery, setShowGrocery] = useState(false);
  const [groceryAlertDismissed, setGroceryAlertDismissed] = useState(false);

  const totalGrocerySpent = useMemo(
    () => groceryExpenses.reduce((sum, e) => sum + e.amount, 0),
    [groceryExpenses],
  );
  const groceryOverAlert = totalGrocerySpent >= 550;

  useEffect(() => {
    if (!groceryOverAlert) setGroceryAlertDismissed(false);
  }, [groceryOverAlert]);

  const allExpenses = expenses ?? [];

  const regularExpenses = allExpenses.filter((e) => e.category !== "remboursements");
  const reimbExpenses = allExpenses.filter((e) => e.category === "remboursements");

  const grossPrevu = regularExpenses.reduce((s, e) => s + e.amount, 0);
  const reimbPrevu = reimbExpenses.reduce((s, e) => s + e.amount, 0);
  const netPrevu = grossPrevu - reimbPrevu;

  const grossActual = regularExpenses.reduce((s, e) => s + e.actualAmount, 0);
  const reimbActual = reimbExpenses.reduce((s, e) => s + e.actualAmount, 0);
  const netActual = grossActual - reimbActual;
  const netDiff = netPrevu - netActual;

  const expensesByCategory = useMemo(() => {
    const map: Partial<Record<ExpenseCategory, Expense[]>> = {};
    for (const cat of CATEGORY_ORDER) {
      const catExpenses = allExpenses
        .filter((e) => (e.category ?? "divers") === cat)
        .sort((a, b) => a.name.localeCompare(b.name, "fr"));
      if (catExpenses.length > 0) map[cat] = catExpenses;
    }
    return map;
  }, [allExpenses]);

  const categoryTotal = (cat: ExpenseCategory) => {
    const catExpenses = allExpenses.filter((e) => (e.category ?? "divers") === cat);
    return catExpenses.reduce((s, e) => s + e.actualAmount, 0);
  };

  const filteredExpenses =
    activeFilter === "toutes"
      ? null
      : (allExpenses
          .filter((e) => (e.category ?? "divers") === activeFilter)
          .sort((a, b) => a.name.localeCompare(b.name, "fr")));

  const handleAdd = () => {
    if (newExpense.name.trim() && newExpense.amount > 0) {
      onAddExpense({ ...newExpense, custom: true });
      setNewExpense({ name: "", amount: 0, actualAmount: 0, category: "divers" });
      setIsAdding(false);
    }
  };

  const handleDelete = (id: string) => {
    if (deleteConfirmId === id) {
      onDeleteExpense(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
    }
  };

  const handleGrocerySave = () => {
    onUpdateGroceryBudget(groceryValue);
    setEditingGrocery(false);
  };

  const VARIABLE_NAMES = new Set([
    "Essence", "Cadeau", "Pharmacie fixe",
    "Travaux", "Entretien voiture", "Loisirs famille",
  ]);

  const isVariable = (expense: Expense) => VARIABLE_NAMES.has(expense.name);

  const getVariableLabel = (name: string) => {
    if (name === "Pharmacie fixe") return "Pharmacie";
    if (name === "Entretien voiture") return "Entretien voiture";
    if (name === "Loisirs famille") return "Loisirs famille";
    return name;
  };

  const renderExpenseRow = (expense: Expense) => {
    if (isVariable(expense)) {
      const label = getVariableLabel(expense.name);
      const entries = variableSpends?.[label]?.entries ?? [];
      return (
        <VariableExpenseCard
          key={expense.id}
          label={label}
          budgetPrevu={expense.amount}
          entries={entries}
          onAdd={(dateISO, amount) => onAddVariableSpend(label, dateISO, amount)}
          onDelete={(id) => onDeleteVariableSpend(label, id)}
        />
      );
    }

    const isReimb = expense.category === "remboursements";

    return (
      <ExpenseRow
        key={expense.id}
        expense={expense}
        locked={expensesLocked}
        isReimbursement={isReimb}
        deleteConfirmId={deleteConfirmId}
        onUpdate={onUpdateExpense}
        onDelete={handleDelete}
        onCategoryChange={(id, cat) => onUpdateExpense(id, { category: cat })}
      />
    );
  };

  return (
    <div className="space-y-4 pb-6">

      {/* ─── Grocery Alert Popup ─────────────────────────────── */}
      {groceryOverAlert && !groceryAlertDismissed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setGroceryAlertDismissed(true)}>
          <div
            className="bg-card border-2 border-destructive rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-5xl animate-bounce">🚨</div>
            <h3 className="text-xl font-black text-destructive">Budget dépassé !</h3>
            <p className="text-base font-semibold text-foreground">
              ⚠️ Budget courses dépasse 550€ !
            </p>
            <p className="text-sm text-muted-foreground">
              Dépensé : <strong className="text-destructive">{fmt(totalGrocerySpent)}</strong> sur {fmt(groceryBudget)} prévus
            </p>
            <button
              onClick={() => setGroceryAlertDismissed(true)}
              className="w-full min-h-[48px] bg-destructive text-destructive-foreground rounded-xl font-bold text-base"
              data-testid="button-dismiss-grocery-alert"
            >
              Compris, fermer
            </button>
          </div>
        </div>
      )}

      {/* ─── Grocery Alert Banner (always visible when over threshold) ─── */}
      {groceryOverAlert && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border-2 border-destructive animate-pulse">
          <span className="text-2xl">🚨</span>
          <div className="flex-1">
            <p className="font-bold text-destructive text-sm">Budget courses dépassé 550€ !</p>
            <p className="text-xs text-destructive/80">
              {fmt(totalGrocerySpent)} dépensés · Budget: {fmt(groceryBudget)}
            </p>
          </div>
          <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0" />
        </div>
      )}

      {/* Header totals */}
      <div className="card-finance bg-gradient-to-r from-muted to-accent">
        <div className="flex items-center gap-3">
          <Receipt className="w-6 h-6 text-muted-foreground flex-shrink-0" />
          <div className="flex-1">
            <p className="stat-label">Total charges nettes</p>
            <div className="flex items-baseline gap-4 flex-wrap">
              <div>
                <span className="text-xs text-muted-foreground">Prévu</span>
                <p className="stat-value">{fmt(netPrevu)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Réel</span>
                <p className="stat-value text-lg">{fmt(netActual)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Économie</span>
                <p className={cn("text-lg font-bold", netDiff > 0 ? "text-[hsl(var(--success))]" : netDiff < 0 ? "text-destructive" : "text-foreground")}>
                  {netDiff >= 0 ? "+" : ""}{fmt(netDiff)}
                </p>
              </div>
            </div>
            {reimbActual > 0 && (
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span>Brut: {fmt(grossActual)}</span>
                <span className="text-teal-600 dark:text-teal-400 font-medium">🔄 Rembours. reçus: −{fmt(reimbActual)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lock Toggle */}
      <div className="card-finance py-3">
        <button
          onClick={onToggleExpensesLock}
          className={cn(
            "flex items-center gap-2 w-full min-h-[44px] text-sm md:text-base font-medium transition-colors",
            expensesLocked ? "text-primary" : "text-muted-foreground",
          )}
          data-testid="button-toggle-expenses-lock"
        >
          {expensesLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
          {expensesLocked ? "🔒 Montants Prévu verrouillés" : "🔓 Verrouiller les montants Prévu"}
        </button>
      </div>

      {/* Grocery Budget (collapsible) */}
      <div className={cn("card-finance border-l-4", groceryOverAlert ? "border-destructive bg-destructive/5" : "border-primary")}>
        <button
          className="flex items-center justify-between w-full min-h-[44px]"
          onClick={() => setShowGrocery(!showGrocery)}
          data-testid="button-toggle-grocery"
        >
          <div>
            <p className="text-sm md:text-base text-muted-foreground text-left">Budget courses (alimentaire)</p>
            <p className="text-lg font-semibold">{fmt(groceryBudget)}</p>
          </div>
          {showGrocery ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </button>
        {showGrocery && (
          <div className="mt-3 space-y-3">
            {editingGrocery ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={groceryValue}
                  onChange={(e) => setGroceryValue(Number(e.target.value))}
                  className="w-28 min-h-[44px] px-3 py-2 rounded bg-muted text-lg font-semibold"
                  data-testid="input-grocery-budget"
                />
                <button
                  onClick={handleGrocerySave}
                  className="text-primary text-sm font-medium min-w-[44px] min-h-[44px] flex items-center justify-center"
                  data-testid="button-save-grocery"
                >
                  OK
                </button>
                <button
                  onClick={() => setEditingGrocery(false)}
                  className="text-muted-foreground text-sm min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <button
                className="text-sm text-primary min-h-[44px]"
                onClick={() => setEditingGrocery(true)}
              >
                Modifier le budget
              </button>
            )}
            <GroceryExpenseTracker
              groceryBudget={groceryBudget}
              groceryExpenses={groceryExpenses}
              onAddGroceryExpense={onAddGroceryExpense}
              onUpdateGroceryExpense={onUpdateGroceryExpense}
              onDeleteGroceryExpense={onDeleteGroceryExpense}
            />
          </div>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="overflow-x-auto -mx-3 px-3">
        <div className="flex gap-2 pb-1 min-w-max">
          {FILTER_TABS.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const total = cat === "toutes" ? netActual : categoryTotal(cat as ExpenseCategory);
            const isActive = activeFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                data-testid={`tab-category-${cat}`}
                className={cn(
                  "flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap min-h-[36px] border transition-colors",
                  isActive
                    ? `${cfg.bgColor} ${cfg.color} ${cfg.borderColor} shadow-sm`
                    : "bg-card text-muted-foreground border-border hover:bg-muted",
                )}
              >
                <span>{cfg.emoji}</span>
                <span>{cfg.label}</span>
                {total > 0 && (
                  <span className={cn("ml-1 text-xs font-bold", isActive ? cfg.color : "text-muted-foreground")}>
                    {fmt(total)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Expenses List */}
      {activeFilter === "toutes" ? (
        <div className="space-y-4">
          {CATEGORY_ORDER.map((cat) => {
            const catExpenses = expensesByCategory[cat];
            if (!catExpenses || catExpenses.length === 0) return null;
            const cfg = CATEGORY_CONFIG[cat];
            const catActual = catExpenses.reduce((s, e) => s + e.actualAmount, 0);
            const catPrevu = catExpenses.reduce((s, e) => s + e.amount, 0);
            const isRimb = cat === "remboursements";
            return (
              <div key={cat}>
                {/* Category Header */}
                <div className={cn("flex items-center justify-between px-3 py-2 rounded-lg mb-1 border", cfg.bgColor, cfg.borderColor)}>
                  <span className={cn("text-sm font-semibold", cfg.color)}>
                    {cfg.emoji} {cfg.label}
                  </span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">Prévu: {fmt(catPrevu)}</span>
                    <span className={cn("font-bold", isRimb ? "text-teal-600 dark:text-teal-400" : cfg.color)}>
                      {isRimb ? "+" : ""}{fmt(catActual)}
                    </span>
                  </div>
                </div>
                {/* Column headers */}
                <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-4 text-xs text-muted-foreground font-medium mb-1">
                  <span>Charge</span>
                  <span className="w-20 text-right">Prévu</span>
                  <span className="w-20 text-right">Réel</span>
                  <span className="w-20 text-right">Diff.</span>
                  <span className="w-8"></span>
                </div>
                <div className="space-y-1">
                  {catExpenses.map(renderExpenseRow)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1">
          {/* Column headers */}
          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-4 text-xs text-muted-foreground font-medium mb-1">
            <span>Charge</span>
            <span className="w-20 text-right">Prévu</span>
            <span className="w-20 text-right">Réel</span>
            <span className="w-20 text-right">Diff.</span>
            <span className="w-8"></span>
          </div>
          <div className="md:hidden grid grid-cols-[1fr_auto_auto] gap-1 px-3 text-xs text-muted-foreground font-medium mb-1">
            <span>Charge</span>
            <span className="w-16 text-right">Prévu</span>
            <span className="w-16 text-right">Réel</span>
          </div>
          {(filteredExpenses ?? []).map(renderExpenseRow)}
          {(filteredExpenses ?? []).length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-6">
              Aucune charge dans cette catégorie
            </p>
          )}
        </div>
      )}

      {/* Add New Expense */}
      {isAdding ? (
        <div className="card-finance space-y-3">
          <p className="font-semibold text-sm">Nouvelle charge</p>
          <input
            type="text"
            placeholder="Nom de la charge"
            value={newExpense.name}
            onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
            className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-muted border-0 focus:ring-2 focus:ring-primary outline-none text-base"
            data-testid="input-new-expense-name"
          />
          {/* Category selector */}
          <div>
            <label className="text-xs md:text-sm text-muted-foreground block mb-1">Catégorie</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ORDER.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewExpense({ ...newExpense, category: cat })}
                    className={cn(
                      "flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border min-h-[36px] transition-colors",
                      newExpense.category === cat
                        ? `${cfg.bgColor} ${cfg.color} ${cfg.borderColor}`
                        : "bg-card text-muted-foreground border-border hover:bg-muted",
                    )}
                  >
                    {cfg.emoji} {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs md:text-sm text-muted-foreground">Prévu (€)</label>
              <input
                type="number"
                value={newExpense.amount || ""}
                onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-muted border-0 focus:ring-2 focus:ring-primary outline-none text-base"
                data-testid="input-new-expense-amount"
              />
            </div>
            <div>
              <label className="text-xs md:text-sm text-muted-foreground">Réel (€)</label>
              <input
                type="number"
                value={newExpense.actualAmount || ""}
                onChange={(e) => setNewExpense({ ...newExpense, actualAmount: Number(e.target.value) })}
                className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-muted border-0 focus:ring-2 focus:ring-primary outline-none text-base"
                data-testid="input-new-expense-actual"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 min-h-[48px] bg-primary text-primary-foreground py-3 rounded-lg font-medium text-base"
              data-testid="button-add-expense-confirm"
            >
              Ajouter
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewExpense({ name: "", amount: 0, actualAmount: 0, category: "divers" }); }}
              className="flex-1 min-h-[48px] bg-muted py-3 rounded-lg font-medium text-base"
              data-testid="button-add-expense-cancel"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="btn-add w-full justify-center"
          data-testid="button-add-expense"
        >
          <Plus className="w-5 h-5" />
          Ajouter une charge
        </button>
      )}
    </div>
  );
}

interface ExpenseRowProps {
  expense: Expense;
  locked: boolean;
  isReimbursement: boolean;
  deleteConfirmId: string | null;
  onUpdate: (id: string, updates: Partial<Expense>) => void;
  onDelete: (id: string) => void;
  onCategoryChange: (id: string, cat: ExpenseCategory) => void;
}

function ExpenseRow({
  expense,
  locked,
  isReimbursement,
  deleteConfirmId,
  onUpdate,
  onDelete,
  onCategoryChange,
}: ExpenseRowProps) {
  const [editingField, setEditingField] = useState<"amount" | "actualAmount" | null>(null);
  const [editValue, setEditValue] = useState(0);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const actualAmount = expense.actualAmount ?? 0;
  const difference = isReimbursement ? actualAmount - expense.amount : expense.amount - actualAmount;
  const cfg = CATEGORY_CONFIG[(expense.category ?? "divers") as ExpenseCategory];

  const startEdit = (field: "amount" | "actualAmount") => {
    if (field === "amount" && locked) return;
    setEditingField(field);
    setEditValue(field === "amount" ? expense.amount : actualAmount);
  };

  const handleSave = () => {
    if (editingField) {
      onUpdate(expense.id, { [editingField]: editValue });
      setEditingField(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") setEditingField(null);
  };

  const isConfirmDelete = deleteConfirmId === expense.id;

  const renderAmountCell = (field: "amount" | "actualAmount", extraClass = "") => {
    const value = field === "amount" ? expense.amount : actualAmount;
    const isEditing = editingField === field;
    const canEdit = !(field === "amount" && locked);
    return isEditing ? (
      <input
        type="number"
        value={editValue}
        onChange={(e) => setEditValue(Number(e.target.value))}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        className={cn("w-full min-h-[44px] px-2 py-1.5 rounded bg-muted text-right text-sm", extraClass)}
      />
    ) : (
      <span
        className={cn(
          "text-sm",
          field === "actualAmount"
            ? isReimbursement
              ? "text-teal-600 dark:text-teal-400 cursor-pointer hover:text-teal-700"
              : "text-foreground cursor-pointer hover:text-primary"
            : canEdit
              ? "text-muted-foreground cursor-pointer hover:text-foreground"
              : "text-muted-foreground",
          extraClass,
        )}
        onClick={() => canEdit && startEdit(field)}
      >
        {isReimbursement && field === "actualAmount" && actualAmount > 0 ? "+" : ""}{fmt(value)}
      </span>
    );
  };

  return (
    <>
      {showCategoryPicker && (
        <div className="card-finance p-3 space-y-2 border-2 border-primary">
          <p className="text-xs font-semibold text-muted-foreground">Changer la catégorie :</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ORDER.map((cat) => {
              const c = CATEGORY_CONFIG[cat];
              return (
                <button
                  key={cat}
                  onClick={() => { onCategoryChange(expense.id, cat); setShowCategoryPicker(false); }}
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium border min-h-[32px] transition-colors",
                    (expense.category ?? "divers") === cat
                      ? `${c.bgColor} ${c.color} ${c.borderColor}`
                      : "bg-card text-muted-foreground border-border hover:bg-muted",
                  )}
                >
                  {c.emoji} {c.label}
                </button>
              );
            })}
          </div>
          <button onClick={() => setShowCategoryPicker(false)} className="text-xs text-muted-foreground min-h-[32px]">
            Fermer
          </button>
        </div>
      )}

      {/* Desktop layout */}
      <div
        className={cn(
          "hidden md:grid card-finance py-2.5 px-4 grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center",
          isReimbursement && "border-l-2 border-teal-400 dark:border-teal-600",
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setShowCategoryPicker(!showCategoryPicker)}
            className="text-base flex-shrink-0 hover:scale-110 transition-transform"
            title="Changer la catégorie"
          >
            {cfg.emoji}
          </button>
          <span className="font-medium text-sm truncate">{expense.name}</span>
          {isReimbursement && <span className="text-xs text-teal-600 dark:text-teal-400 flex-shrink-0">↩ remb.</span>}
        </div>
        <div className="w-20 text-right">{renderAmountCell("amount")}</div>
        <div className="w-20 text-right">{renderAmountCell("actualAmount")}</div>
        <div className="w-20 text-right">
          <span className={cn("text-sm font-medium", difference > 0 ? "text-[hsl(var(--success))]" : difference < 0 ? "text-destructive" : "text-muted-foreground")}>
            {difference >= 0 ? "+" : ""}{fmt(difference)}
          </span>
        </div>
        {isConfirmDelete ? (
          <button
            onClick={() => onDelete(expense.id)}
            className="text-xs text-destructive font-semibold min-w-[48px] min-h-[36px] px-1 rounded border border-destructive"
            data-testid={`button-confirm-delete-${expense.id}`}
          >
            Oui?
          </button>
        ) : (
          <button onClick={() => onDelete(expense.id)} className="btn-delete" data-testid={`button-delete-${expense.id}`}>
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mobile layout */}
      <div
        className={cn(
          "md:hidden card-finance py-3 px-3",
          isReimbursement && "border-l-2 border-teal-400 dark:border-teal-600",
        )}
      >
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-1 items-center">
          <div className="flex items-center gap-1 min-w-0">
            <button onClick={() => setShowCategoryPicker(!showCategoryPicker)} className="text-sm flex-shrink-0">
              {cfg.emoji}
            </button>
            <span className="font-medium text-sm truncate">{expense.name}</span>
          </div>
          <div className="w-16 text-right text-xs">
            {renderAmountCell("amount", "text-xs")}
          </div>
          <div className="w-16 text-right">
            {renderAmountCell("actualAmount", "text-xs")}
          </div>
          {isConfirmDelete ? (
            <button
              onClick={() => onDelete(expense.id)}
              className="text-xs text-destructive font-semibold min-w-[40px] min-h-[36px] px-1 rounded border border-destructive"
            >
              Oui?
            </button>
          ) : (
            <button onClick={() => onDelete(expense.id)} className="btn-delete min-w-[36px]">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
