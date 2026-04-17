import { useState } from "react";
import { RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { Credit, Expense, GroceryExpense } from "@/types/finance";

interface MonthlyResetProps {
  currentMonth: string;
  credits: Credit[];
  expenses: Expense[];
  groceryExpenses: GroceryExpense[];
  onCloseMonth: () => void;
  onResetVariables: () => void;
  onCloneCharges: () => void;
}

export function MonthlyReset({
  currentMonth,
  credits,
  expenses,
  groceryExpenses,
  onCloseMonth,
  onResetVariables,
  onCloneCharges,
}: MonthlyResetProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const formatMonth = (month: string) => {
    const [year, m] = month.split("-");
    const date = new Date(parseInt(year), parseInt(m) - 1);
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };

  const handleCloseMonth = () => {
    onCloseMonth();
    onResetVariables();
    onCloneCharges();
    setConfirmClose(false);
    setExpanded(false);
  };

  return (
    <div className="card-finance mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-sm font-medium"
        data-testid="button-monthly-reset-toggle"
      >
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-primary" />
          <span>Clôture mensuelle - {formatMonth(currentMonth)}</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">
            Clôturer le mois va sauvegarder l'état actuel, remettre les montants
            réels à zéro, et passer au mois suivant.
          </p>

          {!confirmClose ? (
            <button
              onClick={() => setConfirmClose(true)}
              className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium"
              data-testid="button-close-month"
            >
              Clôturer {formatMonth(currentMonth)}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-destructive font-medium">
                Confirmer la clôture ?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCloseMonth}
                  className="flex-1 bg-destructive text-destructive-foreground py-2 rounded-lg text-sm font-medium"
                  data-testid="button-confirm-close-month"
                >
                  Confirmer
                </button>
                <button
                  onClick={() => setConfirmClose(false)}
                  className="flex-1 bg-muted py-2 rounded-lg text-sm font-medium"
                  data-testid="button-cancel-close-month"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
