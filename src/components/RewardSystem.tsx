import { Trophy, Star, Flame } from "lucide-react";

interface RewardSystemProps {
  rewards: {
    totalPoints: number;
    badges: Array<{
      id: string;
      name: string;
      description: string;
      points?: number;
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

export function RewardSystem({ rewards, monthlyStats }: RewardSystemProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);

  return (
    <div className="card-finance mt-4 space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold text-sm" data-testid="text-rewards-title">
          Récompenses
        </h3>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Star className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium" data-testid="text-total-points">
            {rewards.totalPoints} pts
          </span>
        </div>
        {rewards.currentStreak > 0 && (
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium" data-testid="text-streak">
              {rewards.currentStreak} mois
            </span>
          </div>
        )}
      </div>

      {rewards.badges.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Badges</p>
          <div className="flex flex-wrap gap-2">
            {rewards.badges.map((badge) => (
              <span
                key={badge.id}
                className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-md"
                title={badge.description}
                data-testid={`badge-${badge.id}`}
              >
                {badge.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {monthlyStats.budgetRespected && (
        <p className="text-xs text-[hsl(var(--success))] font-medium" data-testid="text-budget-respected">
          Budget respecté ce mois
        </p>
      )}
    </div>
  );
}
