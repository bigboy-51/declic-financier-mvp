import { useChargesData } from "@/hooks/useChargesData";
import { useChargesSummary } from "@/hooks/useChargesSummary";
import { AlertTriangle, TrendingUp, ChevronRight } from "lucide-react";

function fmt(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

interface Props {
  onNavigateToCharges: () => void;
}

export function ChargesDashboardWidget({ onNavigateToCharges }: Props) {
  const { charges, loading } = useChargesData();

  const summaryInput = charges.map((c) => ({
    id: c.id,
    name: c.name,
    montantPrevu: c.prevu,
    montantReel: c.reel,
    montantRestant: c.restant,
    custom: !c.locked,
  }));

  const { totalPrevu, totalReel, totalRestant } = useChargesSummary(summaryInput);

  if (loading) return null;
  if (totalPrevu === 0) return null;

  const overBudget   = totalReel > totalPrevu;
  const percentUsed  = totalPrevu > 0 ? (totalReel / totalPrevu) * 100 : 0;

  return (
    <div
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
      data-testid="widget-charges-dashboard"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h4 className="font-bold text-foreground text-sm">📊 Charges du mois</h4>
        <button
          data-testid="button-charges-widget-detail"
          onClick={onNavigateToCharges}
          className="flex items-center gap-0.5 text-xs text-primary hover:underline font-semibold"
        >
          Voir détail <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* 3-column figures */}
      <div className="grid grid-cols-3 divide-x divide-border mx-4 mb-3 border border-border/50 rounded-xl overflow-hidden">
        <div className="px-3 py-2.5 text-center">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Prévu</p>
          <p className="text-sm font-black text-foreground tabular-nums" data-testid="widget-prevu">
            {fmt(totalPrevu)}
          </p>
        </div>
        <div className="px-3 py-2.5 text-center">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Réel</p>
          <p
            className={`text-sm font-black tabular-nums ${overBudget ? "text-red-600 dark:text-red-400" : "text-foreground"}`}
            data-testid="widget-reel"
          >
            {fmt(totalReel)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{percentUsed.toFixed(0)}%</p>
        </div>
        <div className="px-3 py-2.5 text-center">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Restant</p>
          <p
            className={`text-sm font-black tabular-nums ${totalRestant < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
            data-testid="widget-restant"
          >
            {fmt(totalRestant)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted mx-4 mb-3 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${overBudget ? "bg-red-500" : "bg-green-500"}`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>

      {/* Status strip */}
      {overBudget ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 border-t border-red-500/20">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs font-semibold">
            Budget dépassé de {fmt(Math.abs(totalRestant))}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/5 text-green-700 dark:text-green-400 border-t border-green-500/15">
          <TrendingUp className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs font-medium">
            {fmt(totalRestant)} encore disponibles
          </span>
        </div>
      )}
    </div>
  );
}
