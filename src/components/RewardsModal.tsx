import { useState } from "react";
import { X, Trophy, Star, Flame, Zap, Target, Lightbulb } from "lucide-react";

interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewards: {
    totalPoints: number;
    badges: Array<{
      id: string;
      name: string;
      description: string;
      points: number;
    }>;
    currentStreak: number;
  };
  monthlyStats: {
    totalDebt: number;
    totalExpensesBudget: number;
    totalExpensesReal: number;
    monthlyPayment: number;
    budgetRespected: boolean;
    debtProgression: string;
  };
}

export const RewardsModal = ({
  isOpen,
  onClose,
  rewards,
  monthlyStats,
}: RewardsModalProps): JSX.Element | null => {
  const [activeTab, setActiveTab] = useState<"rewards" | "tips">("rewards");

  if (!isOpen) return null;

  const { totalPoints, badges, currentStreak } = rewards;
  const {
    budgetRespected,
    totalExpensesReal,
    totalExpensesBudget,
    totalDebt,
    monthlyPayment,
  } = monthlyStats;

  // Conseils personnalisés
  const getTips = () => {
    const tips = [];

    if (!budgetRespected) {
      const overspend = totalExpensesReal - totalExpensesBudget;
      tips.push({
        icon: "💰",
        title: "Dépassement détecté",
        text: `Vous avez dépassé de ${overspend.toFixed(2)}€. Réduisez les courses la semaine prochaine.`,
        color: "bg-destructive/10 border-destructive/30",
      });
    } else {
      tips.push({
        icon: "✅",
        title: "Budget respecté !",
        text: "Vous maîtrisez vos dépenses. Continuez comme ça !",
        color: "bg-success/10 border-success/30",
      });
    }

    if (currentStreak >= 3) {
      tips.push({
        icon: "🔥",
        title: "Série en feu !",
        text: `${currentStreak} mois consécutifs de rigueur. Vous êtes une machine !`,
        color: "bg-orange-500/10 border-orange-500/30",
      });
    }

    if (totalDebt > 0 && monthlyPayment > 0) {
      const monthsLeft = Math.ceil(totalDebt / monthlyPayment);
      tips.push({
        icon: "🎯",
        title: "Objectif visible",
        text: `À ce rythme, debt-free en ${monthsLeft} mois. C'est proche !`,
        color: "bg-primary/10 border-primary/30",
      });
    }

    if (totalPoints >= 500) {
      tips.push({
        icon: "⭐",
        title: "Vous êtes une légende",
        text: `${totalPoints} points accumulés. Vous maîtrisez votre finances comme un pro.`,
        color: "bg-secondary/10 border-secondary/30",
      });
    }

    return tips;
  };

  const tips = getTips();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Vos Récompenses
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-muted/50 sticky top-16">
          <button
            onClick={() => setActiveTab("rewards")}
            className={`flex-1 py-3 text-sm font-bold transition ${
              activeTab === "rewards"
                ? "border-b-2 border-primary text-primary bg-background"
                : "text-muted-foreground"
            }`}
          >
            🏆 Récompenses
          </button>
          <button
            onClick={() => setActiveTab("tips")}
            className={`flex-1 py-3 text-sm font-bold transition ${
              activeTab === "tips"
                ? "border-b-2 border-primary text-primary bg-background"
                : "text-muted-foreground"
            }`}
          >
            💡 Conseils
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* REWARDS TAB */}
          {activeTab === "rewards" && (
            <div className="space-y-6">
              {/* Points Header */}
              <div className="card-finance bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-l-4 border-amber-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">
                      Vos points
                    </p>
                    <p className="text-4xl font-bold text-amber-500 mt-2">
                      {totalPoints}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalPoints < 500
                        ? `${500 - totalPoints} pts avant légende`
                        : "Vous êtes une légende ! 🌟"}
                    </p>
                  </div>
                  <Star className="w-12 h-12 text-amber-500 opacity-30" />
                </div>
              </div>

              {/* Streak */}
              {currentStreak > 0 && (
                <div className="card-finance bg-gradient-to-r from-orange-500/10 to-red-500/10 border-l-4 border-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">
                        Série en cours
                      </p>
                      <p className="text-3xl font-bold text-orange-500 mt-2">
                        {currentStreak} mois
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Continua comme ça !
                      </p>
                    </div>
                    <Flame className="w-12 h-12 text-orange-500 opacity-30" />
                  </div>
                </div>
              )}

              {/* Badges */}
              {badges.length > 0 && (
                <div>
                  <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Badges débloqués ({badges.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="card-finance bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/30 text-center p-4"
                      >
                        <div className="text-3xl mb-2">
                          {badge.id === "first-payment" && "🎯"}
                          {badge.id === "budget-master" && "💰"}
                          {badge.id === "snowball-rolling" && "❄️"}
                          {badge.id === "three-month-streak" && "🔥"}
                        </div>
                        <p className="text-xs font-bold">{badge.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {badge.description}
                        </p>
                        <p className="text-xs font-bold text-amber-500 mt-2">
                          +{badge.points}pts
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prochains badges à débloquer */}
              <div>
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5" />À débloquer
                </h3>
                <div className="space-y-2">
                  {!badges.some((b) => b.id === "budget-master") && (
                    <div className="card-finance opacity-60">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💰</span>
                        <div className="flex-1">
                          <p className="text-sm font-bold">Budget Master</p>
                          <p className="text-xs text-muted-foreground">
                            Respecter le budget ce mois
                          </p>
                        </div>
                        <span className="text-xs font-bold text-amber-500">
                          +75pts
                        </span>
                      </div>
                    </div>
                  )}
                  {!badges.some((b) => b.id === "snowball-rolling") && (
                    <div className="card-finance opacity-60">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">❄️</span>
                        <div className="flex-1">
                          <p className="text-sm font-bold">Snowball en route</p>
                          <p className="text-xs text-muted-foreground">
                            Voir les dettes diminuer
                          </p>
                        </div>
                        <span className="text-xs font-bold text-amber-500">
                          +150pts
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TIPS TAB */}
          {activeTab === "tips" && (
            <div className="space-y-3">
              {tips.length > 0 ? (
                tips.map((tip, idx) => (
                  <div
                    key={idx}
                    className={`card-finance border-l-4 p-4 ${tip.color}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{tip.icon}</span>
                      <div>
                        <p className="font-bold text-sm">{tip.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {tip.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card-finance text-center py-8">
                  <p className="text-muted-foreground">
                    Pas de conseils pour le moment
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 sticky bottom-0 bg-muted/50">
          <button
            onClick={onClose}
            className="w-full btn-primary py-2 text-sm font-bold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
