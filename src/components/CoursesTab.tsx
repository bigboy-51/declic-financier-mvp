import { useState } from "react";
import { ShoppingCart, Plus, Trash2, CalendarDays } from "lucide-react";
import { useCourses, MoyenPaiement } from "@/hooks/useCourses";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

const PAYMENT_ICONS: Record<MoyenPaiement, string> = {
  CB: "💳",
  Cash: "💵",
  Retrait: "🏧",
  Chèque: "✓",
};

function AddCourseModal({
  onAdd,
  onClose,
}: {
  onAdd: (date: string, montant: number, label: string, moyenPaiement: MoyenPaiement) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [montant, setMontant] = useState("");
  const [label, setLabel] = useState("");
  const [paiement, setPaiement] = useState<MoyenPaiement>("CB");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseFloat(montant);
    if (!m || isNaN(m)) return;
    onAdd(date, m, label.trim(), paiement);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
        <h2 className="font-bold text-foreground">Ajouter une dépense</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400/40" />
            </div>
            <div className="w-28">
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Montant (€)</label>
              <input autoFocus type="number" min="0" step="0.01" value={montant} onChange={(e) => setMontant(e.target.value)}
                placeholder="0"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400/40" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Description (optionnel)</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Lidl, Carrefour…"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400/40" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Moyen de paiement</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(PAYMENT_ICONS) as MoyenPaiement[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaiement(m)}
                  className={`min-h-[44px] rounded-xl border-2 text-sm font-semibold transition-colors ${
                    paiement === m
                      ? "border-sky-400 bg-sky-400/15 text-sky-600 dark:text-sky-300"
                      : "border-border text-muted-foreground hover:border-sky-400/50"
                  }`}
                >
                  {PAYMENT_ICONS[m]} {m}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 min-h-[44px] rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
              Annuler
            </button>
            <button type="submit"
              className="flex-1 min-h-[44px] rounded-xl bg-sky-400 hover:bg-sky-500 text-white text-sm font-bold transition-colors">
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CoursesTab() {
  const { courses, loading, totalCurrentMonth, deleteCourse, addCourse } = useCourses();
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const now = new Date();
  const currentMonthLabel = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const currentMonthCourses = courses.filter((c) => {
    const [y, m] = c.date.split("-");
    return parseInt(y) === now.getFullYear() && parseInt(m) === now.getMonth() + 1;
  });

  if (loading) {
    return (
      <div className="px-4 py-10 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 max-w-lg mx-auto w-full">

      {/* Header card */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-orange-500/15 flex items-center justify-center">
          <ShoppingCart className="w-6 h-6 text-orange-500" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground capitalize">{currentMonthLabel}</p>
          <p className="text-2xl font-black text-foreground tabular-nums">{fmt(totalCurrentMonth)}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="min-h-[44px] px-4 rounded-xl bg-sky-400 hover:bg-sky-500 text-white text-sm font-bold transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {/* List */}
      {currentMonthCourses.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl px-4 py-10 text-center">
          <ShoppingCart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucune dépense ce mois-ci</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-3 text-sm text-sky-400 hover:text-sky-500 font-semibold"
          >
            + Ajouter la première
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {currentMonthCourses.length} dépense{currentMonthCourses.length > 1 ? "s" : ""}
            </p>
          </div>
          {currentMonthCourses.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
              <span className="text-lg">{PAYMENT_ICONS[c.moyenPaiement]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{c.label || "Courses"}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(c.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {c.moyenPaiement}
                </p>
              </div>
              <span className="text-sm font-bold tabular-nums text-foreground">{fmt(c.montant)}</span>
              <button
                onClick={() => setConfirmDel(c.id)}
                className="text-muted-foreground hover:text-red-500 transition-colors ml-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <AddCourseModal onAdd={addCourse} onClose={() => setShowAdd(false)} />
      )}

      {/* Delete confirm */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
            <p className="font-bold text-foreground">Supprimer cette dépense ?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDel(null)}
                className="flex-1 min-h-[44px] rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
                Annuler
              </button>
              <button onClick={() => { deleteCourse(confirmDel); setConfirmDel(null); }}
                className="flex-1 min-h-[44px] rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
