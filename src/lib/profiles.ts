export interface QuizAnswers {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
}

export type ProfileType =
  | "plaisancier"
  | "economiste"
  | "chercheur"
  | "penseur"
  | "strategiste";

export interface ProfileDef {
  type: ProfileType;
  emoji: string;
  name: string;
  description: string;
  challenge: string;
  tip: string;
  dashboardFocus: "wins" | "savings" | "actions" | "cta" | "milestones";
}

export const PROFILES: Record<ProfileType, ProfileDef> = {
  plaisancier: {
    type: "plaisancier",
    emoji: "🎉",
    name: "Le Plaisancier",
    description: "Vous privilégiez le plaisir présent",
    challenge: "Flux tendu, peu d'épargne",
    tip: "Chaque petit geste compte — célébrez vos victoires",
    dashboardFocus: "wins",
  },
  economiste: {
    type: "economiste",
    emoji: "🛡️",
    name: "L'Économe",
    description: "Vous privilégiez la sécurité",
    challenge: "Argent bloqué, peur d'investir",
    tip: "Faites travailler votre argent — investissement progressif",
    dashboardFocus: "savings",
  },
  chercheur: {
    type: "chercheur",
    emoji: "⚡",
    name: "Le Chercheur",
    description: "Vous recherchez l'excitation",
    challenge: "Gains instables, pertes fréquentes",
    tip: "Les règles strictes créent la richesse stable",
    dashboardFocus: "actions",
  },
  penseur: {
    type: "penseur",
    emoji: "🧠",
    name: "Le Penseur",
    description: "Vous aimez comprendre avant d'agir",
    challenge: "Apprend beaucoup mais n'agit pas",
    tip: "Agissez, même imparfaitement — action > perfection",
    dashboardFocus: "cta",
  },
  strategiste: {
    type: "strategiste",
    emoji: "🎯",
    name: "Le Stratège",
    description: "Vous avez une vision long terme",
    challenge: "Continuer la progression",
    tip: "Diversifiez vos revenus — restez stratégique",
    dashboardFocus: "milestones",
  },
};

export function computeProfile(answers: QuizAnswers): ProfileType {
  const counts = [0, 0, 0, 0, 0];
  counts[answers.q1]++;
  counts[answers.q2]++;
  counts[answers.q3]++;
  counts[answers.q4]++;
  counts[answers.q5]++;
  const maxVal = Math.max(...counts);
  const maxIdx = counts.indexOf(maxVal);
  const types: ProfileType[] = [
    "plaisancier",
    "economiste",
    "chercheur",
    "penseur",
    "strategiste",
  ];
  return types[maxIdx];
}

export function getProfile(type: ProfileType | null | undefined): ProfileDef {
  return PROFILES[type ?? "strategiste"];
}
