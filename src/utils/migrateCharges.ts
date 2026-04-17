import { auth, db } from "@/lib/firebase";
import { ref, get, set, remove, update } from "firebase/database";
import { chargesMigratedData } from "@/data/chargesMigrated";
import { CHARGE_CATEGORIES } from "@/constants/chargeCategories";

export const migrateChargesToFirebase = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) {
    console.log("❌ No user logged in");
    return false;
  }

  try {
    const userRef   = ref(db, `users/${user.uid}`);
    const chargesRef = ref(db, `users/${user.uid}/charges`);

    // VÉRIFIER SI MIGRATION DÉJÀ FAITE
    const userSnap = await get(userRef);
    const migrationDone = userSnap.val()?.migrationDone ?? false;

    if (migrationDone) {
      console.log("✅ Migration déjà effectuée, skip");
      return false;
    }

    console.log(`📊 Migration en cours...`);

    // SUPPRIMER LES ANCIENNES CHARGES
    console.log("🗑️ Nettoyage des anciennes charges...");
    await remove(chargesRef);

    // RECRÉER LES CATÉGORIES
    const now = new Date().toISOString();
    for (const cat of CHARGE_CATEGORIES) {
      await set(ref(db, `users/${user.uid}/charges/${cat.id}`), {
        name: cat.name,
        icon: cat.icon,
        order: cat.order,
        locked: true,
        createdAt: now,
      });
    }

    // AJOUTER LES CHARGES MIGRÉES
    console.log(`➕ Injection de ${chargesMigratedData.length} charges...`);
    const writes = chargesMigratedData.map((charge) =>
      set(ref(db, `users/${user.uid}/charges/${charge.categoryId}/rubriques/${charge.id}`), {
        name: charge.name,
        prevu: parseFloat(charge.montantPrevu.toFixed(2)),
        reel: parseFloat(charge.montantReel.toFixed(2)),
        locked: !charge.custom,
        custom: charge.custom,
        createdAt: now,
        updatedAt: now,
      })
    );
    await Promise.all(writes);

    // MARQUER MIGRATION COMME FAITE
    await update(userRef, { migrationDone: true });

    console.log(`✅ Migration réussie : ${chargesMigratedData.length} charges`);
    return true;
  } catch (error) {
    console.error("❌ Erreur migration:", error);
    return false;
  }
};
