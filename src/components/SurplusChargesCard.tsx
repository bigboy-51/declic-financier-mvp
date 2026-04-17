import { useState, useEffect, useRef } from "react";
import { Zap, TrendingUp, Target, ChevronDown, ChevronUp, Rocket, PiggyBank, Loader2, CheckCircle2 } from "lucide-react";

interface SurplusChargesCardProps {
  expenses: Array<{
    id: string;
    name: string;
    amount: number;
    actualAmount: number;
  }>;
  totalCredits: number;
  totalDebt: number;
  monthlyPayment: number;
  onAttributeToCredits?: (amount: number) => void;
}

export function SurplusChargesCard({
  expenses,
  totalCredits,
  totalDebt,
  monthlyPayment,
  onAttributeToCredits,
}: SurplusChargesCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAttributing, setIsAttributing] = useState(false);
  const [attributed, setAttributed] = useState(false);
  const prevSurplusRef = useRef<number | null>(null);

  const totalPlanned = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalActual = expenses.reduce((sum, e) => sum + e.actualAmount, 0);
  const surplus = totalPlanned - totalActual;

  useEffect(() => {
    if (prevSurplusRef.current !== null && prevSurplusRef.current !== surplus) {
      setAttributed(false);
    }
    prevSurplusRef.current = surplus;
  }, [surplus]);

  // Si pas de surplus, ne rien afficher
  if (surplus <= 0) {
    return null;
  }

  const getAdvice = () => {
    if (totalDebt > 0) {
      const effectivePayment = monthlyPayment > 0 ? monthlyPayment : 1;
      const monthsToDebtFree = Math.ceil(totalDebt / effectivePayment);
      const acceleratedPayment = effectivePayment + surplus;
      const monthsAccelerated = acceleratedPayment > 0 ? Math.ceil(totalDebt / acceleratedPayment) : monthsToDebtFree;
      return {
        iconElement: <Rocket className="w-8 h-8 text-primary" />,
        title: "Accelerer vers Debt-Free",
        description: `Vous avez ${surplus.toFixed(2)}€ non depenses. Mettez-les sur un credit pour finir en ${monthsAccelerated} mois au lieu de ${monthsToDebtFree}.`,
        action: "Ajouter aux paiements",
        color: "from-primary/10 to-primary/5",
        buttonColor: "bg-primary hover:opacity-90",
      };
    } else {
      return {
        iconElement: <PiggyBank className="w-8 h-8 text-success" />,
        title: "Constituer une reserve",
        description: `Bravo ! Vous etes debt-free. Gardez ces ${surplus.toFixed(2)}€ pour une reserve d'urgence (3 mois de charges).`,
        action: "Reserver",
        color: "from-success/10 to-success/5",
        buttonColor: "bg-success hover:opacity-90",
      };
    }
  };

  const advice = getAdvice();

  const handleAttribute = async () => {
    setIsAttributing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (totalDebt > 0 && onAttributeToCredits) {
      onAttributeToCredits(surplus);
      setAttributed(true);
    }

    setIsAttributing(false);
  };

  return (
    <div
      className={`card-finance bg-gradient-to-r ${advice.color} border-l-4 border-amber-500`}
    >
      {/* Header collapsible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:opacity-80 transition min-h-[48px]"
        data-testid="button-toggle-surplus"
      >
        <div className="flex items-center gap-3">
          {advice.iconElement}
          <div className="text-left">
            <p className="text-xs text-muted-foreground uppercase font-bold">
              Surplus détecté
            </p>
            <p className="text-2xl font-bold text-amber-500">
              {surplus.toFixed(2)}€
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {advice.title}
            </p>
          </div>
        </div>
        <div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Détails expandés */}
      {isExpanded && (
        <div className="mt-4 space-y-3 border-t border-amber-500/30 pt-4">
          {/* Breakdown */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-2">
              Où vient ce surplus ?
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Charges prévues</span>
                <span className="font-bold">{totalPlanned.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between">
                <span>Réellement dépensé</span>
                <span className="font-bold">{totalActual.toFixed(2)}€</span>
              </div>
              <div className="border-t border-border pt-1 mt-1 flex justify-between font-bold text-amber-500">
                <span>Surplus</span>
                <span>+{surplus.toFixed(2)}€</span>
              </div>
            </div>
          </div>

          {/* Conseil IA */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1 font-bold">
              Conseil IA
            </p>
            <p className="text-sm text-foreground">{advice.description}</p>
          </div>

          {/* CTA Bouton */}
          {attributed ? (
            <div
              className="w-full bg-success/20 text-success min-h-[48px] py-3 rounded-lg font-bold text-sm md:text-base text-center flex items-center justify-center gap-2"
              data-testid="surplus-attributed-success"
            >
              <CheckCircle2 className="w-5 h-5" />
              Surplus attribue avec succes !
            </div>
          ) : (
            <button
              onClick={handleAttribute}
              disabled={isAttributing || totalDebt <= 0 || !onAttributeToCredits}
              className={`w-full ${advice.buttonColor} text-white min-h-[48px] py-3 rounded-lg font-bold text-sm md:text-base transition disabled:opacity-50 flex items-center justify-center gap-2`}
              data-testid="button-attribute-surplus"
            >
              {isAttributing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Traitement...
                </>
              ) : totalDebt <= 0 ? (
                <>
                  <PiggyBank className="w-4 h-4" />
                  Reserve constituee !
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  {advice.action}
                </>
              )}
            </button>
          )}

          {/* Info supplémentaire */}
          {totalDebt > 0 && (
            <div className="bg-primary/10 rounded p-2 border border-primary/30">
              <p className="text-xs text-foreground">
                <strong>Impact :</strong> Cet ajout économisera ~
                {Math.ceil((surplus / 12) * 6)} mois !
              </p>
            </div>
          )}
        </div>
      )}

      {/* État collapsé - petit aperçu */}
      {!isExpanded && (
        <p className="text-xs text-amber-500 mt-2 font-semibold">
          Cliquez pour voir le conseil IA →
        </p>
      )}
    </div>
  );
}
