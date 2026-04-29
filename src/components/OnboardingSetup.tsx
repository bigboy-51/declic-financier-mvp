import { useState } from "react";
import { ChevronRight, User, Wallet, TrendingUp, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useFinances } from "@/hooks/useFinances";
import { DEMO_STARTING_BALANCE, DEMO_INCOMES } from "@/data/defaultCharges";
import { push, ref } from "firebase/database";
import { db } from "@/lib/firebase";

type Step = "name" | "balance" | "income";

export function OnboardingSetup() {
  const { user, saveOnboarding } = useAuth();
  const { addIncome } = useFinances();

  const [step, setStep] = useState<Step>("name");
  const [memberName, setMemberName] = useState("");
  const [balance, setBalance] = useState("");
  const [saving, setSaving] = useState(false);

  const [incomes, setIncomes] = useState<Array<{ name: string; amount: string; receiptDay: string }>>([
    { name: "Salaire", amount: "", receiptDay: "5" },
  ]);

  const handleNameNext = () => {
    if (!memberName.trim()) return;
    setStep("balance");
  };

  const handleBalanceNext = () => {
    setStep("income");
  };

  const handleLoadDemo = () => {
    setBalance(String(DEMO_STARTING_BALANCE));
    setIncomes(DEMO_INCOMES.map((i) => ({ name: i.name, amount: String(i.amount), receiptDay: String(i.receiptDay) })));
  };

  const addIncomeRow = () => {
    setIncomes((prev) => [...prev, { name: "", amount: "", receiptDay: "1" }]);
  };

  const removeIncomeRow = (idx: number) => {
    setIncomes((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateIncomeRow = (idx: number, field: "name" | "amount" | "receiptDay", value: string) => {
    setIncomes((prev) => prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  };

  const handleFinish = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      const startingBalance = parseFloat(balance) || 0;
      await saveOnboarding(memberName.trim(), startingBalance);

      const validIncomes = incomes.filter((i) => i.name.trim() && parseFloat(i.amount) > 0);
      await Promise.all(
        validIncomes.map((i) =>
          push(ref(db, `users/${user.uid}/incomes`), {
            name: i.name.trim(),
            amount: parseFloat(i.amount),
            receiptDay: parseInt(i.receiptDay) || 1,
            receivedDate: null,
            createdAt: new Date().toISOString(),
          })
        )
      );
    } catch (err) {
      console.error("Onboarding error:", err);
      setSaving(false);
    }
  };

  const steps: Step[] = ["name", "balance", "income"];
  const stepIdx = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                i < stepIdx ? "bg-sky-400 text-white" :
                i === stepIdx ? "bg-sky-400 text-white" :
                "bg-muted text-muted-foreground"
              }`}>
                {i < stepIdx ? "✓" : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 flex-1 rounded transition-colors ${i < stepIdx ? "bg-sky-400" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step: Name */}
        {step === "name" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-400/15 flex items-center justify-center">
                <User className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-foreground">Bienvenue !</h1>
                <p className="text-sm text-muted-foreground">Comment on vous appelle ?</p>
              </div>
            </div>

            <input
              autoFocus
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNameNext()}
              placeholder="Votre prénom"
              className="w-full min-h-[52px] px-4 rounded-xl border-2 border-border bg-card text-foreground text-base focus:outline-none focus:border-sky-400 transition-colors"
            />

            <button
              onClick={handleNameNext}
              disabled={!memberName.trim()}
              className="w-full min-h-[52px] rounded-xl bg-sky-400 hover:bg-sky-500 text-white font-bold text-base transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              Continuer <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step: Balance */}
        {step === "balance" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-400/15 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-foreground">Solde de départ</h1>
                <p className="text-sm text-muted-foreground">Combien avez-vous en ce moment ?</p>
              </div>
            </div>

            <div className="relative">
              <input
                autoFocus
                type="number"
                min="0"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBalanceNext()}
                placeholder="0"
                className="w-full min-h-[52px] px-4 pr-10 rounded-xl border-2 border-border bg-card text-foreground text-base focus:outline-none focus:border-sky-400 transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">€</span>
            </div>

            <button
              type="button"
              onClick={handleLoadDemo}
              className="w-full min-h-[44px] rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-sky-400/50 transition-colors"
            >
              Charger des données démo (500 € / salaire 2 800 €)
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("name")}
                className="min-h-[52px] px-4 rounded-xl border-2 border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
              >
                Retour
              </button>
              <button
                onClick={handleBalanceNext}
                className="flex-1 min-h-[52px] rounded-xl bg-sky-400 hover:bg-sky-500 text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
              >
                Continuer <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step: Income */}
        {step === "income" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-400/15 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-foreground">Vos revenus</h1>
                <p className="text-sm text-muted-foreground">Salaire, APL, freelance… (modifiable après)</p>
              </div>
            </div>

            <div className="space-y-3">
              {incomes.map((row, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    value={row.name}
                    onChange={(e) => updateIncomeRow(idx, "name", e.target.value)}
                    placeholder="Nom (ex: Salaire)"
                    className="flex-1 min-h-[44px] px-3 rounded-xl border-2 border-border bg-card text-foreground text-sm focus:outline-none focus:border-sky-400 transition-colors"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.amount}
                    onChange={(e) => updateIncomeRow(idx, "amount", e.target.value)}
                    placeholder="€"
                    className="w-20 min-h-[44px] px-3 rounded-xl border-2 border-border bg-card text-foreground text-sm focus:outline-none focus:border-sky-400 transition-colors"
                  />
                  <button
                    onClick={() => removeIncomeRow(idx)}
                    className="w-10 h-11 rounded-xl border-2 border-border text-muted-foreground hover:text-red-500 hover:border-red-200 transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addIncomeRow}
              className="w-full min-h-[44px] rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:text-sky-400 hover:border-sky-400/50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Ajouter un revenu
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("balance")}
                className="min-h-[52px] px-4 rounded-xl border-2 border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
              >
                Retour
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 min-h-[52px] rounded-xl bg-sky-400 hover:bg-sky-500 text-white font-bold text-base transition-colors disabled:opacity-50"
              >
                {saving ? "Enregistrement…" : "Accéder à l'app"}
              </button>
            </div>

            <button
              onClick={handleFinish}
              disabled={saving}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Passer cette étape
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
