import { useState } from 'react';
import { Plus, Trash2, CreditCard as CreditCardIcon, Lock, Unlock, Play, CheckCircle2, Edit2 } from 'lucide-react';
import { Credit } from '@/types/finance';

interface CreditsProps {
  credits: Credit[];
  totalCredits: number;
  creditsLocked: boolean;
  lastPaymentMonth?: string;
  onUpdateCredit: (id: string, updates: Partial<Credit>) => void;
  onDeleteCredit: (id: string) => void;
  onAddCredit: (credit: Omit<Credit, 'id'>) => void;
  onToggleCreditsLock: () => void;
  onApplyMonthlyPayment: () => void;
}

export function Credits({
  credits,
  totalCredits,
  creditsLocked,
  lastPaymentMonth,
  onUpdateCredit,
  onDeleteCredit,
  onAddCredit,
  onToggleCreditsLock,
  onApplyMonthlyPayment,
}: CreditsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCredit, setNewCredit] = useState({
    name: '',
    monthlyPayment: 0,
    remainingAmount: 0,
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const alreadyPaidThisMonth = lastPaymentMonth === currentMonth;

  const handleAdd = () => {
    if (newCredit.name && newCredit.monthlyPayment > 0) {
      onAddCredit({
        ...newCredit,
        initialAmount: newCredit.remainingAmount,
      });
      setNewCredit({ name: '', monthlyPayment: 0, remainingAmount: 0 });
      setIsAdding(false);
    }
  };

  const activeCredits = credits.filter(c => !c.settled);
  const settledCredits = credits.filter(c => c.settled);

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="card-finance bg-gradient-to-r from-secondary/10 to-primary/10">
        <div className="flex items-center gap-3">
          <CreditCardIcon className="w-6 h-6 text-secondary" />
          <div>
            <p className="stat-label">Total mensualités crédits</p>
            <p className="stat-value">{formatCurrency(totalCredits)}</p>
          </div>
        </div>
      </div>

      {/* Lock Toggle */}
      <div className="flex items-center justify-between card-finance">
        <div className="flex items-center gap-2 text-sm">
          {creditsLocked ? <Lock className="w-4 h-4 text-primary" /> : <Unlock className="w-4 h-4 text-muted-foreground" />}
          <span className="font-medium">🔒 Verrouiller les montants</span>
        </div>
        <button
          onClick={onToggleCreditsLock}
          className={`relative w-11 h-6 rounded-full transition-colors ${creditsLocked ? 'bg-primary' : 'bg-muted'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full shadow transition-transform ${creditsLocked ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      {/* Apply Monthly Payment */}
      <div className="card-finance">
        {alreadyPaidThisMonth ? (
          <div className="flex items-center gap-2 text-sm md:text-base text-primary min-h-[48px]">
            <CheckCircle2 className="w-5 h-5" />
            <span>Paiement déjà appliqué ce mois-ci</span>
          </div>
        ) : (
          <button
            onClick={onApplyMonthlyPayment}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground min-h-[48px] py-3 rounded-lg font-medium text-base transition-colors hover:opacity-90"
            data-testid="button-apply-payment"
          >
            <Play className="w-5 h-5" />
            Appliquer paiement mensuel
          </button>
        )}
      </div>

      {/* Active Credits List */}
      <div className="space-y-3">
        {activeCredits.map((credit) => (
          <CreditItem
            key={credit.id}
            credit={credit}
            locked={creditsLocked}
            onUpdate={onUpdateCredit}
            onDelete={onDeleteCredit}
          />
        ))}
      </div>

      {/* Settled Credits */}
      {settledCredits.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Crédits soldés</p>
          {settledCredits.map((credit) => (
            <div key={credit.id} className="card-finance opacity-60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="font-medium line-through">{credit.name}</span>
                </div>
                <span className="text-xs text-primary font-medium">Soldé</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Credit */}
      {isAdding ? (
        <div className="card-finance space-y-3">
          <input
            type="text"
            placeholder="Nom du crédit"
            value={newCredit.name}
            onChange={(e) => setNewCredit({ ...newCredit, name: e.target.value })}
            className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-muted border-0 focus:ring-2 focus:ring-primary outline-none text-base"
            data-testid="input-new-credit-name"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs md:text-sm text-muted-foreground">Mensualité (€)</label>
              <input
                type="number"
                value={newCredit.monthlyPayment || ''}
                onChange={(e) => setNewCredit({ ...newCredit, monthlyPayment: Number(e.target.value) })}
                className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-muted border-0 focus:ring-2 focus:ring-primary outline-none text-base"
                data-testid="input-new-credit-payment"
              />
            </div>
            <div>
              <label className="text-xs md:text-sm text-muted-foreground">Montant restant (€)</label>
              <input
                type="number"
                value={newCredit.remainingAmount || ''}
                onChange={(e) => setNewCredit({ ...newCredit, remainingAmount: Number(e.target.value) })}
                className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-muted border-0 focus:ring-2 focus:ring-primary outline-none text-base"
                data-testid="input-new-credit-remaining"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 min-h-[48px] bg-primary text-primary-foreground py-3 rounded-lg font-medium text-base" data-testid="button-add-credit-confirm">
              Ajouter
            </button>
            <button onClick={() => setIsAdding(false)} className="flex-1 min-h-[48px] bg-muted py-3 rounded-lg font-medium text-base" data-testid="button-add-credit-cancel">
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsAdding(true)} className="btn-add w-full justify-center" data-testid="button-add-credit">
          <Plus className="w-5 h-5" />
          Ajouter un crédit
        </button>
      )}
    </div>
  );
}

interface CreditItemProps {
  credit: Credit;
  locked: boolean;
  onUpdate: (id: string, updates: Partial<Credit>) => void;
  onDelete: (id: string) => void;
}

function CreditItem({ credit, locked, onUpdate, onDelete }: CreditItemProps) {
  const [editingRemaining, setEditingRemaining] = useState(false);
  const [newRemaining, setNewRemaining] = useState(credit.remainingAmount);
  const [showConfirm, setShowConfirm] = useState(false);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const progress = credit.initialAmount > 0
    ? ((credit.initialAmount - credit.remainingAmount) / credit.initialAmount) * 100
    : 0;

  const handleChangeMonthly = (value: number) => {
    onUpdate(credit.id, { monthlyPayment: Math.max(0, value) });
  };

  const handleEditRemaining = () => {
    setNewRemaining(credit.remainingAmount);
    setEditingRemaining(true);
  };

  const handleConfirmRemaining = () => {
    // Validation
    if (newRemaining <= 0) {
      alert('Le montant doit être supérieur à 0€. Utilisez "Rembourser intégralement" si c\'est réglé.');
      return;
    }
    setShowConfirm(true);
  };

  const handleSaveRemaining = () => {
    onUpdate(credit.id, { remainingAmount: newRemaining });
    setEditingRemaining(false);
    setShowConfirm(false);
  };

  return (
    <div className="card-finance">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium">{credit.name}</h4>
        <button onClick={() => onDelete(credit.id)} className="btn-delete" data-testid={`button-delete-${credit.id}`}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs md:text-sm text-muted-foreground">Mensualité</label>
          {locked ? (
            <p className="text-sm md:text-base font-medium mt-0.5">{formatCurrency(credit.monthlyPayment)}</p>
          ) : (
            <input
              type="number"
              value={credit.monthlyPayment}
              onChange={(e) => handleChangeMonthly(Number(e.target.value))}
              onFocus={(e) => e.target.select()}
              className="w-full min-h-[44px] px-3 py-2 rounded bg-muted text-base"
              data-testid={`input-monthly-${credit.id}`}
            />
          )}
        </div>
        <div>
          <label className="text-xs md:text-sm text-muted-foreground">Restant</label>
          {editingRemaining ? (
            <div className="flex gap-1 mt-0.5">
              <input
                type="number"
                value={newRemaining}
                onChange={(e) => setNewRemaining(Math.max(0, Number(e.target.value)))}
                autoFocus
                onFocus={(e) => e.target.select()}
                className="flex-1 min-h-[44px] px-3 py-2 rounded bg-muted text-base"
                data-testid={`input-remaining-${credit.id}`}
              />
              <button
                onClick={handleConfirmRemaining}
                className="min-h-[44px] px-3 bg-primary text-primary-foreground rounded font-medium text-sm"
                data-testid={`button-save-${credit.id}`}
              >
                ✓
              </button>
              <button
                onClick={() => setEditingRemaining(false)}
                className="min-h-[44px] px-3 bg-muted rounded font-medium text-sm"
                data-testid={`button-cancel-${credit.id}`}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-sm md:text-base font-medium">{formatCurrency(credit.remainingAmount)}</p>
              <button
                onClick={handleEditRemaining}
                className="p-1.5 hover:bg-muted rounded transition-colors"
                title="Modifier le montant restant"
                data-testid={`button-edit-${credit.id}`}
              >
                <Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-xl p-6 max-w-sm w-full shadow-lg">
            <h3 className="font-semibold text-lg mb-2">Modifier le montant restant</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Êtes-vous sûr de vouloir modifier le montant restant de <span className="font-medium text-foreground">{credit.name}</span> de <span className="font-medium text-foreground">{formatCurrency(credit.remainingAmount)}</span> à <span className="font-medium text-foreground">{formatCurrency(newRemaining)}</span> ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 min-h-[48px] py-3 px-4 rounded-lg bg-muted font-medium text-base"
                data-testid="button-cancel-confirm"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveRemaining}
                className="flex-1 min-h-[48px] py-3 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-base"
                data-testid="button-confirm-save"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
      <div className="flex items-center justify-between mt-1">
        <button
          onClick={() => onUpdate(credit.id, { remainingAmount: 0, settled: true })}
          className="text-xs text-destructive hover:opacity-80 font-medium"
          data-testid={`button-payoff-${credit.id}`}
        >
          Rembourser intégralement
        </button>
        <p className="text-xs text-muted-foreground">
          {progress.toFixed(0)}% remboursé
        </p>
      </div>
    </div>
  );
}
