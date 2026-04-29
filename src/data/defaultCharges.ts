export interface DefaultCharge {
  name: string;
  prevu: number;
  categoryId: string;
}

export const DEFAULT_CHARGES: DefaultCharge[] = [
  { name: "Loyer", prevu: 600, categoryId: "logement" },
  { name: "Assurance habitation", prevu: 15, categoryId: "logement" },
  { name: "Électricité / gaz", prevu: 80, categoryId: "logement" },
  { name: "Eau", prevu: 25, categoryId: "logement" },
  { name: "Internet box", prevu: 30, categoryId: "logement" },
  { name: "Forfait téléphone", prevu: 15, categoryId: "transport" },
  { name: "Assurance voiture", prevu: 70, categoryId: "transport" },
  { name: "Essence / transport", prevu: 120, categoryId: "transport" },
  { name: "Mutuelle santé", prevu: 40, categoryId: "sante" },
  { name: "Frais bancaires", prevu: 5, categoryId: "finances" },
  { name: "Épargne automatique", prevu: 100, categoryId: "finances" },
  { name: "Canal+", prevu: 25, categoryId: "loisirs" },
  { name: "Netflix", prevu: 14, categoryId: "loisirs" },
  { name: "Spotify / Deezer", prevu: 11, categoryId: "loisirs" },
  { name: "Amazon Prime", prevu: 7, categoryId: "loisirs" },
  { name: "Salle de sport", prevu: 30, categoryId: "loisirs" },
  { name: "Coiffeur", prevu: 50, categoryId: "loisirs" },
  { name: "Cigare", prevu: 60, categoryId: "loisirs" },
  { name: "Loisirs divers", prevu: 50, categoryId: "loisirs" },
  { name: "Animal", prevu: 50, categoryId: "divers" },
  { name: "Assurance téléphone", prevu: 10, categoryId: "divers" },
  { name: "Cloud / stockage", prevu: 3, categoryId: "divers" },
];

export const DEMO_INCOMES = [
  { name: "Salaire", amount: 2800, receiptDay: 5 },
];

export const DEMO_STARTING_BALANCE = 500;
