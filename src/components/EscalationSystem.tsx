import { X, Clock, AlertTriangle, CheckCircle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FinancialProfileQuiz } from "@/components/FinancialProfileQuiz";
import { PROFILES } from "@/lib/profiles";
import type { QuizAnswers } from "@/lib/profiles";
import type { ProfileType } from "@/lib/profiles";

interface EscalationSystemProps {
  escalationLevel: 0 | 1 | 2 | 3;
  skipCount: number;
  userContinuedWithoutQuiz: boolean;
  showQuiz: boolean;
  completedProfile: ProfileType | null;
  onSkip: () => Promise<void>;
  onContinueWithoutQuiz: () => Promise<void>;
  onStartQuiz: () => void;
  onQuizComplete: (answers: QuizAnswers) => Promise<{ previousProfile: ProfileType | null; newProfile: ProfileType }>;
  onQuizSkip: () => void;
  onResultClose: () => void;
}

export interface EscalationDashboardCardProps {
  skipCount: number;
  onSkip: () => Promise<void>;
  onStartQuiz: () => void;
}

export interface EscalationBannerProps {
  onStartQuiz: () => void;
  onDismiss: () => void;
}

export function EscalationBanner({ onStartQuiz, onDismiss }: EscalationBannerProps) {
  return (
    <div
      data-testid="banner-escalation-persistent"
      className="w-full bg-blue-600 dark:bg-blue-700 text-white px-4 py-2.5 flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Target className="h-4 w-4 flex-shrink-0" />
        <span>🎯 Débloquez votre personnalisation</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onStartQuiz}
          data-testid="button-banner-faire-quiz"
          className="bg-white text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-blue-50 transition-colors min-h-[32px]"
        >
          Faire le quiz
        </button>
        <button
          onClick={onDismiss}
          data-testid="button-banner-dismiss"
          className="text-white/70 hover:text-white transition-colors p-1"
          aria-label="Fermer la bannière"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function EscalationDashboardCard({ skipCount, onSkip, onStartQuiz }: EscalationDashboardCardProps) {
  const skipsRemaining = Math.max(0, 3 - skipCount);

  return (
    <div
      data-testid="card-escalation-e2"
      className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-5 shadow-sm mb-4"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0 text-2xl">
          🔒
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white text-base">Dashboard personnalisé</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Déverrouillez avec votre profil financier
          </p>
          <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
            <li>• Défis spécifiques à votre style</li>
            <li>• Conseils adaptés</li>
            <li>• Progression personnelle</li>
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              onClick={onStartQuiz}
              data-testid="button-e2-faire-quiz"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white min-h-[48px] text-base"
            >
              Faire le quiz
            </Button>
            <button
              onClick={onSkip}
              data-testid="button-e2-skip"
              className="text-gray-500 dark:text-gray-400 text-sm font-medium py-2 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Clock className="h-4 w-4" />
              Skip for now
              {skipsRemaining > 0 && (
                <span className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                  ⏳ {skipsRemaining} skip{skipsRemaining > 1 ? "s" : ""} remaining
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EscalationSystem({
  escalationLevel,
  skipCount,
  userContinuedWithoutQuiz,
  showQuiz,
  completedProfile,
  onSkip,
  onContinueWithoutQuiz,
  onStartQuiz,
  onQuizComplete,
  onQuizSkip,
  onResultClose,
}: EscalationSystemProps) {
  if (completedProfile) {
    const profile = PROFILES[completedProfile];
    return (
      <div
        className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"
        data-testid="modal-quiz-result"
      >
        <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-sm w-full p-8 text-center shadow-2xl">
          <div className="text-6xl mb-4">{profile.emoji}</div>
          <div className="text-yellow-500 text-sm font-semibold mb-2 tracking-widest">✨ Connais-toi toi-même ✨</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{profile.name}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{profile.description}</p>
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800 dark:text-green-300 text-sm font-medium text-left">
              Bravo ! Vous avez déverrouillé votre personnalisation
            </p>
          </div>
          <Button
            onClick={onResultClose}
            data-testid="button-quiz-result-dashboard"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white min-h-[48px] text-base"
          >
            Retour au dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (showQuiz) {
    return (
      <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 overflow-y-auto" data-testid="modal-escalation-quiz">
        <FinancialProfileQuiz
          onComplete={onQuizComplete}
          onSkip={onQuizSkip}
          skipLabel="Retour"
          title="Découvrez votre profil financier"
          subtitle="5 questions rapides (2 minutes)"
        />
      </div>
    );
  }

  if (escalationLevel === 0) {
    return (
      <div
        className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
        data-testid="modal-escalation-e1"
      >
        <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-sm w-full p-7 shadow-2xl relative">
          <button
            onClick={onSkip}
            data-testid="button-e1-close"
            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">✨</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Presque là !</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              Vous avez fourni vos données financières.
              <br />
              <br />
              Maintenant, comprenez <strong>VOTRE style</strong> pour :
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-300 mt-3 space-y-1 text-left pl-4">
              <li>• Recevoir des défis adaptés</li>
              <li>• Progresser plus vite</li>
              <li>• Atteindre vos objectifs</li>
            </ul>
          </div>
          <div className="flex items-center justify-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-xl py-2.5 mb-5">
            <Clock className="h-4 w-4" />
            <span>⏱️ 2 minutes</span>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={onStartQuiz}
              data-testid="button-e1-start-quiz"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white min-h-[52px] text-base font-semibold"
            >
              Faire le quiz maintenant
            </Button>
            <Button
              onClick={onSkip}
              data-testid="button-e1-plus-tard"
              variant="outline"
              className="w-full min-h-[52px] text-base text-gray-600 dark:text-gray-300"
            >
              Plus tard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (escalationLevel === 3 && !userContinuedWithoutQuiz) {
    return (
      <div
        className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"
        data-testid="modal-escalation-e3"
      >
        <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-sm w-full p-7 shadow-2xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              ⚠️ Se connaître = clé du succès
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            Vous avez décidé de sauter votre profil 3 fois.
          </p>
          <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl p-4 mb-5 space-y-1.5 text-sm text-orange-800 dark:text-orange-300">
            <p>❌ Défis = génériques (pas adaptés à vous)</p>
            <p>❌ Dashboard = pas personnalisé</p>
            <p>❌ Conseils = standard pour tous</p>
            <p>❌ Stratégie = générique, pas ciblée</p>
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-5 text-center">
            Voulez-vous vraiment continuer sans connaître votre style ?
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={onStartQuiz}
              data-testid="button-e3-start-quiz"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white min-h-[52px] text-base font-semibold"
            >
              Faire le quiz maintenant
            </Button>
            <Button
              onClick={onContinueWithoutQuiz}
              data-testid="button-e3-continuer"
              variant="outline"
              className="w-full min-h-[52px] text-base text-gray-600 dark:text-gray-300"
            >
              Oui, continuer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
