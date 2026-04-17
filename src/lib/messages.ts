import type { UserType } from "@/context/AuthContext";

export type MessageKey =
  | "budget_label"
  | "quick_wins_title"
  | "budget_respected"
  | "debt_celebration"
  | "no_wins_yet"
  | "payment_applied"
  | "budget_charges_respected"
  | "debt_free_on_track"
  | "couple_tab_label"
  | "couple_tab_context"
  | "status_label";

const MESSAGES: Record<MessageKey, Record<UserType, string>> = {
  budget_label: {
    single: "Mon budget courses",
    couple: "Notre budget courses",
  },
  quick_wins_title: {
    single: "CETTE SEMAINE – Votre progression",
    couple: "CETTE SEMAINE – Votre progression ensemble",
  },
  budget_respected: {
    single: "Vous avez respecté votre budget !",
    couple: "Vous avez respecté votre budget ensemble ! 🎉",
  },
  debt_celebration: {
    single: "Vous avez éliminé",
    couple: "Vous avez éliminé ensemble",
  },
  no_wins_yet: {
    single: "Vos réussites apparaîtront ici au fil du mois.",
    couple: "Vos réussites communes apparaîtront ici au fil du mois.",
  },
  payment_applied: {
    single: "Paiement crédits appliqué",
    couple: "Paiement crédits appliqué ensemble",
  },
  budget_charges_respected: {
    single: "Budget charges respecté",
    couple: "Budget charges respecté ensemble",
  },
  debt_free_on_track: {
    single: "Vous êtes en bonne voie ! 💪",
    couple: "Vous êtes en bonne voie ensemble ! 💪",
  },
  couple_tab_label: {
    single: "Motivation",
    couple: "Couple",
  },
  couple_tab_context: {
    single: "Vos défis personnels cette semaine",
    couple: "Vos défis ensemble cette semaine",
  },
  status_label: {
    single: "Célibataire",
    couple: "En couple",
  },
};

export function getMsg(userType: UserType | null | undefined, key: MessageKey): string {
  const ut: UserType = userType ?? "single";
  return MESSAGES[key][ut];
}
