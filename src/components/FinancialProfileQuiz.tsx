import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import type { QuizAnswers } from "@/lib/profiles";
import { computeProfile, PROFILES } from "@/lib/profiles";

interface FinancialProfileQuizProps {
  onComplete: (answers: QuizAnswers) => Promise<void>;
  onSkip: () => void | Promise<void>;
  previousProfileType?: string | null;
  skipLabel?: string;
  title?: string;
  subtitle?: string;
}

const QUESTIONS = [
  {
    id: "q1" as const,
    question: "Avec Déclic Financier, je veux principalement...",
    options: [
      "Dépenser mon argent sans culpabilité",
      "Sécuriser mon avenir financier",
      "Libérer du cash pour saisir les opportunités qui se présentent",
      "Comprendre clairement ma situation financière",
      "Progresser sereinement vers mes objectifs financiers",
    ],
  },
  {
    id: "q2" as const,
    question: "Déclic m'aiderait le plus à...",
    options: [
      "Sortir du flux tendu et respirer enfin",
      "Épargner progressivement",
      "Stabiliser mes finances et savoir où j'en suis",
      "Enfin passer à l'action au lieu de planifier",
      "Avancer pas à pas vers plus de stabilité",
    ],
  },
  {
    id: "q3" as const,
    question: "Avec mon argent, je suis plutôt...",
    options: [
      "Quelqu'un qui vit le moment présent",
      "Quelqu'un qui a besoin de sécurité absolue",
      "Quelqu'un qui aime calculer les risques",
      "Quelqu'un qui réfléchit longtemps avant d'agir",
      "Quelqu'un avec une vision claire et disciplinée",
    ],
  },
  {
    id: "q4" as const,
    question: "Mes priorités financières sont...",
    options: [
      "Économiser sans me priver",
      "Constituer un fonds d'urgence (500–1 000 €)",
      "Rembourser mes dettes",
      "Avoir une vision claire de mes dépenses",
      "Construire progressivement mon avenir",
    ],
  },
  {
    id: "q5" as const,
    question: "Pour avancer financièrement, j'ai besoin de...",
    options: [
      "Célébrer mes petites victoires",
      "Voir mon épargne augmenter chaque mois",
      "Me fixer des défis et avancer",
      "Suivre clairement ma progression",
      "Comprendre précisément où en sont mes finances",
    ],
  },
] as const;

const TOTAL = QUESTIONS.length;
type Phase = "quiz" | "results";

export function FinancialProfileQuiz({
  onComplete,
  onSkip,
  previousProfileType,
  skipLabel = "Passer le questionnaire",
  title = "Découvrez votre profil avec Déclic Financier",
  subtitle = "5 questions rapides (3–5 minutes)",
}: FinancialProfileQuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [phase, setPhase] = useState<Phase>("quiz");
  const [saving, setSaving] = useState(false);

  const q = QUESTIONS[step];
  const selected = answers[q.id as keyof QuizAnswers];
  const isLast = step === TOTAL - 1;
  const pct = Math.round(((step + (selected !== undefined ? 1 : 0)) / TOTAL) * 100);

  const handleSelect = (idx: number) => {
    setAnswers((prev) => ({ ...prev, [q.id]: idx }));
  };

  const handleContinue = () => {
    if (selected === undefined) return;
    if (isLast) {
      setPhase("results");
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleAccess = async () => {
    if (saving) return;
    setSaving(true);
    const full: QuizAnswers = {
      q1: answers.q1 ?? 0,
      q2: answers.q2 ?? 0,
      q3: answers.q3 ?? 0,
      q4: answers.q4 ?? 0,
      q5: answers.q5 ?? 0,
    };
    try {
      await onComplete(full);
    } catch {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSkip();
    } catch {
      setSaving(false);
    }
  };

  if (phase === "results") {
    const full: QuizAnswers = {
      q1: answers.q1 ?? 0,
      q2: answers.q2 ?? 0,
      q3: answers.q3 ?? 0,
      q4: answers.q4 ?? 0,
      q5: answers.q5 ?? 0,
    };
    const profileType = computeProfile(full);
    const profile = PROFILES[profileType];
    const evolved =
      previousProfileType && previousProfileType !== profileType;

    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-background overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 max-w-lg mx-auto w-full">

          {/* Evolution badge */}
          {evolved && (
            <div className="w-full mb-4 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                🎊 Votre profil a évolué !
              </p>
            </div>
          )}

          {/* Gold quote */}
          <p className="text-base font-bold text-amber-500 dark:text-amber-400 mb-4 text-center tracking-wide">
            ✨ « Connais-toi toi-même » ✨
          </p>

          {/* Title */}
          <p className="text-sm text-muted-foreground mb-2 text-center">Votre profil financier actuel</p>

          {/* Profile card */}
          <div className="w-full rounded-2xl border-2 border-sky-400/40 bg-sky-400/8 px-6 py-8 text-center mb-6">
            <div className="text-5xl mb-3">{profile.emoji}</div>
            <h2 className="text-2xl font-black text-foreground mb-2">{profile.name}</h2>
            <p className="text-base text-muted-foreground mb-4">{profile.description}</p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground">
              <span>Défi actuel :</span>
              <span className="font-semibold text-foreground">{profile.challenge}</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="w-full mb-8 px-4 py-3 rounded-xl bg-muted/60 border border-border text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              ⚠️ C'est une hypothèse basée sur vos réponses.<br />
              Votre profil peut évoluer en fonction de vos actions.<br />
              Vous verrez si c'est juste dans 30 jours.
            </p>
          </div>

          {/* Access button */}
          <button
            onClick={handleAccess}
            disabled={saving}
            data-testid="quiz-access-app"
            className="w-full min-h-[56px] rounded-xl bg-sky-400 hover:bg-sky-500 text-white font-bold text-base transition-colors disabled:opacity-50"
          >
            {saving ? "Chargement..." : "Accéder à l'app"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-6 max-w-lg mx-auto w-full">

        {/* Header */}
        <div className="w-full mb-6 text-center">
          <p className="text-sm font-semibold text-amber-500 dark:text-amber-400 mb-2 tracking-wide">
            ✨ « Connais-toi toi-même » ✨
          </p>
          <h1 className="text-xl font-black text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>

        {/* Progress */}
        <div className="w-full mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Question {step + 1} sur {TOTAL}</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-400 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="w-full mb-5">
          <p className="text-lg font-bold text-foreground leading-snug">{q.question}</p>
        </div>

        {/* Options */}
        <div className="w-full flex flex-col gap-3 mb-6">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={saving}
              data-testid={`quiz-option-${step}-${idx}`}
              className={`w-full min-h-[52px] px-4 py-3 rounded-xl border-2 text-left text-sm font-medium transition-all active:scale-[0.99] ${
                selected === idx
                  ? "border-sky-400 bg-sky-400/15 text-sky-600 dark:text-sky-300"
                  : "border-border bg-card text-foreground hover:border-sky-400/50 hover:bg-sky-400/5"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="w-full flex flex-col gap-3">
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                disabled={saving}
                data-testid="quiz-back"
                className="min-h-[52px] px-4 rounded-xl border-2 border-border bg-card text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Retour
              </button>
            )}
            <button
              onClick={handleContinue}
              disabled={selected === undefined || saving}
              data-testid="quiz-continue"
              className="flex-1 min-h-[52px] rounded-xl bg-sky-400 hover:bg-sky-500 text-white font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLast ? "Voir mon profil" : "Continuer"}
            </button>
          </div>

          {skipLabel && (
            <button
              onClick={handleSkip}
              disabled={saving}
              data-testid="quiz-skip"
              className="w-full min-h-[44px] text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {skipLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
