import { auth, db } from "@/lib/firebase";
import { ref, get, set, update } from "firebase/database";

export const migrateGroceryToBudgetCourses = async (): Promise<{ success: boolean; migrated: number }> => {
  const user = auth.currentUser;
  if (!user) {
    console.log("❌ No user logged in");
    return { success: false, migrated: 0 };
  }

  try {
    const userRef     = ref(db, `users/${user.uid}`);
    const userSnap    = await get(userRef);
    const migrationDone = userSnap.val()?.groceryMigrationDone ?? false;

    if (migrationDone) {
      console.log("✅ Migration Grocery déjà effectuée, skip");
      return { success: false, migrated: 0 };
    }

    // Lire les groceryExpenses depuis /finances
    const grocerySnap = await get(ref(db, `users/${user.uid}/finances/groceryExpenses`));
    const rawGrocery  = grocerySnap.val();

    if (!rawGrocery) {
      console.log("ℹ️ Aucune grocery trouvée dans /finances");
      await update(userRef, { groceryMigrationDone: true });
      return { success: true, migrated: 0 };
    }

    // Normaliser en tableau (RTDB peut stocker array ou object map)
    const allGrocery: Array<{ id: string; amount: number; label?: string; dateISO?: string }> =
      Array.isArray(rawGrocery)
        ? rawGrocery.filter(Boolean)
        : Object.entries(rawGrocery).map(([k, v]) => ({ id: k, ...(v as object) }));

    // Filtrer par plage de dates (25 mars - 12 avril 2026)
    const migrationStart = new Date("2026-03-25");
    const migrationEnd   = new Date("2026-04-12T23:59:59");

    const toMigrate = allGrocery.filter((item) => {
      if (!item.dateISO) return false;
      const d = new Date(item.dateISO);
      return d >= migrationStart && d <= migrationEnd;
    });

    console.log(`📊 Migration en cours...`);
    console.log(`Grocery trouvées (25 mars - 12 avril): ${toMigrate.length}`);

    if (toMigrate.length === 0) {
      console.log("ℹ️ Aucune grocery à migrer dans cette plage");
      await update(userRef, { groceryMigrationDone: true });
      return { success: true, migrated: 0 };
    }

    console.log("➕ Création des dépenses Budget Courses...");
    const now = new Date().toISOString();
    const writes: Promise<void>[] = [];

    for (const item of toMigrate) {
      const id = `migrated-${item.id ?? Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      writes.push(
        set(ref(db, `users/${user.uid}/budgetCourses/${id}`), {
          date:            item.dateISO ?? now.split("T")[0],
          montant:         item.amount ?? 0,
          moyenPaiement:   "Cash",
          label:           item.label ?? "",
          createdAt:       now,
          updatedAt:       now,
          source:          "migrated",
          originalGroceryId: item.id ?? null,
        })
      );
    }

    await Promise.all(writes);
    await update(userRef, { groceryMigrationDone: true });

    console.log(`✅ Migration réussie : ${toMigrate.length} dépenses migrées`);
    return { success: true, migrated: toMigrate.length };
  } catch (error) {
    console.error("❌ Erreur migration Grocery:", error);
    return { success: false, migrated: 0 };
  }
};
