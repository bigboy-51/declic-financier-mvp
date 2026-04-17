import { useState } from 'react';
import { TrendingDown, Wallet, CreditCard, Receipt, ShoppingCart, PiggyBank, Landmark, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Income } from '@/types/finance';

interface DashboardProps {
  totalIncome: number;
  totalCredits: number;
  totalExpenses: number;
  groceryBudget: number;
  surplus: number;
  startingBalance: number;
  incomes: Income[];
  projection: { month: number; debt: number; treasury: number }[];
  onUpdateIncome: (id: string, updates: { amount?: number; receiptDate?: number }) => void;
  onUpdateStartingBalance: (amount: number) => void;
}

export function Dashboard({
  totalIncome,
  totalCredits,
  totalExpenses,
  groceryBudget,
  surplus,
  startingBalance,
  incomes,
  projection,
  onUpdateIncome,
  onUpdateStartingBalance,
}: DashboardProps) {
  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceValue, setBalanceValue] = useState(startingBalance);
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [incomeValue, setIncomeValue] = useState(0);
  const [receiptDateValue, setReceiptDateValue] = useState<number>(1);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const handleBalanceSave = () => {
    onUpdateStartingBalance(balanceValue);
    setEditingBalance(false);
  };

  const handleIncomeSave = (id: string) => {
    onUpdateIncome(id, { amount: incomeValue, receiptDate: receiptDateValue });
    setEditingIncomeId(null);
  };

  const startEditingIncome = (income: Income) => {
    setEditingIncomeId(income.id);
    setIncomeValue(income.amount);
    setReceiptDateValue(income.receiptDate ?? 1);
  };

  // Get projected treasury at month 24 (or last month)
  const projectedTreasury = projection[projection.length - 1]?.treasury ?? 0;

  return (
    <div className="space-y-6 pb-6">
      {/* Citation */}
      <div className="card-finance bg-gradient-to-r from-primary/10 to-secondary/10 border-l-4 border-primary">
        <p className="text-sm text-foreground/80 italic">
          📖 "Le sage prévoit tout, l'insensé improvise."
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Starting Balance - Editable */}
        <div className="card-finance col-span-2 border-l-4 border-secondary">
          <div className="flex items-center gap-3">
            <Landmark className="w-5 h-5 text-secondary" />
            <div className="flex-1">
              <p className="stat-label">Solde de départ du compte joint</p>
              {editingBalance ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={balanceValue}
                    onChange={(e) => setBalanceValue(Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    autoFocus
                    className="w-32 px-2 py-1 rounded bg-muted text-lg font-semibold"
                  />
                  <button onClick={handleBalanceSave} className="text-primary text-sm font-medium">
                    OK
                  </button>
                </div>
              ) : (
                <p 
                  className={`text-lg font-semibold cursor-pointer ${startingBalance >= 0 ? 'text-success' : 'text-destructive'}`}
                  onClick={() => { setBalanceValue(startingBalance); setEditingBalance(true); }}
                >
                  {formatCurrency(startingBalance)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Incomes - Editable */}
        {incomes.map((income) => (
          <div key={income.id} className="card-finance" data-testid={`card-income-${income.id}`}>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <p className="stat-label">{income.name}</p>
            {editingIncomeId === income.id ? (
              <div className="space-y-2 mt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={incomeValue}
                    onChange={(e) => setIncomeValue(Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    autoFocus
                    className="w-24 px-2 py-1 rounded bg-muted text-lg font-semibold"
                    data-testid={`input-income-amount-${income.id}`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Jour de reception:</span>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={receiptDateValue}
                    onChange={(e) => setReceiptDateValue(Math.min(31, Math.max(1, Number(e.target.value))))}
                    className="w-16 px-2 py-1 rounded bg-muted text-sm font-semibold"
                    data-testid={`input-income-date-${income.id}`}
                  />
                </div>
                <button onClick={() => handleIncomeSave(income.id)} className="text-primary text-sm font-medium" data-testid={`button-save-income-${income.id}`}>
                  OK
                </button>
              </div>
            ) : (
              <div
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => startEditingIncome(income)}
              >
                <p className="stat-value text-lg">
                  {formatCurrency(income.amount)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {income.receiptDate ? `Recu le ${income.receiptDate} du mois` : "Jour de reception non defini"}
                </p>
              </div>
            )}
          </div>
        ))}

        <StatCard
          icon={<CreditCard className="w-5 h-5 text-secondary" />}
          label="Total crédits"
          value={formatCurrency(totalCredits)}
          variant="default"
        />
        <StatCard
          icon={<Receipt className="w-5 h-5 text-muted-foreground" />}
          label="Charges variables"
          value={formatCurrency(totalExpenses)}
          variant="default"
        />
        <StatCard
          icon={<ShoppingCart className="w-5 h-5 text-muted-foreground" />}
          label="Budget courses"
          value={formatCurrency(groceryBudget)}
          variant="default"
        />
      </div>

      {/* Surplus */}
      <div className="card-finance">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${surplus >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
            <PiggyBank className={`w-6 h-6 ${surplus >= 0 ? 'text-success' : 'text-destructive'}`} />
          </div>
          <div>
            <p className="stat-label">Surplus mensuel disponible</p>
            <p className={`text-2xl font-bold ${surplus >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(surplus)}
            </p>
          </div>
        </div>
      </div>

      {/* Projected Treasury */}
      <div className="card-finance">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${projectedTreasury >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
            <TrendingUp className={`w-6 h-6 ${projectedTreasury >= 0 ? 'text-success' : 'text-destructive'}`} />
          </div>
          <div>
            <p className="stat-label">Trésorerie projetée (mois {projection.length - 1})</p>
            <p className={`text-2xl font-bold ${projectedTreasury >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(projectedTreasury)}
            </p>
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="card-finance">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Projection sur 24 mois</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projection}>
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `M${value}`}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatCurrency(value), 
                  name === 'debt' ? 'Dette restante' : 'Trésorerie'
                ]}
                labelFormatter={(label) => `Mois ${label}`}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid hsl(var(--border))',
                  boxShadow: 'var(--shadow-card)'
                }}
              />
              <Legend 
                formatter={(value) => value === 'debt' ? 'Dette' : 'Trésorerie'}
              />
              <Line 
                type="monotone" 
                dataKey="debt" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="treasury" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Évolution des dettes et de la trésorerie avec la méthode Snowball
        </p>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  variant?: 'default' | 'success' | 'danger';
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="card-finance">
      <div className="flex items-center gap-2 mb-2">
        {icon}
      </div>
      <p className="stat-label">{label}</p>
      <p className="stat-value text-lg">{value}</p>
    </div>
  );
}
