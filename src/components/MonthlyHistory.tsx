import { useState } from "react";
import { ChevronDown, ChevronUp, TrendingDown, TrendingUp } from "lucide-react";
import { Credit } from "@/types/finance";

interface MonthlyHistoryProps {
  monthlyHistory: Record<string, any>;
  currentMonth: string;
  allMonths: string[];
  getMonthComparison: (month1: string, month2: string) => any;
  calculateDebtFreeProjection: (credits: Credit[], monthlyPayment: number) => any;
  credits: Credit[];
}

export function MonthlyHistory({
  monthlyHistory,
  currentMonth,
  allMonths,
  getMonthComparison,
  calculateDebtFreeProjection,
  credits,
}: MonthlyHistoryProps) {
  const [expanded, setExpanded] = useState(false);

  const formatMonth = (month: string) => {
    const [year, m] = month.split("-");
    const date = new Date(parseInt(year), parseInt(m) - 1);
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);

  if (allMonths.length === 0) {
    return null;
  }

  return (
    <div className="card-finance mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-sm font-medium"
        data-testid="button-monthly-history-toggle"
      >
        <span>Historique mensuel ({allMonths.length} mois)</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {allMonths.map((month) => {
            const snap = monthlyHistory[month];
            if (!snap) return null;

            return (
              <div
                key={month}
                className="bg-muted rounded-lg p-3 text-sm"
                data-testid={`card-month-${month}`}
              >
                <p className="font-medium mb-1">{formatMonth(month)}</p>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>Dettes restantes:</span>
                  <span className="text-right font-medium text-foreground">
                    {formatCurrency(snap.totals?.totalCredits || 0)}
                  </span>
                  <span>Charges prévues:</span>
                  <span className="text-right">
                    {formatCurrency(snap.totals?.totalExpenses || 0)}
                  </span>
                  <span>Charges réelles:</span>
                  <span className="text-right">
                    {formatCurrency(snap.totals?.totalActualExpenses || 0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
