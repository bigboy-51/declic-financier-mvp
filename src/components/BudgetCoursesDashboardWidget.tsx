import { useState, useEffect } from "react";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useBudgetCourses } from "@/hooks/useBudgetCourses";
import { AlertTriangle, ShoppingCart, ChevronRight } from "lucide-react";

function fmt(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

interface Props {
  onNavigateToCourses: () => void;
}

export function BudgetCoursesDashboardWidget({ onNavigateToCourses }: Props) {
  const { user } = useAuth();
  const { courses, loading, getTotalsByMonth } = useBudgetCourses();
  const [budgetPrevu, setBudgetPrevu] = useState(600);

  useEffect(() => {
    if (!user) return;
    get(ref(db, `users/${user.uid}/settings/budgetCourses`))
      .then((snap) => {
        const val = snap.val();
        if (val?.prevu && val.prevu > 0) setBudgetPrevu(val.prevu);
      })
      .catch(console.error);
  }, [user]);

  if (loading) return null;

  const now = new Date();
  const totalDuMois = getTotalsByMonth(now.getFullYear(), now.getMonth() + 1);
  const restant = budgetPrevu - totalDuMois;
  const percentUsed = budgetPrevu > 0 ? (totalDuMois / budgetPrevu) * 100 : 0;
  const depassement = totalDuMois > budgetPrevu;

  if (budgetPrevu === 0 && totalDuMois === 0) return null;

  return (
    <div
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
      data-testid="widget-budget-courses-dashboard"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-orange-500" />
          <h4 className="font-bold text-foreground text-sm">🛒 Budget Courses</h4>
        </div>
        <button
          data-testid="button-courses-widget-detail"
          onClick={onNavigateToCourses}
          className="flex items-center gap-0.5 text-xs text-primary hover:underline font-semibold"
        >
          Voir détail <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* 3-column figures */}
      <div className="grid grid-cols-3 divide-x divide-border mx-4 mb-3 border border-border/50 rounded-xl overflow-hidden">
        <div className="px-3 py-2.5 text-center">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Budget</p>
          <p className="text-sm font-black text-foreground tabular-nums" data-testid="widget-courses-prevu">
            {fmt(budgetPrevu)}
          </p>
        </div>
        <div className="px-3 py-2.5 text-center">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Dépensé</p>
          <p
            className={`text-sm font-black tabular-nums ${depassement ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"}`}
            data-testid="widget-courses-depense"
          >
            {fmt(totalDuMois)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{Math.min(percentUsed, 100).toFixed(0)}%</p>
        </div>
        <div className="px-3 py-2.5 text-center">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Restant</p>
          <p
            className={`text-sm font-black tabular-nums ${restant < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
            data-testid="widget-courses-restant"
          >
            {fmt(restant)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted mx-4 mb-3 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${depassement ? "bg-red-500" : "bg-orange-400"}`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>

      {/* Status strip */}
      {depassement ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 border-t border-red-500/20">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs font-semibold">
            Budget dépassé de {fmt(Math.abs(restant))}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/5 text-orange-700 dark:text-orange-400 border-t border-orange-500/15">
          <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs font-medium">
            {fmt(restant)} restants ce mois
          </span>
        </div>
      )}
    </div>
  );
}
