import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Edit2, AlertTriangle, ShoppingBasket, Check, X, Banknote, ShoppingCart, MoreHorizontal, ChevronDown, ChevronRight } from 'lucide-react';
import { format, parseISO, isAfter, startOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { GroceryExpense } from '@/types/finance';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GroceryExpenseTrackerProps {
  groceryBudget: number;
  groceryExpenses: GroceryExpense[];
  onAddGroceryExpense: (expense: Omit<GroceryExpense, 'id'>) => void;
  onUpdateGroceryExpense: (id: string, updates: Partial<GroceryExpense>) => void;
  onDeleteGroceryExpense: (id: string) => void;
}

type SortType = 'recent' | 'ancient';
type ExpenseType = GroceryExpense['type'];
type PaymentMethod = GroceryExpense['paymentMethod'];

const TYPE_LABELS: Record<ExpenseType, string> = {
  course: 'Course',
  retrait: 'Retrait',
  autres: 'Autres',
};

const TYPE_COLORS: Record<ExpenseType, { bg: string; text: string; border: string; icon: string }> = {
  course: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', icon: 'text-emerald-500' },
  retrait: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', icon: 'text-blue-500' },
  autres: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', icon: 'text-amber-500' },
};

const TYPE_ICONS: Record<ExpenseType, typeof ShoppingCart> = {
  course: ShoppingCart,
  retrait: Banknote,
  autres: MoreHorizontal,
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cb: 'CB',
  especes: 'Espèces',
  virement: 'Virement',
  autre: 'Autre',
};

const WEEK_START_OPTS = { weekStartsOn: 1 as const };
const MONTH_LABELS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

interface WeekGroup {
  weekKey: string;
  weekStart: Date;
  weekEnd: Date;
  expenses: GroceryExpense[];
  weekNumber: number;
}

export function GroceryExpenseTracker({
  groceryBudget,
  groceryExpenses,
  onAddGroceryExpense,
  onUpdateGroceryExpense,
  onDeleteGroceryExpense,
}: GroceryExpenseTrackerProps) {
  const [sort, setSort] = useState<SortType>(() => {
    try {
      const saved = localStorage.getItem('grocery-sort-preference');
      return (saved === 'ancient' ? 'ancient' : 'recent') as SortType;
    } catch {
      return 'recent';
    }
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showShake, setShowShake] = useState(false);
  const [wasOverBudget, setWasOverBudget] = useState(false);
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>('');
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('grocery-sort-preference', sort);
  }, [sort]);

  const [newExpense, setNewExpense] = useState<Omit<GroceryExpense, 'id'>>({
    date: new Date().toISOString(),
    type: 'course',
    amount: 0,
    paymentMethod: 'cb',
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const safeExpenses = groceryExpenses ?? [];
  const totalSpent = safeExpenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const remaining = (groceryBudget ?? 0) - totalSpent;
  const isOverBudget = remaining < 0;

  const categoryTotals: Record<ExpenseType, number> = {
    course: safeExpenses.filter(e => e.type === 'course').reduce((sum, e) => sum + (e.amount ?? 0), 0),
    retrait: safeExpenses.filter(e => e.type === 'retrait').reduce((sum, e) => sum + (e.amount ?? 0), 0),
    autres: safeExpenses.filter(e => e.type === 'autres').reduce((sum, e) => sum + (e.amount ?? 0), 0),
  };

  const weekGroups = useMemo((): WeekGroup[] => {
    if (safeExpenses.length === 0) return [];

    const sortedDesc = [...safeExpenses].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    const payday = parseISO(sortedDesc[sortedDesc.length - 1]?.date ?? new Date().toISOString());
    const groups = new Map<string, GroceryExpense[]>();

    for (const expense of sortedDesc) {
      const d = parseISO(expense.date);
      const day = startOfDay(d);
      const pay = startOfDay(payday);
      const firstSundayOffset = (7 - pay.getDay()) % 7;
      const firstSunday = new Date(pay.getFullYear(), pay.getMonth(), pay.getDate() + firstSundayOffset);
      let weekStart: Date;

      if (day <= startOfDay(firstSunday)) {
        weekStart = pay;
      } else {
        weekStart = startOfWeek(d, WEEK_START_OPTS);
      }

      const weekKey = format(weekStart, 'yyyy-MM-dd');
      if (!groups.has(weekKey)) groups.set(weekKey, []);
      groups.get(weekKey)!.push(expense);
    }

    const ordered = Array.from(groups.entries()).sort((a, b) => parseISO(b[0]).getTime() - parseISO(a[0]).getTime());
    return ordered.map(([weekKey, expenses], idx) => {
      const weekStart = parseISO(weekKey);
      const weekEnd = idx === 0
        ? new Date(Math.min(
            endOfWeek(weekStart, WEEK_START_OPTS).getTime(),
            (() => {
              const offset = (7 - weekStart.getDay()) % 7;
              return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + offset).getTime();
            })(),
          ))
        : endOfWeek(weekStart, WEEK_START_OPTS);
      return {
        weekKey,
        weekStart,
        weekEnd,
        expenses,
        weekNumber: ordered.length - idx,
      };
    });
  }, [safeExpenses]);

  useEffect(() => {
    if (!selectedWeekKey && weekGroups.length > 0) {
      setSelectedWeekKey(weekGroups[0].weekKey);
    } else if (selectedWeekKey && !weekGroups.find(w => w.weekKey === selectedWeekKey) && weekGroups.length > 0) {
      setSelectedWeekKey(weekGroups[0].weekKey);
    }
  }, [weekGroups, selectedWeekKey]);

  useEffect(() => {
    if (weekGroups.length > 0) setExpandedWeek(weekGroups[0].weekKey);
  }, [weekGroups]);

  useEffect(() => {
    if (isOverBudget && !wasOverBudget) {
      setShowShake(true);
      const timer = setTimeout(() => setShowShake(false), 500);
      return () => clearTimeout(timer);
    }
    setWasOverBudget(isOverBudget);
  }, [isOverBudget, wasOverBudget]);

  const selectedGroup = weekGroups.find(w => w.weekKey === selectedWeekKey) ?? weekGroups[0];

  const visibleExpenses = useMemo(() => {
    if (!selectedGroup) return [];
    return [...selectedGroup.expenses].sort((a, b) => {
      const da = parseISO(a.date).getTime();
      const db = parseISO(b.date).getTime();
      return sort === 'recent' ? db - da : da - db;
    });
  }, [selectedGroup, sort]);

  const weekTotals = useMemo(() => {
    if (!selectedGroup) return { prevu: 0, reel: 0 };
    const prevu = selectedGroup.expenses
      .filter(e => isAfter(startOfDay(parseISO(e.date)), startOfDay(new Date())))
      .reduce((sum, e) => sum + (e.amount ?? 0), 0);
    const reel = selectedGroup.expenses
      .filter(e => !isAfter(startOfDay(parseISO(e.date)), startOfDay(new Date())))
      .reduce((sum, e) => sum + (e.amount ?? 0), 0);
    return { prevu, reel };
  }, [selectedGroup]);

  const formatWeekLabel = (week: WeekGroup) => {
    const start = week.weekStart;
    const end = week.weekEnd;
    const startDay = start.getDate();
    const endDay = end.getDate();
    const month = MONTH_LABELS[end.getMonth()];
    return `Sem ${week.weekNumber} • ${startDay}-${endDay} ${month}`;
  };

  const handleAdd = () => {
    if (newExpense.amount > 0) {
      onAddGroceryExpense({
        ...newExpense,
        amount: Math.round(newExpense.amount * 100) / 100,
      });
      setNewExpense({
        date: new Date().toISOString(),
        type: 'course',
        amount: 0,
        paymentMethod: 'cb',
      });
      setIsAdding(false);
    }
  };

  const isExpanded = expandedWeek === selectedWeekKey;

  return (
    <div className="card-finance space-y-4 mt-4">
      <div className="flex items-center gap-2">
        <ShoppingBasket className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Suivi Dépenses Courses</h3>
      </div>

      <div className={cn('flex flex-wrap gap-3 text-sm p-3 rounded-lg bg-muted/50', showShake && 'animate-shake')}>
        <span>Budget: <strong>{formatCurrency(groceryBudget)}</strong></span>
        <span className="text-muted-foreground">|</span>
        <span>Dépensé: <strong>{formatCurrency(totalSpent)}</strong></span>
        <span className="text-muted-foreground">|</span>
        <span className={cn(isOverBudget && 'text-destructive font-semibold flex items-center gap-1')}>
          {isOverBudget && <AlertTriangle className="w-4 h-4" />}
          Restant: <strong>{formatCurrency(remaining)}</strong>
        </span>
      </div>

      {isOverBudget && (
        <p className="text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Chaque euro dépassé ralentit ton objectif Debt-Free.
        </p>
      )}

      <div className="grid grid-cols-3 gap-2" data-testid="category-breakdown">
        {(['course', 'retrait', 'autres'] as ExpenseType[]).map(type => {
          const Icon = TYPE_ICONS[type];
          const colors = TYPE_COLORS[type];
          return (
            <div key={type} className={cn('p-2.5 rounded-lg border', colors.bg, colors.border)} data-testid={`category-total-${type}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={cn('w-3.5 h-3.5', colors.icon)} />
                <span className={cn('text-xs font-medium', colors.text)}>{TYPE_LABELS[type]}</span>
              </div>
              <span className={cn('text-sm font-bold', colors.text)}>{formatCurrency(categoryTotals[type])}</span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none" data-testid="week-tabs">
        {weekGroups.map(week => {
          const isSelected = week.weekKey === selectedWeekKey;
          return (
            <button
              key={week.weekKey}
              onClick={() => {
                setSelectedWeekKey(week.weekKey);
                setExpandedWeek(week.weekKey);
              }}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] border',
                isSelected ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-muted/60 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              )}
              data-testid={`tab-week-${week.weekNumber}`}
            >
              <span className="block font-semibold">{formatWeekLabel(week)}</span>
            </button>
          );
        })}
      </div>

      {selectedGroup && (
        <div className="rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setExpandedWeek(isExpanded ? null : selectedWeekKey)}
            className="w-full flex items-center justify-between p-3 bg-muted/40 hover:bg-muted/60 transition-colors"
            data-testid={`week-group-header-${selectedGroup.weekNumber}`}
          >
            <div className="flex items-center gap-2">
              {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              <span className="font-semibold text-sm">Semaine {selectedGroup.weekNumber}</span>
              <span className="text-xs text-muted-foreground">
                · {format(selectedGroup.weekStart, 'd', { locale: fr })}-{format(selectedGroup.weekEnd, 'd MMMM', { locale: fr })}
              </span>
            </div>
            <div className="text-right text-xs">
              <span className="font-semibold text-foreground">{formatCurrency(weekTotals.prevu)}</span>
              <span className="text-muted-foreground mx-1">/</span>
              <span className="font-semibold text-foreground">{formatCurrency(weekTotals.reel)}</span>
              <span className="text-muted-foreground ml-1">(Prévu / Réel)</span>
            </div>
          </button>

          {isExpanded && (
            <div className="divide-y divide-border/50">
              {visibleExpenses.length > 0 && (
                <div className="flex items-center px-3 py-2 bg-muted/20 text-xs text-muted-foreground font-medium">
                  <span className="w-14">Date</span>
                  <span className="flex-1">Type</span>
                  <button
                    className="flex items-center gap-1 hover:text-foreground transition-colors mr-2"
                    onClick={() => setSort(s => s === 'recent' ? 'ancient' : 'recent')}
                    data-testid="sort-toggle"
                    title={sort === 'recent' ? 'Du plus récent' : 'Du plus ancien'}
                  >
                    Prévu
                    <span className="flex flex-col leading-[0.6] text-[10px]">
                      <span className={cn(sort === 'ancient' ? 'text-primary' : 'opacity-40')}>↑</span>
                      <span className={cn(sort === 'recent' ? 'text-primary' : 'opacity-40')}>↓</span>
                    </span>
                  </button>
                  <span className="w-16 text-right hidden sm:block">Mode</span>
                </div>
              )}

              {visibleExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Aucune dépense cette semaine</p>
              ) : (
                visibleExpenses.map(expense => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    isEditing={editingId === expense.id}
                    onStartEdit={() => setEditingId(expense.id)}
                    onCancelEdit={() => setEditingId(null)}
                    onSave={(updates) => {
                      onUpdateGroceryExpense(expense.id, updates);
                      setEditingId(null);
                    }}
                    onDelete={() => onDeleteGroceryExpense(expense.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {isAdding ? (
        <ExpenseForm
          expense={newExpense}
          onChange={setNewExpense}
          onSave={handleAdd}
          onCancel={() => setIsAdding(false)}
        />
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="btn-add w-full justify-center min-h-[44px]"
          data-testid="button-add-grocery-expense"
        >
          <Plus className="w-5 h-5" />
          Ajouter une dépense
        </button>
      )}
    </div>
  );
}

interface ExpenseRowProps {
  expense: GroceryExpense;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (updates: Partial<GroceryExpense>) => void;
  onDelete: () => void;
}

function ExpenseRow({ expense, isEditing, onStartEdit, onCancelEdit, onSave, onDelete }: ExpenseRowProps) {
  const [editValues, setEditValues] = useState(expense);

  useEffect(() => {
    setEditValues(expense);
  }, [expense, isEditing]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const today = startOfDay(new Date());
  const isPast = !isAfter(startOfDay(parseISO(expense.date)), today);
  const colors = TYPE_COLORS[expense.type];
  const Icon = TYPE_ICONS[expense.type];

  if (isEditing) {
    return (
      <div className="px-3 py-2">
        <ExpenseForm
          expense={editValues}
          onChange={(updates) => setEditValues({ ...editValues, ...updates })}
          onSave={() => onSave(editValues)}
          onCancel={onCancelEdit}
        />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center px-3 py-2.5 hover:bg-muted/30 transition-colors', !isPast && 'border-l-2', !isPast && colors.border)} data-testid={`grocery-expense-row-${expense.id}`}>
      <span className="w-14 text-sm font-medium text-muted-foreground">{format(parseISO(expense.date), 'dd/MM', { locale: fr })}</span>
      <div className="flex-1 flex items-center gap-1.5">
        <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', colors.icon)} />
        <span className={cn('text-xs font-medium', colors.text)}>
          {TYPE_LABELS[expense.type]}
          {expense.type === 'autres' && expense.customType && ` (${expense.customType})`}
        </span>
      </div>
      <span className="text-sm font-semibold mr-2 min-w-[64px] text-right">{formatCurrency(expense.amount)}</span>
      <span className="text-xs text-muted-foreground hidden sm:block w-16 text-right mr-2">{PAYMENT_LABELS[expense.paymentMethod]}</span>
      <div className="flex gap-0.5 flex-shrink-0">
        <button onClick={onStartEdit} className="p-1.5 hover:bg-muted rounded transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center" data-testid={`button-edit-grocery-${expense.id}`}>
          <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button onClick={onDelete} className="btn-delete min-h-[36px] min-w-[36px] flex items-center justify-center" data-testid={`button-delete-grocery-${expense.id}`}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

interface ExpenseFormProps {
  expense: Omit<GroceryExpense, 'id'>;
  onChange: (expense: Omit<GroceryExpense, 'id'>) => void;
  onSave: () => void;
  onCancel: () => void;
}

function ExpenseForm({ expense, onChange, onSave, onCancel }: ExpenseFormProps) {
  const [dateOpen, setDateOpen] = useState(false);

  return (
    <div className="p-3 rounded-lg bg-muted/50 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Date</label>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <button className="w-full px-3 py-2 text-left rounded-lg bg-background border border-border text-sm min-h-[44px]" data-testid="input-grocery-date">
                {format(parseISO(expense.date), 'dd/MM/yyyy', { locale: fr })}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
              <Calendar
                mode="single"
                selected={parseISO(expense.date)}
                onSelect={(date) => {
                  if (date) {
                    onChange({ ...expense, date: date.toISOString() });
                    setDateOpen(false);
                  }
                }}
                locale={fr}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Catégorie</label>
          <div className="flex gap-1">
            {(['course', 'retrait', 'autres'] as ExpenseType[]).map((t) => {
              const colors = TYPE_COLORS[t];
              return (
                <button
                  key={t}
                  onClick={() => onChange({ ...expense, type: t })}
                  className={cn('flex-1 px-2 py-2 text-xs font-medium rounded-lg border transition-all min-h-[44px]', expense.type === t ? cn(colors.bg, colors.text, colors.border, 'ring-1 ring-offset-1') : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted')}
                  data-testid={`button-category-${t}`}
                >
                  {TYPE_LABELS[t]}
                </button>
              );
            })}
          </div>
        </div>

        {expense.type === 'autres' && (
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Préciser</label>
            <input
              type="text"
              value={expense.customType || ''}
              onChange={(e) => onChange({ ...expense, customType: e.target.value })}
              placeholder="Précisez le type..."
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm min-h-[44px]"
              data-testid="input-grocery-custom-type"
            />
          </div>
        )}

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Montant (€)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={expense.amount || ''}
            onChange={(e) => onChange({ ...expense, amount: Math.max(0, Number(e.target.value)) })}
            onFocus={(e) => e.target.select()}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm min-h-[44px]"
            data-testid="input-grocery-amount"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Moyen</label>
          <Select value={expense.paymentMethod} onValueChange={(value: PaymentMethod) => onChange({ ...expense, paymentMethod: value })}>
            <SelectTrigger className="w-full bg-background min-h-[44px]" data-testid="select-grocery-payment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {Object.entries(PAYMENT_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onSave} className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg font-medium min-h-[44px]" data-testid="button-save-grocery">
          <Check className="w-4 h-4" />
          Enregistrer
        </button>
        <button onClick={onCancel} className="flex-1 flex items-center justify-center gap-2 bg-muted py-2 rounded-lg font-medium min-h-[44px]" data-testid="button-cancel-grocery">
          <X className="w-4 h-4" />
          Annuler
        </button>
      </div>
    </div>
  );
}
