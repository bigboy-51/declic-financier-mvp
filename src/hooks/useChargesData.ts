import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export interface FlatCharge {
  id: string;
  categoryId: string;
  name: string;
  prevu: number;
  reel: number;
  restant: number;
  locked: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChargesSummary {
  totalPrevu: number;
  totalReel: number;
  totalRestant: number;
  percentUsed: number;
  overBudget: boolean;
}

export function useChargesData() {
  const { user } = useAuth();
  const [charges, setCharges] = useState<FlatCharge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const r = ref(db, `users/${user.uid}/charges`);
    const unsub = onValue(r, (snap) => {
      const raw = snap.val() ?? {};
      const flat: FlatCharge[] = [];
      Object.entries(raw).forEach(([catId, catVal]) => {
        const cat = catVal as Record<string, unknown>;
        const rubriques = (cat.rubriques ?? {}) as Record<string, Record<string, unknown>>;
        Object.entries(rubriques).forEach(([rubId, rub]) => {
          const prevu  = Number(rub.prevu  ?? 0);
          const reel   = Number(rub.reel   ?? 0);
          const storedRestant = rub.restant !== undefined ? Number(rub.restant) : prevu - reel;
          flat.push({
            id: rubId,
            categoryId: catId,
            name: String(rub.name ?? ""),
            prevu,
            reel,
            restant: storedRestant,
            locked: Boolean(rub.locked),
            createdAt: rub.createdAt as string | undefined,
            updatedAt: rub.updatedAt as string | undefined,
          });
        });
      });
      setCharges(flat);
      setLoading(false);
    });
    return () => off(r, "value", unsub);
  }, [user]);

  const totalPrevu    = charges.reduce((s, c) => s + c.prevu, 0);
  const totalReel     = charges.reduce((s, c) => s + c.reel,  0);
  const totalRestant  = totalPrevu - totalReel;
  const percentUsed   = totalPrevu > 0 ? (totalReel / totalPrevu) * 100 : 0;
  const overBudget    = totalReel > totalPrevu && totalPrevu > 0;

  const summary: ChargesSummary = {
    totalPrevu:   parseFloat(totalPrevu.toFixed(2)),
    totalReel:    parseFloat(totalReel.toFixed(2)),
    totalRestant: parseFloat(totalRestant.toFixed(2)),
    percentUsed:  parseFloat(percentUsed.toFixed(1)),
    overBudget,
  };

  return { charges, loading, summary };
}
