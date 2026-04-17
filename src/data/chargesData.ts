export interface ChargeDataItem {
  id: string;
  name: string;
  montantPrevu: number;
  categoryId: string;
}

export const CHARGES_DATA: ChargeDataItem[] = [
  { id: "aide-maman",          name: "Aide maman",          montantPrevu: 30,    categoryId: "divers" },
  { id: "apple-chatgpt",       name: "Apple (ChatGPT)",     montantPrevu: 22.99, categoryId: "divers" },
  { id: "ass-hab-cep",         name: "Ass Hab C.Ep",        montantPrevu: 30,    categoryId: "logement" },
  { id: "assurance-vie",       name: "Assurance vie",       montantPrevu: 30,    categoryId: "finances" },
  { id: "assurance-voiture",   name: "Assurance voiture",   montantPrevu: 56,    categoryId: "transport" },
  { id: "c-plus",              name: "C+",                  montantPrevu: 21.99, categoryId: "loisirs" },
  { id: "cadeau",              name: "Cadeau",              montantPrevu: 20,    categoryId: "loisirs" },
  { id: "cantine",             name: "Cantine",             montantPrevu: 50,    categoryId: "divers" },
  { id: "chat",                name: "Chat",                montantPrevu: 40,    categoryId: "divers" },
  { id: "charge-copro",        name: "Charge de copro",     montantPrevu: 65,    categoryId: "logement" },
  { id: "cigare",              name: "Cigare",              montantPrevu: 40,    categoryId: "loisirs" },
  { id: "coiffeur",            name: "Coiffeur",            montantPrevu: 40,    categoryId: "loisirs" },
  { id: "cotisation-cep",      name: "Cotisation C.Ep",     montantPrevu: 12,    categoryId: "finances" },
  { id: "cotisation-bancaire", name: "Cotisation bancaire", montantPrevu: 16,    categoryId: "finances" },
  { id: "edf",                 name: "EDF",                 montantPrevu: 151,   categoryId: "logement" },
  { id: "eau",                 name: "Eau",                 montantPrevu: 22,    categoryId: "logement" },
  { id: "entretien-voiture",   name: "Entretien voiture",   montantPrevu: 30,    categoryId: "transport" },
  { id: "essence",             name: "Essence",             montantPrevu: 200,   categoryId: "transport" },
  { id: "foncier",             name: "Foncier",             montantPrevu: 105,   categoryId: "finances" },
  { id: "free-mobile",         name: "Free Mobile",         montantPrevu: 92,    categoryId: "divers" },
  { id: "freebox",             name: "Freebox",             montantPrevu: 39,    categoryId: "logement" },
  { id: "geoz",                name: "GEOZ",                montantPrevu: 28,    categoryId: "logement" },
  { id: "impot-prelevement",   name: "Impôt prélèvement",   montantPrevu: 8,     categoryId: "finances" },
  { id: "loisirs-famille",     name: "Loisirs famille",     montantPrevu: 50,    categoryId: "loisirs" },
  { id: "mgp",                 name: "MGP",                 montantPrevu: 28.32, categoryId: "sante" },
  { id: "mutuelle-jp",         name: "Mutuelle JP",         montantPrevu: 27,    categoryId: "sante" },
  { id: "noel",                name: "Noël",                montantPrevu: 40,    categoryId: "loisirs" },
  { id: "obleu",               name: "OBleu",               montantPrevu: 28,    categoryId: "logement" },
  { id: "pharmacie-fixe",      name: "Pharmacie fixe",      montantPrevu: 35,    categoryId: "sante" },
  { id: "prevoyance-min",      name: "Prévoyance Min",      montantPrevu: 52,    categoryId: "finances" },
  { id: "tram-transdev",       name: "TRAM (TransDev)",     montantPrevu: 17,    categoryId: "transport" },
  { id: "veolia",              name: "Veolia",              montantPrevu: 60,    categoryId: "logement" },
];
