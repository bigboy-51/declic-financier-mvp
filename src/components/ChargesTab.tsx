import { useState, useRef, useEffect, useCallback } from "react";
import { ref, set, remove, get, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { CHARGE_CATEGORIES } from "@/constants/chargeCategories";
import { useChargesData, FlatCharge } from "@/hooks/useChargesData";
import { useChargesSummary } from "@/hooks/useChargesSummary";
import { ChargesRecap } from "@/components/ChargesRecap";
import { DEFAULT_CHARGES } from "@/data/defaultCharges";
import { Plus, Trash2, ChevronDown, ChevronUp, Lock, LockOpen, Download } from "lucide-react";

function fmt(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface AddChargeModalProps {
  categoryId: string;
  categoryName: string;
  onSave: (categoryId: string, name: string, prevu: number, reel: number) => void;
  onClose: () => void;
}

function AddChargeModal({ categoryId, categoryName, onSave, onClose }: AddChargeModalProps) {
  const [name, setName] = useState("");
  const [prevu, setPrevu] = useState("");
  const [reel, setReel] = useState("");

  const restant = (parseFloat(prevu) || 0) - (parseFloat(reel) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(categoryId, name.trim(), parseFloat(prevu) || 0, parseFloat(reel) || 0);
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Prévu (€)</label>
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
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Réel (€)</label>
              <input
                data-testid="input-add-charge-reel"
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="0,00"
                value={reel}
                onChange={(e) => setReel(e.target.value)}
              />
            </div>
          </div>
          <div className="px-3 py-2 rounded-lg bg-muted/40 border border-border/40">
            <span className="text-xs text-muted-foreground">Restant : </span>
            <span className={`text-sm font-semibold ${restant > 0 ? "text-emerald-600 dark:text-emerald-400" : restant < 0 ? "text-red-500" : "text-muted-foreground"}`}>
              {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(restant)}
            </span>
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
  globalLocked: boolean;
  onUpdateReel: (charge: FlatCharge, value: number) => void;
  onDelete: (charge: FlatCharge) => void;
}

function ChargeRow({ charge, globalLocked, onUpdateReel, onDelete }: ChargeRowProps) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(String(charge.reel));
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = () => {
    if (globalLocked) return;
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

  const restant = charge.prevu - charge.reel;
  const over = charge.reel > charge.prevu && charge.prevu > 0;

  return (
    <li
      className="grid items-center gap-1 px-3 py-2 hover:bg-muted/30 transition-colors border-b border-border/40 last:border-0"
      style={{ gridTemplateColumns: "1fr 72px 88px 72px 32px" }}
      data-testid={`row-charge-${charge.id}`}
    >
      <span className="text-sm text-foreground font-medium truncate pr-1">{charge.name}</span>
      <span className="text-xs text-right text-muted-foreground font-medium tabular-nums">{fmt(charge.prevu)}</span>

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
          onClick={handleStartEdit}
          disabled={globalLocked}
          data-testid={`button-reel-${charge.id}`}
          className={`text-right text-sm font-semibold tabular-nums px-2 py-1 rounded-lg transition-colors w-full ${
            globalLocked
              ? "text-foreground cursor-default"
              : charge.reel > 0
              ? "text-foreground hover:bg-primary/10 cursor-pointer"
              : "text-muted-foreground hover:bg-primary/10 cursor-pointer"
          }`}
        >
          {fmt(charge.reel)}
        </button>
      )}

      <span className={`text-xs text-right font-semibold tabular-nums ${over ? "text-red-500" : restant > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
        {fmt(restant)}
      </span>

      {!charge.locked && !globalLocked ? (
        <button
          data-testid={`button-delete-${charge.id}`}
          onClick={() => onDelete(charge)}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors ml-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ) : (
        <span />
      )}
    </li>
  );
}

interface CategorySectionProps {
  categoryId: string;
  name: string;
  icon: string;
  charges: FlatCharge[];
  globalLocked: boolean;
  onUpdateReel: (charge: FlatCharge, value: number) => void;
  onAddCharge: (categoryId: string) => void;
  onDelete: (charge: FlatCharge) => void;
}

function CategorySection({ categoryId, name, icon, charges, globalLocked, onUpdateReel, onAddCharge, onDelete }: CategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  const prevu   = charges.reduce((s, c) => s + c.prevu, 0);
  const reel    = charges.reduce((s, c) => s + c.reel,  0);
  const restant = prevu - reel;
  const over    = reel > prevu && prevu > 0;
  const sorted  = [...charges].sort((a, b) => a.name.localeCompare(b.name, "fr"));

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden" data-testid={`section-category-${categoryId}`}>
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
                {fmt(reel)} / {fmt(prevu)}
              </span>
              {" · "}
              <span className={`text-xs font-semibold ${over ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                {fmt(restant)}
              </span>
            </div>
          )}
          {collapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {!collapsed && (
        <>
          {sorted.length > 0 && (
            <div className="grid px-3 py-1.5 bg-muted/40 border-y border-border/40" style={{ gridTemplateColumns: "1fr 72px 88px 72px 32px" }}>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Charge</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Prévu</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right">
                Réel {globalLocked ? "🔒" : "✏️"}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Restant</span>
              <span />
            </div>
          )}
          <ul>
            {sorted.length === 0 ? (
              <li className="px-4 py-3 text-xs text-muted-foreground italic">
                Aucune charge — cliquez sur + pour en ajouter.
              </li>
            ) : (
              sorted.map((c) => (
                <ChargeRow key={c.id} charge={c} globalLocked={globalLocked} onUpdateReel={onUpdateReel} onDelete={onDelete} />
              ))
            )}
          </ul>
          {!globalLocked && (
            <div className="px-4 py-2.5 border-t border-border/40">
              <button
                data-testid={`button-add-charge-${categoryId}`}
                onClick={() => onAddCharge(categoryId)}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors min-h-[32px]"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter une charge
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ChargesTab() {
  const { user } = useAuth();
  const { charges, loading } = useChargesData();
  const [addModal, setAddModal] = useState<{ categoryId: string; categoryName: string } | null>(null);
  const [confirmDel, setConfirmDel] = useState<FlatCharge | null>(null);
  const [globalLocked, setGlobalLocked] = useState(false);
  const [lockLoading, setLockLoading] = useState(true);
  const [seedConfirm, setSeedConfirm] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!user) { setLockLoading(false); return; }
    get(ref(db, `users/${user.uid}/settings/chargesLocked`)).then((snap) => {
      setGlobalLocked(snap.val() === true);
      setLockLoading(false);
    }).catch(() => setLockLoading(false));
  }, [user]);

  const toggleGlobalLock = useCallback(async () => {
    if (!user) return;
    const next = !globalLocked;
    setGlobalLocked(next);
    await set(ref(db, `users/${user.uid}/settings/chargesLocked`), next);
  }, [user, globalLocked]);

  const handleUpdateReel = async (charge: FlatCharge, newReel: number) => {
    if (!user || globalLocked) return;
    const montantRestant = parseFloat((charge.prevu - newReel).toFixed(2));
    const path = `users/${user.uid}/charges/${charge.categoryId}/rubriques/${charge.id}`;
    await set(ref(db, `${path}/reel`), parseFloat(newReel.toFixed(2)));
    await set(ref(db, `${path}/restant`), montantRestant);
    await set(ref(db, `${path}/updatedAt`), new Date().toISOString());
  };

  const handleAddCharge = async (categoryId: string, name: string, prevu: number, reel: number) => {
    if (!user) return;
    const id = generateId();
    const now = new Date().toISOString();
    const restant = parseFloat((prevu - reel).toFixed(2));
    await set(ref(db, `users/${user.uid}/charges/${categoryId}/rubriques/${id}`), {
      name, prevu, reel, restant, locked: false, createdAt: now, updatedAt: now,
    });
  };

  const handleDelete = async (charge: FlatCharge) => {
    if (!user) return;
    await remove(ref(db, `users/${user.uid}/charges/${charge.categoryId}/rubriques/${charge.id}`));
    setConfirmDel(null);
  };

  const handleSeedCharges = async () => {
    if (!user) return;
    setSeeding(true);
    const now = new Date().toISOString();
    const writes = DEFAULT_CHARGES.map((c) => {
      const id = generateId();
      return set(ref(db, `users/${user.uid}/charges/${c.categoryId}/rubriques/${id}`), {
        name: c.name, prevu: c.prevu, reel: 0, restant: c.prevu, locked: true, createdAt: now, updatedAt: now,
      });
    });
    await Promise.all(writes);
    setSeeding(false);
    setSeedConfirm(false);
  };

  const summaryInput = charges.map((c) => ({
    id: c.id, name: c.name, montantPrevu: c.prevu, montantReel: c.reel, montantRestant: c.restant, custom: !c.locked,
  }));
  const { totalPrevu, totalReel, totalRestant } = useChargesSummary(summaryInput);

  if (loading || lockLoading) {
    return (
      <div className="px-4 py-10 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-3 max-w-lg mx-auto w-full">

      {/* Actions bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setSeedConfirm(true)}
          className="flex items-center gap-1.5 min-h-[36px] px-3 rounded-xl border border-dashed border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-sky-400/50 transition-colors"
          data-testid="button-seed-charges"
        >
          <Download className="w-3.5 h-3.5" /> Charger charges types
        </button>
        <button
          onClick={toggleGlobalLock}
          data-testid="button-global-lock"
          className={`flex items-center gap-1.5 min-h-[36px] px-3 rounded-xl border text-xs font-semibold transition-colors ${
            globalLocked
              ? "border-amber-400/50 bg-amber-400/10 text-amber-600 dark:text-amber-400 hover:bg-amber-400/20"
              : "border-border text-muted-foreground hover:text-foreground hover:border-amber-400/50"
          }`}
        >
          {globalLocked ? <><Lock className="w-3.5 h-3.5" /> Déverrouiller</> : <><LockOpen className="w-3.5 h-3.5" /> Verrouiller</>}
        </button>
      </div>

      {globalLocked && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-xs text-amber-700 dark:text-amber-300">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>Charges verrouillées — déverrouiller pour modifier les montants réels.</span>
        </div>
      )}

      <div data-testid="charges-recap">
        <ChargesRecap totalPrevu={totalPrevu} totalReel={totalReel} totalRestant={totalRestant} />
      </div>

      {CHARGE_CATEGORIES.map((cat) => {
        const catCharges = charges.filter((c) => c.categoryId === cat.id);
        return (
          <CategorySection
            key={cat.id}
            categoryId={cat.id}
            name={cat.name}
            icon={cat.icon}
            charges={catCharges}
            globalLocked={globalLocked}
            onUpdateReel={handleUpdateReel}
            onAddCharge={(catId) => setAddModal({ categoryId: catId, categoryName: `${cat.icon} ${cat.name}` })}
            onDelete={(charge) => setConfirmDel(charge)}
          />
        );
      })}

      {addModal && (
        <AddChargeModal
          categoryId={addModal.categoryId}
          categoryName={addModal.categoryName}
          onSave={handleAddCharge}
          onClose={() => setAddModal(null)}
        />
      )}

      {confirmDel && (
        <div className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
            <p className="font-bold text-foreground text-base">Supprimer cette charge ?</p>
            <p className="text-sm text-muted-foreground">
              « <span className="font-semibold text-foreground">{confirmDel.name}</span> » sera supprimée définitivement.
            </p>
            <div className="flex gap-2">
              <button data-testid="button-delete-cancel" onClick={() => setConfirmDel(null)}
                className="flex-1 min-h-[44px] rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
                Annuler
              </button>
              <button data-testid="button-delete-confirm" onClick={() => handleDelete(confirmDel)}
                className="flex-1 min-h-[44px] rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {seedConfirm && (
        <div className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
            <p className="font-bold text-foreground text-base">Charger des charges types ?</p>
            <p className="text-sm text-muted-foreground">
              22 charges prédéfinies seront ajoutées (loyer, abonnements, transport…). Vous pourrez les modifier ou supprimer ensuite.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setSeedConfirm(false)} disabled={seeding}
                className="flex-1 min-h-[44px] rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
                Annuler
              </button>
              <button onClick={handleSeedCharges} disabled={seeding}
                className="flex-1 min-h-[44px] rounded-xl bg-sky-400 hover:bg-sky-500 text-white text-sm font-bold transition-colors disabled:opacity-50">
                {seeding ? "Chargement…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
