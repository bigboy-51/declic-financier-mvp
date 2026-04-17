export interface ChargeCategory {
  id: string;
  name: string;
  icon: string;
  order: number;
}

export const CHARGE_CATEGORIES: ChargeCategory[] = [
  { id: "finances",        name: "Finances",        icon: "💰", order: 1 },
  { id: "logement",        name: "Logement",        icon: "🏠", order: 2 },
  { id: "loisirs",         name: "Loisirs",         icon: "🎉", order: 3 },
  { id: "transport",       name: "Transport",       icon: "🚗", order: 4 },
  { id: "sante",           name: "Santé",           icon: "👨‍⚕️", order: 5 },
  { id: "remboursements",  name: "Remboursements",  icon: "🔄", order: 6 },
  { id: "divers",          name: "Divers",          icon: "🔀", order: 7 },
];

export interface Rubrique {
  id: string;
  name: string;
  prevu: number;
  reel: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChargeNode {
  name: string;
  icon: string;
  order: number;
  locked: boolean;
  createdAt: string;
  rubriques?: Record<string, Omit<Rubrique, "id">>;
}
