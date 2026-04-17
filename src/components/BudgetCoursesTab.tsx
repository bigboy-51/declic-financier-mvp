import { useState, useEffect } from "react";
import { ref, get, set, push, remove, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useBudgetCourses } from "@/hooks/useBudgetCourses";
import { useToast } from "@/hooks/use-toast";

type MoyenPaiement = "CB" | "Cash" | "Retrait" | "Chèque";

function getWeekNumber(d: Date): number {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const year = date.getFullYear();
  const yearStart = new Date(year, 0, 1);
  return Math.floor(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7) + 1;
}

function getMondayOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

interface FutureDep {
  id: string;
  name: string;
  amount: number;
  targetDate: string;
}

const PAYMENT_ICONS: Record<string, string> = {
  CB: "💳",
  Cash: "💵",
  Retrait: "🏧",
  Chèque: "✓",
  unknown: "❓",
};

const AddCourseModal = ({
  onAdd,
  onClose,
}: {
  onAdd: (date: string, montant: number, moyenPaiement: MoyenPaiement) => void;
  onClose: () => void;
}) => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [montant, setMontant] = useState("");
  const [paiement, setPaiement] = useState<MoyenPaiement>("CB");

  const handleSubmit = () => {
    if (!montant || isNaN(parseFloat(montant))) return;
    onAdd(date, parseFloat(parseFloat(montant).toFixed(2)), paiement);
    setMontant("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold dark:text-white">➕ AJOUTER DÉPENSE</h3>

        <div>
          <label className="text-sm font-semibold dark:text-gray-200">📅 Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            data-testid="input-course-date"
            className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="text-sm font-semibold dark:text-gray-200">💰 Montant (€)</label>
          <input
            type="number"
            placeholder="45.50"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            step="0.01"
            data-testid="input-course-montant"
            className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="text-sm font-semibold dark:text-gray-200">💳 Moyen de paiement</label>
          <div className="flex gap-4 mt-1 flex-wrap">
            {(["CB", "Cash", "Retrait", "Chèque"] as MoyenPaiement[]).map((m) => (
              <label key={m} className="flex items-center gap-2 cursor-pointer dark:text-gray-200">
                <input
                  type="radio"
                  value={m}
                  checked={paiement === m}
                  onChange={() => setPaiement(m)}
                  data-testid={`radio-paiement-${m}`}
                />
                {m}
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            data-testid="button-confirm-add-course"
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded font-semibold hover:bg-orange-600"
          >
            AJOUTER
          </button>
          <button
            onClick={onClose}
            data-testid="button-cancel-add-course"
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-white rounded font-semibold"
          >
            ANNULER
          </button>
        </div>
      </div>
    </div>
  );
};

export default function BudgetCoursesTab() {
  const { user } = useAuth();
  const { courses, loading } = useBudgetCourses();
  const { toast } = useToast();

  const [budgetPrevu, setBudgetPrevu] = useState(600);
  const [budgetLocked, setBudgetLocked] = useState(false);
  const [budgetInput, setBudgetInput] = useState("600");
  const [viewMode, setViewMode] = useState<"semaine" | "mois">("semaine");
  const [weekAnchor, setWeekAnchor] = useState<Date>(getMondayOfWeek(new Date()));
  const [filterPayment, setFilterPayment] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "old">("recent");
  const [showAddModal, setShowAddModal] = useState(false);
  const [futureExpenses, setFutureExpenses] = useState<FutureDep[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    if (!user) { setSettingsLoading(false); return; }
    const load = async () => {
      const snap = await get(ref(db, `users/${user.uid}/settings/budgetCourses`));
      const val = snap.val();
      if (val) {
        const p = val.prevu ?? 600;
        setBudgetPrevu(p);
        setBudgetInput(String(p));
        setBudgetLocked(val.locked ?? false);
      }
      const futSnap = await get(ref(db, `users/${user.uid}/futureExpenses`));
      const futRaw = futSnap.val() ?? {};
      const loaded: FutureDep[] = Object.entries(futRaw).map(([id, v]) => {
        const vv = v as Record<string, unknown>;
        return {
          id,
          name: String(vv.name ?? ""),
          amount: Number(vv.amount ?? 0),
          targetDate: String(vv.targetDate ?? ""),
        };
      });
      setFutureExpenses(loaded.sort((a, b) => a.targetDate.localeCompare(b.targetDate)));
      setSettingsLoading(false);
    };
    load();
  }, [user]);

  const saveBudgetSettings = async (prevu: number, locked: boolean) => {
    if (!user) return;
    await set(ref(db, `users/${user.uid}/settings/budgetCourses`), { prevu, locked, updatedAt: new Date().toISOString() });
  };

  const handleBudgetBlur = () => {
    const parsed = parseFloat(budgetInput);
    if (!isNaN(parsed) && parsed > 0) {
      setBudgetPrevu(parsed);
      saveBudgetSettings(parsed, budgetLocked).catch(console.error);
    }
  };

  const toggleLock = () => {
    const newLocked = !budgetLocked;
    setBudgetLocked(newLocked);
    saveBudgetSettings(budgetPrevu, newLocked).catch(console.error);
  };

  const handleAddCourse = async (date: string, montant: number, moyenPaiement: MoyenPaiement) => {
    if (!user) return;
    const now = new Date().toISOString();
    try {
      await push(ref(db, `users/${user.uid}/budgetCourses`), {
        date,
        montant,
        moyenPaiement,
        label: "",
        createdAt: now,
        updatedAt: now,
        source: "manual",
      });
      setShowAddModal(false);
      toast({ description: "✓ Course ajoutée", duration: 2000 });
    } catch (err) {
      console.error(err);
      toast({ description: "❌ Erreur", variant: "destructive" });
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!user) return;
    if (!window.confirm("Supprimer cette dépense ?")) return;
    try {
      await remove(ref(db, `users/${user.uid}/budgetCourses/${id}`));
      toast({ description: "✓ Dépense supprimée", duration: 2000 });
    } catch (err) {
      console.error(err);
      toast({ description: "❌ Erreur", variant: "destructive" });
    }
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const totalDuMois = courses
    .filter((c) => {
      const [y, m] = c.date.split("-");
      return parseInt(y) === currentYear && parseInt(m) === currentMonth;
    })
    .reduce((s, c) => s + c.montant, 0);

  const restant = budgetPrevu - totalDuMois;
  const percentUsed = budgetPrevu > 0 ? (totalDuMois / budgetPrevu) * 100 : 0;
  const depassement = totalDuMois > budgetPrevu;
  const budgetHebdo = budgetPrevu / 4.3;

  const weekEnd = new Date(weekAnchor);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weekCourses = courses.filter((c) => {
    const d = new Date(c.date);
    return d >= weekAnchor && d <= weekEnd;
  });

  const weekTotal = weekCourses.reduce((s, c) => s + c.montant, 0);

  const filteredCourses = courses
    .filter((c) => !filterPayment || c.moyenPaiement === filterPayment)
    .sort((a, b) =>
      sortBy === "recent"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date)
    );

  const prevWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() - 7);
    setWeekAnchor(d);
  };

  const nextWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() + 7);
    setWeekAnchor(d);
  };

  if (loading || settingsLoading) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Chargement…</div>;
  }

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">

      {/* ── HEADER ── */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 p-6 rounded-xl border border-amber-200 dark:border-amber-800 space-y-4">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">🛒 Budget Courses</h1>

        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-300 text-sm">Budget mensuel :</span>
          <input
            type="number"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            onBlur={handleBudgetBlur}
            disabled={budgetLocked}
            data-testid="input-budget-prevu"
            className={`text-2xl font-bold w-28 px-2 py-1 rounded border text-center dark:bg-gray-800 dark:text-white ${
              budgetLocked ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-70" : "bg-white"
            }`}
          />
          <span className="text-gray-600 dark:text-gray-300 font-semibold">€/mois</span>
          <button
            onClick={toggleLock}
            data-testid="button-lock-budget"
            className="text-xl hover:scale-110 transition-transform ml-1"
          >
            {budgetLocked ? "🔒" : "🔓"}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Dépensé</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400" data-testid="text-total-depense">
              {totalDuMois.toFixed(2)} €
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Restant</p>
            <p
              className={`text-2xl font-bold ${restant >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              data-testid="text-restant"
            >
              {restant.toFixed(2)} €
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Progression</p>
            <p className="text-sm font-semibold dark:text-gray-200">{Math.min(percentUsed, 100).toFixed(0)}%</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
              <div
                className={`h-2 rounded-full transition-all ${depassement ? "bg-red-500" : "bg-green-500"}`}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {depassement && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-semibold" data-testid="alert-depassement">
            ⚠️ Budget dépassé de {Math.abs(restant).toFixed(2)} €
          </div>
        )}

        {!depassement && percentUsed >= 80 && (
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-lg border border-orange-300 dark:border-orange-700 text-sm flex items-center gap-2" data-testid="alert-80">
            <span className="text-lg">⚠️</span>
            <span>
              <strong>{percentUsed.toFixed(0)}%</strong> du budget utilisé.{" "}
              {restant > 0 ? `Plus que ${restant.toFixed(2)} € pour finir le mois.` : "Budget dépassé !"}
            </span>
          </div>
        )}

        {!depassement && percentUsed >= 30 && percentUsed < 80 && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg border border-yellow-200 dark:border-yellow-700 text-sm flex items-center gap-2" data-testid="alert-30">
            <span className="text-lg">💡</span>
            <span>
              Tu as utilisé <strong>{percentUsed.toFixed(0)}%</strong> de ton budget courses.
              {restant > 0 && ` Reste ${restant.toFixed(2)} € ce mois.`}
            </span>
          </div>
        )}
      </div>

      {/* ── VUE TOGGLE ── */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("semaine")}
          data-testid="button-view-semaine"
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            viewMode === "semaine"
              ? "bg-orange-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          }`}
        >
          📅 SEMAINE {getWeekNumber(weekAnchor)}
        </button>
        <button
          onClick={() => setViewMode("mois")}
          data-testid="button-view-mois"
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            viewMode === "mois"
              ? "bg-orange-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          }`}
        >
          📊 VUE MOIS
        </button>
      </div>

      {/* ── VUE SEMAINE ── */}
      {viewMode === "semaine" && (
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex justify-between items-center">
            <button
              onClick={prevWeek}
              data-testid="button-prev-week"
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 transition-colors"
            >
              ◄ Précédente
            </button>
            <span className="font-bold text-sm dark:text-white">
              Sem. {getWeekNumber(weekAnchor)} — {weekAnchor.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </span>
            <button
              onClick={nextWeek}
              data-testid="button-next-week"
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 transition-colors"
            >
              Suivante ►
            </button>
          </div>

          <div className="space-y-1">
            {Array.from({ length: 7 }, (_, i) => {
              const dayDate = new Date(weekAnchor);
              dayDate.setDate(dayDate.getDate() + i);
              const dayStr = dayDate.toISOString().split("T")[0];
              const dayTotal = weekCourses
                .filter((c) => c.date === dayStr)
                .reduce((s, c) => s + c.montant, 0);
              const dayName = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"][i];
              return (
                <div key={i} className="flex justify-between items-center p-2 border-b dark:border-gray-700">
                  <span className="font-semibold text-sm w-16 dark:text-gray-200">
                    {dayName} {dayDate.getDate()}
                  </span>
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-bold text-orange-600 dark:text-orange-400 w-20 text-right">
                      {dayTotal > 0 ? `${dayTotal.toFixed(2)} €` : "—"}
                    </span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 bg-orange-400 rounded-full"
                        style={{ width: `${Math.min((dayTotal / (budgetHebdo / 7)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg font-bold dark:text-white flex justify-between items-center">
            <span>TOTAL SEMAINE</span>
            <span className={weekTotal > budgetHebdo ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}>
              {weekTotal.toFixed(2)} € / {budgetHebdo.toFixed(2)} €
              {weekTotal > budgetHebdo && " ⚠️ DÉPASSÉ"}
            </span>
          </div>
        </div>
      )}

      {/* ── VUE MOIS ── */}
      {viewMode === "mois" && (
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
          <h3 className="font-bold dark:text-white">
            📊 Vue mensuelle — {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </h3>
          {(["CB", "Cash", "Retrait", "Chèque"] as MoyenPaiement[]).map((m) => {
            const total = courses
              .filter((c) => {
                const [y, mo] = c.date.split("-");
                return parseInt(y) === currentYear && parseInt(mo) === currentMonth && c.moyenPaiement === m;
              })
              .reduce((s, c) => s + c.montant, 0);
            if (total === 0) return null;
            return (
              <div key={m} className="flex justify-between items-center p-2 border-b dark:border-gray-700">
                <span className="dark:text-gray-200">{PAYMENT_ICONS[m]} {m}</span>
                <span className="font-bold text-orange-600 dark:text-orange-400">{total.toFixed(2)} €</span>
              </div>
            );
          })}
          <div className="font-bold flex justify-between pt-2 dark:text-white">
            <span>Total du mois</span>
            <span className={depassement ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}>
              {totalDuMois.toFixed(2)} € / {budgetPrevu.toFixed(2)} €
            </span>
          </div>
        </div>
      )}

      {/* ── FILTRES + LISTE ── */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => setFilterPayment(null)}
            data-testid="filter-tous"
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              !filterPayment ? "bg-orange-500 text-white" : "bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            Tous
          </button>
          {(["CB", "Cash", "Retrait", "Chèque"] as MoyenPaiement[]).map((m) => (
            <button
              key={m}
              onClick={() => setFilterPayment(filterPayment === m ? null : m)}
              data-testid={`filter-${m}`}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterPayment === m ? "bg-orange-500 text-white" : "bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {PAYMENT_ICONS[m]} {m}
            </button>
          ))}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "recent" | "old")}
            data-testid="select-sort"
            className="ml-auto px-3 py-1 border rounded dark:bg-gray-800 dark:text-white text-sm"
          >
            <option value="recent">📅 Plus récent</option>
            <option value="old">📅 Plus ancien</option>
          </select>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
          {filteredCourses.length === 0 ? (
            <p className="p-6 text-center text-gray-500 dark:text-gray-400">Aucune dépense</p>
          ) : (
            filteredCourses.map((course, idx) => (
              <div
                key={course.id}
                data-testid={`row-course-${course.id}`}
                onClick={() => handleDeleteCourse(course.id)}
                className={`p-3 flex justify-between items-center border-b dark:border-gray-700 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors ${
                  idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {new Date(course.date + "T12:00:00").toLocaleDateString("fr-FR")}
                  </span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">
                    {course.montant.toFixed(2)} €
                  </span>
                  {course.label && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 italic">{course.label}</span>
                  )}
                </div>
                <span className="text-xl">{PAYMENT_ICONS[course.moyenPaiement] ?? "❓"}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── DÉPENSES À VENIR ── */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-4 rounded-xl border border-purple-200 dark:border-purple-800 space-y-3">
        <h3 className="font-bold text-lg dark:text-white">🔮 Dépenses à venir</h3>
        {futureExpenses.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-sm">Aucune dépense prévue</p>
        ) : (
          <>
            {futureExpenses.map((exp) => (
              <div key={exp.id} className="flex justify-between text-sm p-2 bg-white dark:bg-gray-800 rounded-lg dark:text-gray-200">
                <span>{exp.name}</span>
                <span className="font-bold">{exp.amount.toFixed(2)} €</span>
                <span>{new Date(exp.targetDate + "T12:00:00").toLocaleDateString("fr-FR")}</span>
              </div>
            ))}
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-lg text-sm font-semibold">
              TOTAL À VENIR : {futureExpenses.reduce((s, e) => s + e.amount, 0).toFixed(2)} €
            </div>
          </>
        )}
      </div>

      {/* ── BOUTON AJOUTER ── */}
      <button
        onClick={() => setShowAddModal(true)}
        data-testid="button-add-course"
        className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors"
      >
        ➕ AJOUTER DÉPENSE
      </button>

      {showAddModal && (
        <AddCourseModal onAdd={handleAddCourse} onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
