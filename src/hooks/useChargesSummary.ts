export interface Charge {
  id: string;
  name: string;
  montantPrevu: number;
  montantReel: number;
  montantRestant: number;
  custom?: boolean;
}

export const useChargesSummary = (charges: Charge[]) => {
  const totalPrevu = charges.reduce((sum, c) => sum + c.montantPrevu, 0);
  const totalReel = charges.reduce((sum, c) => sum + c.montantReel, 0);
  const totalRestant = totalPrevu - totalReel;

  return {
    totalPrevu: parseFloat(totalPrevu.toFixed(2)),
    totalReel: parseFloat(totalReel.toFixed(2)),
    totalRestant: parseFloat(totalRestant.toFixed(2)),
  };
};
