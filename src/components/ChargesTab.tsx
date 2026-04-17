import { useState, useRef, useEffect } from "react";
import { ref, set, remove } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { CHARGE_CATEGORIES } from "@/constants/chargeCategories";
import { useChargesData, FlatCharge } from "@/hooks/useChargesData";
import { useChargesSummary } from "@/hooks/useChargesSummary";
import { ChargesRecap } from "@/components/ChargesRecap";
import { migrateChargesToFirebase } from "@/utils/migrateCharges";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

function fmt(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface AddChargeModalProps {
  categoryId: string;
  categoryName: string;
  onSave: (categoryId: string, name: string, prevu: number) => void;
  onClose: () => void;
}

function AddChargeModal({ categoryId, categoryName, onSave, onClose }: AddChargeModalProps) {
  const [name, setName] = useState("");
  const [prevu, setPrevu] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(categoryId, name.trim(), parseFloat(prevu) || 0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
        <div>
          <h2 className="font-bold text-foreground text-base">Ajouter une charge</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{categoryName}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nom</label>
            <input
              autoFocus
              data-testid="input-add-charge-name"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Ex : Netflix, Spotify…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Montant prévu (€)</label>
            <input
              data-testid="input-add-charge-prevu"
              type="number"
              min="0"
              step="0.01"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="0,00"
              value={prevu}
              onChange={(e) => setPrevu(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              data-testid="button-add-charge-cancel"
              onClick={onClose}
              className="flex-1 min-h-[44px] rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              data-testid="button-add-charge-save"
              className="flex-1 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ChargeRowProps {
  charge: FlatCharge;
  onUpdateReel: (charge: FlatCharge, value: number) => void;
  onDelete: (charge: FlatCharge) => void;
}

function ChargeRow({ charge, onUpdateReel, onDelete }: ChargeRowProps) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(String(charge.reel));
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = () => {
    setEditVal(String(charge.reel));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 30);
  };

  const handleCommit = () => {
    const v = parseFloat(editVal) || 0;
    setEditing(false);
    if (v !== charge.reel) onUpdateReel(charge, v);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleCommit(); }
    if (e.key === "Escape") { setEditing(false); setEditVal(String(charge.reel)); }
  };

  const restant  = charge.prevu - charge.reel;
  const over     = charge.reel > charge.prevu && charge.prevu > 0;

  return (
    <li
      className="grid items-center gap-1 px-3 py-2 hover:bg-muted/30 transition-colors border-b border-border/40 last:border-0"
      style={{ gridTemplateColumns: "1fr 72px 88px 72px 32px" }}
      data-testid={`row-charge-${charge.id}`}
    >
      {/* Name */}
      <span className="text-sm text-foreground font-medium truncate pr-1">{charge.name}</span>

      {/* Prévu */}
      <span className="text-xs text-right text-muted-foreground font-medium tabular-nums">
        {fmt(charge.prevu)}
      </span>

      {/* Réel — inline editable */}
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          min="0"
          step="0.01"
          data-testid={`input-reel-${charge.id}`}
          value={editVal}
          onChange={(e) => setEditVal(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={handleKey}
          className="w-full text-right text-sm px-2 py-1 rounded-lg border border-primary bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 tabular-nums"
        />
      ) : (
        <button
          data-testid={`button-reel-${charge.id}`}
          onClick={handleStartEdit}
          className={`text-right text-sm font-semibold tabular-nums rounded-lg px-2 py-1 transition-colors hover:bg-primary/10 ${
            over ? "text-red-500" : "text-foreground"
          }`}
          title="Cliquer pour modifier"
        >
          {fmt(charge.reel)}
        </button>
      )}

      {/* Restant */}
      <span
        data-testid={`text-restant-${charge.id}`}
        className={`text-xs text-right font-bold tabular-nums ${
          restant < 0 ? "text-red-500" : restant === 0 ? "text-muted-foreground" : "text-green-600 dark:text-green-400"
        }`}
      >
        {fmt(restant)}
      </span>

      {/* Delete (custom only) */}
      <div className="flex justify-end">
        {!charge.locked && (
          <button
            data-testid={`button-delete-charge-${charge.id}`}
            onClick={() => onDelete(charge)}
            className="p-1 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </li>
  );
}

interface CategorySectionProps {
  categoryId: string;
  name: string;
  icon: string;
  charges: FlatCharge[];
  onUpdateReel: (charge: FlatCharge, value: number) => void;
  onAddCharge: (categoryId: string) => void;
  onDelete: (charge: FlatCharge) => void;
}

function CategorySection({ categoryId, name, icon, charges, onUpdateReel, onAddCharge, onDelete }: CategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  const prevu    = charges.reduce((s, c) => s + c.prevu, 0);
  const reel     = charges.reduce((s, c) => s + c.reel,  0);
  const restant  = prevu - reel;
  const over     = reel > prevu && prevu > 0;
  const sorted   = [...charges].sort((a, b) => a.name.localeCompare(b.name, "fr"));

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden" data-testid={`section-category-${categoryId}`}>
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
        onClick={() => setCollapsed((c) => !c)}
        data-testid={`button-toggle-${categoryId}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">{icon}</span>
          <span className="font-bold text-foreground text-xs uppercase tracking-wide truncate">{name}</span>
          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium shrink-0">
            {charges.length}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {charges.length > 0 && (
            <div className="text-right hidden sm:block">
              <span className="text-xs text-muted-foreground">
                {fmt(reel)}{" "}
                <span className="text-muted-foreground/60">/</span>{" "}
                {fmt(prevu)}
              </span>
              {" · "}
              <span className={`text-xs font-semibold ${over ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
                {fmt(restant)}
              </span>
            </div>
          )}
          {collapsed
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronUp   className="w-4 h-4 text-muted-foreground" />
          }
        </div>
      </button>

      {!collapsed && (
        <>
          {/* Table header */}
          {sorted.length > 0 && (
            <div
              className="grid px-3 py-1.5 bg-muted/40 border-y border-border/40"
              style={{ gridTemplateColumns: "1fr 72px 88px 72px 32px" }}
            >
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Charge</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Prévu</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Réel ✏️</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Restant</span>
              <span />
            </div>
          )}

          {/* Rows */}
          <ul>
            {sorted.length === 0 ? (
              <li className="px-4 py-3 text-xs text-muted-foreground italic">
                Aucune charge — cliquez sur + pour en ajouter.
              </li>
            ) : (
              sorted.map((c) => (
                <ChargeRow
                  key={c.id}
                  charge={c}
                  onUpdateReel={onUpdateReel}
                  onDelete={onDelete}
                />
              ))
            )}
          </ul>

          {/* Add row */}
          <div className="px-4 py-2.5 border-t border-border/40">
            <button
              data-testid={`button-add-charge-${categoryId}`}
              onClick={() => onAddCharge(categoryId)}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors min-h-[32px]"
            >
              <Plus className="w-3.5 h-3.5" />
              Ajouter une charge
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ChargesTab() {
  const { user }                        = useAuth();
  const { charges, loading }            = useChargesData();
  const [addModal, setAddModal]         = useState<{ categoryId: string; categoryName: string } | null>(null);
  const [confirmDel, setConfirmDel]     = useState<FlatCharge | null>(null);

  // Migration automatique au montage
  useEffect(() => {
    migrateChargesToFirebase().catch(console.error);
  }, []);

  // Convertir FlatCharge → Charge pour useChargesSummary
  const summaryInput = charges.map((c) => ({
    id: c.id,
    name: c.name,
    montantPrevu: c.prevu,
    montantReel: c.reel,
    montantRestant: c.restant,
    custom: !c.locked,
  }));
  const { totalPrevu, totalReel, totalRestant } = useChargesSummary(summaryInput);

  const handleUpdateReel = async (charge: FlatCharge, newReel: number) => {
    if (!user) return;
    const montantRestant = parseFloat((charge.prevu - newReel).toFixed(2));
    const path = `users/${user.uid}/charges/${charge.categoryId}/rubriques/${charge.id}`;
    await set(ref(db, `${path}/reel`), parseFloat(newReel.toFixed(2)));
    await set(ref(db, `${path}/restant`), montantRestant);
    await set(ref(db, `${path}/updatedAt`), new Date().toISOString());
  };

  const handleAddCharge = async (categoryId: string, name: string, prevu: number) => {
    if (!user) return;
    const id = generateId();
    const now = new Date().toISOString();
    await set(ref(db, `users/${user.uid}/charges/${categoryId}/rubriques/${id}`), {
      name,
      prevu,
      reel: 0,
      restant: prevu,
      locked: false,
      createdAt: now,
      updatedAt: now,
    });
  };

  const handleDelete = async (charge: FlatCharge) => {
    if (!user) return;
    await remove(ref(db, `users/${user.uid}/charges/${charge.categoryId}/rubriques/${charge.id}`));
    setConfirmDel(null);
  };

  if (loading) {
    return (
      <div className="px-4 py-10 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-3 max-w-lg mx-auto w-full">

      {/* ── ChargesRecap (Synthèse Prévu / Réel / Restant) ── */}
      <div data-testid="charges-recap">
        <ChargesRecap
          totalPrevu={totalPrevu}
          totalReel={totalReel}
          totalRestant={totalRestant}
        />
      </div>

      {/* ── Category sections ── */}
      {CHARGE_CATEGORIES.map((cat) => {
        const catCharges = charges.filter((c) => c.categoryId === cat.id);
        return (
          <CategorySection
            key={cat.id}
            categoryId={cat.id}
            name={cat.name}
            icon={cat.icon}
            charges={catCharges}
            onUpdateReel={handleUpdateReel}
            onAddCharge={(catId) => setAddModal({ categoryId: catId, categoryName: `${cat.icon} ${cat.name}` })}
            onDelete={(charge) => setConfirmDel(charge)}
          />
        );
      })}

      {/* ── Add charge modal ── */}
      {addModal && (
        <AddChargeModal
          categoryId={addModal.categoryId}
          categoryName={addModal.categoryName}
          onSave={handleAddCharge}
          onClose={() => setAddModal(null)}
        />
      )}

      {/* ── Delete confirmation ── */}
      {confirmDel && (
        <div className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
            <p className="font-bold text-foreground text-base">Supprimer cette charge ?</p>
            <p className="text-sm text-muted-foreground">
              « <span className="font-semibold text-foreground">{confirmDel.name}</span> » sera supprimée définitivement.
            </p>
            <div className="flex gap-2">
              <button
                data-testid="button-delete-cancel"
                onClick={() => setConfirmDel(null)}
                className="flex-1 min-h-[44px] rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
              >
                Annuler
              </button>
              <button
                data-testid="button-delete-confirm"
                onClick={() => handleDelete(confirmDel)}
                className="flex-1 min-h-[44px] rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
