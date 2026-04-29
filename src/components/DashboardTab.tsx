import { useState } from "react";
import { TrendingUp, Wallet, ShoppingCart, CreditCard, Pencil, Check, X, Plus, Trash2, CalendarCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useFinances } from "@/hooks/useFinances";
import { useChargesData } from "@/hooks/useChargesData";
import { useCourses } from "@/hooks/useCourses";
import { getProfile } from "@/lib/profiles";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

function BalanceCard({
  balance,
  startingBalance,
  onEditBalance,
}: {
  balance: number;
  startingBalance: number;
  onEditBalance: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(startingBalance));

  const handleSave = () => {
    const n = parseFloat(val);
    if (!isNaN(n)) onEditBalance(n);
    setEditing(false);
  };

  const isNeg = balance < 0;
  const gradientClass = isNeg
    ? "balance-negative"
    : balance < 200
    ? "balance-warning"
    : "balance-positive";

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-3" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted-foreground">Solde disponible estimé</p>
        <Wallet className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className={`text-4xl font-black tabular-nums ${gradientClass}`}>{fmt(balance)}</p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Solde initial :</span>
        {editing ? (
          <span className="flex items-center gap-1">
            <input
              autoFocus
              type="number"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
              className="w-24 px-2 py-1 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
            <button onClick={handleSave} className="text-emerald-500 hover:text-emerald-600"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
          </span>
        ) : (
          <span className="flex items-center gap-1 font-semibold text-foreground">
            {fmt(startingBalance)}
            <button onClick={() => { setVal(String(startingBalance)); setEditing(true); }} className="text-muted-foreground hover:text-foreground ml-1">
              <Pencil className="w-3 h-3" />
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

function BreakdownRow({ icon, label, value, color = "" }: { icon: React.ReactNode; label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-2 text-sm text-foreground">
        {icon}
        {label}
      </div>
      <span className={`text-sm font-semibold tabular-nums ${color}`}>{fmt(value)}</span>
    </div>
  );
}

interface IncomeRowProps {
  id: string;
  name: string;
  amount: number;
  receiptDay: number;
  receivedDate: string | null;
  onToggleReceived: (id: string, date: string | null) => void;
  onDelete: (id: string) => void;
}

function IncomeRow({ id, name, amount, receiptDay, receivedDate, onToggleReceived, onDelete }: IncomeRowProps) {
  const received = !!receivedDate;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0">
      <button
        onClick={() => onToggleReceived(id, received ? null : new Date().toISOString().split("T")[0])}
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          received ? "border-emerald-500 bg-emerald-500 text-white" : "border-border text-transparent"
        }`}
      >
        <Check className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${received ? "text-muted-foreground line-through" : "text-foreground"}`}>{name}</p>
        <p className="text-xs text-muted-foreground">Attendu le {receiptDay}</p>
      </div>
      <span className={`text-sm font-bold tabular-nums ${received ? "text-emerald-500" : "text-foreground"}`}>{fmt(amount)}</span>
      <button onClick={() => onDelete(id)} className="text-muted-foreground hover:text-red-500 transition-colors">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function AddIncomeModal({ onSave, onClose }: { onSave: (n: string, a: number, d: number) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("5");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    onSave(name.trim(), parseFloat(amount), parseInt(day) || 1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
        <h2 className="font-bold text-foreground">Ajouter un revenu</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Nom</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Salaire, APL…"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400/40" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Montant (€)</label>
              <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400/40" />
            </div>
            <div className="w-24">
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Jour du mois</label>
              <input type="number" min="1" max="31" value={day} onChange={(e) => setDay(e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-sky-400/40" />
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

export default function DashboardTab() {
  const { userProfile } = useAuth();
  const { finances, incomes, loading: finLoading, totalExpected, totalReceived, markReceived, deleteIncome, addIncome, updateStartingBalance } = useFinances();
  const { summary: chargesSummary, loading: chargesLoading } = useChargesData();
  const { totalCurrentMonth, loading: coursesLoading } = useCourses();
  const [showAddIncome, setShowAddIncome] = useState(false);

  const profile = getProfile(userProfile.financialProfile);

  const solde = finances.startingBalance + totalReceived - chargesSummary.totalReel - totalCurrentMonth;

  if (finLoading || chargesLoading || coursesLoading) {
    return (
      <div className="px-4 py-10 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 max-w-lg mx-auto w-full">

      {/* Profile banner */}
      {userProfile.financialProfile && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sky-400/8 border border-sky-400/20">
          <span className="text-2xl">{profile.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">{profile.name}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.tip}</p>
          </div>
        </div>
      )}

      {/* Balance card */}
      <BalanceCard
        balance={solde}
        startingBalance={finances.startingBalance}
        onEditBalance={updateStartingBalance}
      />

      {/* Breakdown */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Décomposition</p>
        <BreakdownRow icon={<TrendingUp className="w-4 h-4 text-emerald-500" />} label="Revenus reçus" value={totalReceived} color="text-emerald-500" />
        <BreakdownRow icon={<CreditCard className="w-4 h-4 text-amber-500" />} label="Charges réelles" value={chargesSummary.totalReel} color="text-amber-500" />
        <BreakdownRow icon={<ShoppingCart className="w-4 h-4 text-orange-500" />} label="Courses du mois" value={totalCurrentMonth} color="text-orange-500" />
      </div>

      {/* Incomes section */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-sky-400" />
            <p className="text-sm font-bold text-foreground">Revenus du mois</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {fmt(totalReceived)} / {fmt(totalExpected)}
            </span>
            <button onClick={() => setShowAddIncome(true)}
              className="w-7 h-7 rounded-lg bg-sky-400/15 text-sky-400 flex items-center justify-center hover:bg-sky-400/25 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {incomes.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">Aucun revenu configuré</p>
            <button onClick={() => setShowAddIncome(true)}
              className="mt-2 text-sm text-sky-400 hover:text-sky-500 font-semibold">
              + Ajouter un revenu
            </button>
          </div>
        ) : (
          <div className="px-4">
            {incomes.map((inc) => (
              <IncomeRow
                key={inc.id}
                {...inc}
                onToggleReceived={markReceived}
                onDelete={deleteIncome}
              />
            ))}
          </div>
        )}
      </div>

      {showAddIncome && (
        <AddIncomeModal
          onSave={addIncome}
          onClose={() => setShowAddIncome(false)}
        />
      )}
    </div>
  );
}
