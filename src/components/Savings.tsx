import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Pencil, Check, X } from "lucide-react";
import type { SavingsGoal, SavingsTimeline } from "@/types/finance";

interface SavingsProps {
  goals: SavingsGoal[];
  onAddGoal: (goal: Omit<SavingsGoal, "id">) => void;
  onUpdateGoal: (id: string, changes: Partial<Omit<SavingsGoal, "id">>) => void;
  onDeleteGoal: (id: string) => void;
}

const TIMELINE_SECTIONS: { key: SavingsTimeline; label: string; emoji: string; detail: string }[] = [
  { key: "court", label: "Court terme", emoji: "⚡", detail: "0 – 6 mois" },
  { key: "moyen", label: "Moyen terme", emoji: "📅", detail: "6 – 18 mois" },
  { key: "long", label: "Long terme", emoji: "🏔️", detail: "18 mois +" },
];

const SAVINGS_ICONS = ["💰", "🏖️", "🏠", "🚗", "📚", "💎", "🎓", "✈️", "🏋️", "🎁"];

function progressColor(pct: number): string {
  if (pct >= 76) return "bg-green-500";
  if (pct >= 26) return "bg-amber-400";
  return "bg-red-500";
}

function progressTextColor(pct: number): string {
  if (pct >= 76) return "text-green-600 dark:text-green-400";
  if (pct >= 26) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function GoalCard({
  goal,
  onUpdate,
  onDelete,
}: {
  goal: SavingsGoal;
  onUpdate: (changes: Partial<Omit<SavingsGoal, "id">>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(goal.name);
  const [editTarget, setEditTarget] = useState(String(goal.targetAmount));
  const [editCurrent, setEditCurrent] = useState(String(goal.currentAmount));
  const [editIcon, setEditIcon] = useState(goal.icon);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const pct = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
  const isComplete = pct >= 100;

  const handleSave = () => {
    const targetVal = parseFloat(editTarget.replace(",", ".")) || 0;
    const currentVal = parseFloat(editCurrent.replace(",", ".")) || 0;
    onUpdate({ name: editName.trim() || goal.name, targetAmount: targetVal, currentAmount: currentVal, icon: editIcon });
    setEditing(false);
  };

  return (
    <div
      data-testid={`card-savings-${goal.id}`}
      className={`rounded-2xl border bg-card overflow-hidden transition-all ${
        isComplete ? "border-green-500/40" : "border-border"
      }`}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left"
        data-testid={`button-toggle-goal-${goal.id}`}
      >
        <span className="text-2xl flex-shrink-0">{goal.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-foreground text-sm truncate">{goal.name}</p>
            {isComplete && (
              <span className="text-xs font-bold text-green-600 dark:text-green-400 flex-shrink-0">
                🎉 Atteint !
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressColor(pct)}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`text-xs font-bold flex-shrink-0 ${progressTextColor(pct)}`}>
              {pct.toFixed(0)}%
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
          {editing ? (
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                {SAVINGS_ICONS.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setEditIcon(ic)}
                    className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-colors ${
                      editIcon === ic ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-muted/70"
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full min-h-[44px] text-sm rounded-xl border border-border bg-background px-3 focus:outline-none focus:border-primary transition-colors"
                placeholder="Nom de l'objectif"
              />
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={editTarget}
                    onChange={(e) => setEditTarget(e.target.value)}
                    className="w-full min-h-[44px] text-sm rounded-xl border border-border bg-background px-3 pr-8 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Objectif"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={editCurrent}
                    onChange={(e) => setEditCurrent(e.target.value)}
                    className="w-full min-h-[44px] text-sm rounded-xl border border-border bg-background px-3 pr-8 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Épargné"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="flex-1 min-h-[40px] rounded-xl border border-border text-xs font-medium text-muted-foreground">
                  Annuler
                </button>
                <button onClick={handleSave} className="flex-1 min-h-[40px] rounded-xl bg-primary text-primary-foreground text-xs font-bold">
                  Enregistrer
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Épargné</p>
                  <p className="font-black text-foreground text-base">{fmt(goal.currentAmount)}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Objectif</p>
                  <p className="font-black text-foreground text-base">{fmt(goal.targetAmount)}</p>
                </div>
              </div>

              {!isComplete && goal.targetAmount > 0 && (
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">
                    Il reste <span className="font-bold text-foreground">{fmt(goal.targetAmount - goal.currentAmount)}</span> à épargner
                  </p>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressColor(pct)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}

              {isComplete && (
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
                  <p className="text-sm font-bold text-green-600 dark:text-green-400">🎉 Objectif atteint !</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Félicitations, continuez comme ça !</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(true)}
                  data-testid={`button-edit-goal-${goal.id}`}
                  className="flex-1 min-h-[40px] rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Modifier
                </button>
                {confirmDelete ? (
                  <div className="flex gap-1.5 flex-1">
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 min-h-[40px] rounded-xl border border-border text-xs font-medium text-muted-foreground"
                    >
                      Non
                    </button>
                    <button
                      onClick={onDelete}
                      data-testid={`button-delete-goal-${goal.id}`}
                      className="flex-1 min-h-[40px] rounded-xl bg-destructive text-destructive-foreground text-xs font-bold"
                    >
                      Supprimer
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="min-h-[40px] px-4 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AddGoalForm({
  onAdd,
  onCancel,
}: {
  onAdd: (goal: Omit<SavingsGoal, "id">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [timeline, setTimeline] = useState<SavingsTimeline>("court");
  const [icon, setIcon] = useState("💰");

  const handleAdd = () => {
    if (!name.trim()) return;
    const targetVal = parseFloat(target.replace(",", ".")) || 0;
    const currentVal = parseFloat(current.replace(",", ".")) || 0;
    onAdd({ name: name.trim(), targetAmount: targetVal, currentAmount: currentVal, timeline, icon });
  };

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-card p-4 space-y-3">
      <p className="text-sm font-bold text-foreground">Nouvel objectif d'épargne</p>

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
        data-testid="input-new-savings-name"
        className="w-full min-h-[48px] text-base rounded-xl border border-border bg-background px-4 focus:outline-none focus:border-primary transition-colors"
        autoFocus
      />

      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Objectif"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            data-testid="input-new-savings-target"
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
            data-testid="input-new-savings-current"
            className="w-full min-h-[48px] text-base rounded-xl border border-border bg-background px-4 pr-8 focus:outline-none focus:border-primary transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-1.5">Horizon de temps</p>
        <div className="grid grid-cols-3 gap-2">
          {TIMELINE_SECTIONS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTimeline(t.key)}
              data-testid={`button-new-timeline-${t.key}`}
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
          onClick={onCancel}
          className="flex-1 min-h-[48px] rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleAdd}
          disabled={!name.trim()}
          data-testid="button-save-savings-goal"
          className="flex-1 min-h-[48px] rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 transition-opacity"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}

export function Savings({ goals, onAddGoal, onUpdateGoal, onDeleteGoal }: SavingsProps) {
  const [showForm, setShowForm] = useState(false);

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const overallPct = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;

  const handleAdd = (goal: Omit<SavingsGoal, "id">) => {
    onAddGoal(goal);
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {goals.length > 0 && (
        <div className="card-finance">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            💾 Résumé épargne
          </p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Total épargné</p>
              <p className="text-lg font-black text-foreground">{fmt(totalSaved)}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Total objectifs</p>
              <p className="text-lg font-black text-foreground">{fmt(totalTarget)}</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progression globale</span>
              <span className={`font-bold ${progressTextColor(overallPct)}`}>{overallPct.toFixed(0)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressColor(overallPct)}`}
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <AddGoalForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          data-testid="button-new-savings-goal"
          className="w-full min-h-[52px] rounded-2xl border-2 border-dashed border-primary/40 text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouvel objectif d'épargne
        </button>
      )}

      {TIMELINE_SECTIONS.map((section) => {
        const sectionGoals = goals.filter((g) => g.timeline === section.key);
        if (sectionGoals.length === 0) return null;

        return (
          <div key={section.key} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <span className="text-lg">{section.emoji}</span>
              <div>
                <p className="text-sm font-black text-foreground">{section.label}</p>
                <p className="text-xs text-muted-foreground">{section.detail}</p>
              </div>
              <span className="ml-auto text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {sectionGoals.length}
              </span>
            </div>
            {sectionGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onUpdate={(changes) => onUpdateGoal(goal.id, changes)}
                onDelete={() => onDeleteGoal(goal.id)}
              />
            ))}
          </div>
        );
      })}

      {goals.length === 0 && !showForm && (
        <div className="text-center py-12 space-y-3">
          <p className="text-5xl">💾</p>
          <p className="text-lg font-black text-foreground">Commencez à épargner</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Définissez vos objectifs d'épargne et suivez votre progression vers la liberté financière.
          </p>
        </div>
      )}
    </div>
  );
}
