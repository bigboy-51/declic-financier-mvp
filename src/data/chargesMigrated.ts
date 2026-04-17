import { CHARGES_DATA } from "@/data/chargesData";

export interface ChargeMigratedItem {
  id: string;
  name: string;
  categoryId: string;
  montantPrevu: number;
  montantReel: number;
  montantRestant: number;
  custom: boolean;
}

export const chargesMigratedData: ChargeMigratedItem[] = CHARGES_DATA.map((c) => ({
  id: c.id,
  name: c.name,
  categoryId: c.categoryId,
  montantPrevu: c.montantPrevu,
  montantReel: 0,
  montantRestant: c.montantPrevu,
  custom: false,
}));
