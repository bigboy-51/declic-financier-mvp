import { useEffect, useState } from "react";
import { Flame, Star, Trophy, Zap, Target, CheckCircle2, Circle } from "lucide-react";

interface ChallengeEntry {
  completed: boolean;
  pointsAwarded: boolean;
}

interface ChallengesData {
  daily: {
    checkIn: ChallengeEntry;
    salaireRecu: ChallengeEntry;
    journeeSobre: ChallengeEntry;
    budgetCourses: ChallengeEntry;
  };
  weekly: {
    paiementTemps: ChallengeEntry;
    tresoPositive: ChallengeEntry;
    actifDays: number;
    streakDays: number;
  };
  monthly: {
    moisAccompli: ChallengeEntry;
    dettesDiminuent: ChallengeEntry;
    budgetParfait: ChallengeEntry;
    surplusMaximise: ChallengeEntry;
  };
}

interface ChallengesProps {
  challengeData: ChallengesData;
  dailyCompleted: number;
  weeklyCompleted: number;
  monthlyCompleted: number;
  totalPoints: number;
  currentStreak: number;
}

function getBadgeTier(points: number): {
  emoji: string;
  name: string;
  color: string;
  next: number | null;
} {
  if (points >= 1001)
    return { emoji: "💎", name: "Platine", color: "text-cyan-500", next: null };
  if (points >= 501)
    return { emoji: "🥇", name: "Or", color: "text-yellow-500", next: 1001 };
  if (points >= 251)
    return { emoji: "🥈", name: "Argent", color: "text-slate-400", next: 501 };
  if (points >= 100)
    return { emoji: "🥉", name: "Bronze", color: "text-amber-700", next: 251 };
  return { emoji: "🌱", name: "Débutant", color: "text-muted-foreground", next: 100 };
}

function ChallengeRow({
  completed,
  emoji,
  name,
  desc,
  points,
}: {
  completed: boolean;
  emoji: string;
  name: string;
  desc: string;
  points: number;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        completed
          ? "bg-success/10 border-success/30"
          : "bg-muted/30 border-border"
      }`}
    >
      <span className="text-xl w-8 text-center shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-bold leading-tight ${
            completed ? "text-success" : "text-foreground"
          }`}
        >
          {name}
        </p>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-bold text-amber-500">+{points}pts</span>
        {completed ? (
          <CheckCircle2 className="w-5 h-5 text-success" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground/40" />
        )}
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Challenges({
  challengeData,
  dailyCompleted,
  weeklyCompleted,
  monthlyCompleted,
  totalPoints,
  currentStreak,
}: ChallengesProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const badge = getBadgeTier(totalPoints);

  useEffect(() => {
    if (dailyCompleted >= 3) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(t);
    }
  }, [dailyCompleted]);

  const { daily, weekly, monthly } = challengeData;

  return (
    <div className="space-y-6 pb-8 relative">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {["🎉", "⭐", "🏆", "💰", "🔥", "✨"].map((e, i) => (
            <span
              key={i}
              className="absolute text-3xl animate-bounce"
              style={{
                left: `${10 + i * 15}%`,
                top: "-10%",
                animationDuration: `${0.8 + i * 0.15}s`,
                animationDelay: `${i * 0.1}s`,
                animation: `fall ${1.5 + i * 0.3}s ease-in forwards`,
              }}
            >
              {e}
            </span>
          ))}
          <style>{`
            @keyframes fall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* Header: Badge + Points + Streak */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-finance text-center py-4">
          <p className="text-3xl mb-1">{badge.emoji}</p>
          <p className={`text-xs font-bold ${badge.color}`}>{badge.name}</p>
          {badge.next && (
            <p className="text-xs text-muted-foreground mt-1">
              {badge.next - totalPoints}pts
            </p>
          )}
        </div>
        <div className="card-finance text-center py-4 col-span-1">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-500">{totalPoints}</p>
          <p className="text-xs text-muted-foreground">points</p>
        </div>
        <div className="card-finance text-center py-4">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-500">{currentStreak}</p>
          <p className="text-xs text-muted-foreground">mois</p>
        </div>
      </div>

      {/* Badge tier progress */}
      {badge.next && (
        <div className="card-finance">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">
              Progression vers {badge.next >= 1001 ? "💎 Platine" : badge.next >= 501 ? "🥇 Or" : badge.next >= 251 ? "🥈 Argent" : "🥉 Bronze"}
            </span>
            <span className="text-xs font-bold text-amber-500">{totalPoints} / {badge.next}</span>
          </div>
          <ProgressBar value={totalPoints} max={badge.next} color="bg-amber-500" />
        </div>
      )}

      {/* Daily Challenges */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Défis du jour
          </h2>
          <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">
            {dailyCompleted}/4
          </span>
        </div>
        {dailyCompleted >= 3 && (
          <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center text-sm font-bold text-amber-600 dark:text-amber-400">
            🎉 Incroyable ! {dailyCompleted}/4 défis du jour accomplis !
          </div>
        )}
        <div className="space-y-2">
          <ChallengeRow
            completed={daily.checkIn.completed}
            emoji="📱"
            name="Check-in financier"
            desc="Ouvrir l'application aujourd'hui"
            points={5}
          />
          <ChallengeRow
            completed={daily.salaireRecu.completed}
            emoji="💶"
            name="Salaire reçu"
            desc="Marquer un salaire comme reçu"
            points={20}
          />
          <ChallengeRow
            completed={daily.journeeSobre.completed}
            emoji="🧘"
            name="Journée sobre"
            desc="Aucune dépense courses aujourd'hui"
            points={10}
          />
          <ChallengeRow
            completed={daily.budgetCourses.completed}
            emoji="🛒"
            name="Budget courses respecté"
            desc="Rester sous le budget courses du mois"
            points={15}
          />
        </div>
      </section>

      {/* Weekly Challenges */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" />
            Défis de la semaine
          </h2>
          <span className="text-xs font-bold bg-orange-500/10 text-orange-500 px-2 py-1 rounded-full">
            {weeklyCompleted}/4
          </span>
        </div>
        <div className="space-y-2">
          <ChallengeRow
            completed={weekly.paiementTemps.completed}
            emoji="💳"
            name="Paiement à temps"
            desc="Appliquer le paiement mensuel"
            points={30}
          />
          <ChallengeRow
            completed={weekly.tresoPositive.completed}
            emoji="📈"
            name="Tréso positive"
            desc="Solde du compte joint > 0€"
            points={40}
          />
          <div
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              weekly.actifDays >= 5
                ? "bg-success/10 border-success/30"
                : "bg-muted/30 border-border"
            }`}
          >
            <span className="text-xl w-8 text-center shrink-0">🏃</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${weekly.actifDays >= 5 ? "text-success" : "text-foreground"}`}>
                Actif 5 jours
              </p>
              <div className="mt-1.5 space-y-1">
                <ProgressBar value={weekly.actifDays} max={5} color="bg-success" />
                <p className="text-xs text-muted-foreground">{weekly.actifDays}/5 jours cette semaine</p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-xs font-bold text-amber-500">+25pts</span>
              {weekly.actifDays >= 5 ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground/40" />
              )}
            </div>
          </div>
          <div
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              weekly.streakDays >= 7
                ? "bg-success/10 border-success/30"
                : "bg-muted/30 border-border"
            }`}
          >
            <span className="text-xl w-8 text-center shrink-0">🔥</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${weekly.streakDays >= 7 ? "text-success" : "text-foreground"}`}>
                Streak 7 jours
              </p>
              <div className="mt-1.5 space-y-1">
                <ProgressBar value={weekly.streakDays} max={7} color="bg-orange-500" />
                <p className="text-xs text-muted-foreground">{weekly.streakDays}/7 jours de suite</p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-xs font-bold text-amber-500">+50pts</span>
              {weekly.streakDays >= 7 ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground/40" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Monthly Challenges */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Défis du mois
          </h2>
          <span className="text-xs font-bold bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full">
            {monthlyCompleted}/4
          </span>
        </div>
        <div className="space-y-2">
          <ChallengeRow
            completed={monthly.moisAccompli.completed}
            emoji="🎉"
            name="Mois accompli"
            desc="Clôturer le mois"
            points={100}
          />
          <ChallengeRow
            completed={monthly.dettesDiminuent.completed}
            emoji="📉"
            name="Dettes en baisse"
            desc="Total dettes inférieur au mois dernier"
            points={75}
          />
          <ChallengeRow
            completed={monthly.budgetParfait.completed}
            emoji="💚"
            name="Budget parfait"
            desc="Aucun dépassement sur les charges fixes"
            points={60}
          />
          <ChallengeRow
            completed={monthly.surplusMaximise.completed}
            emoji="🚀"
            name="Surplus maximisé"
            desc="Attribuer le surplus aux crédits"
            points={50}
          />
        </div>
      </section>

      {/* Badge system legend */}
      <section>
        <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          Paliers de badges
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { emoji: "🌱", name: "Débutant", range: "0–99 pts", active: totalPoints < 100 },
            { emoji: "🥉", name: "Bronze", range: "100–250 pts", active: totalPoints >= 100 && totalPoints < 251 },
            { emoji: "🥈", name: "Argent", range: "251–500 pts", active: totalPoints >= 251 && totalPoints < 501 },
            { emoji: "🥇", name: "Or", range: "501–1000 pts", active: totalPoints >= 501 && totalPoints < 1001 },
            { emoji: "💎", name: "Platine", range: "1001+ pts", active: totalPoints >= 1001 },
            { emoji: "👑", name: "Légende", range: "Sans dettes", active: false },
          ].map((b) => (
            <div
              key={b.name}
              className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
                b.active
                  ? "bg-amber-500/10 border-amber-500/40 font-bold"
                  : "bg-muted/20 border-border opacity-60"
              }`}
            >
              <span className="text-2xl">{b.emoji}</span>
              <div>
                <p className="font-bold text-xs">{b.name}</p>
                <p className="text-xs text-muted-foreground">{b.range}</p>
              </div>
              {b.active && (
                <span className="ml-auto text-xs font-black text-amber-500">←</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
