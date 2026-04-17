import { useMemo, useState } from "react";

type SpendEntry = { id: string; dateISO: string; amount: number };

function normalizeEuro(n: number) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function toISODate(input: string) {
  const s = input.trim();
  const parts = s.split("/");
  if (parts.length < 2) return new Date().toISOString().slice(0, 10);

  const dd = parts[0].padStart(2, "0");
  const mm = parts[1].padStart(2, "0");
  const yyyy =
    parts[2] && parts[2].length === 4
      ? parts[2]
      : String(new Date().getFullYear());

  return `${yyyy}-${mm}-${dd}`;
}

export function VariableExpenseCard({
  label,
  budgetPrevu,
  entries,
  onAdd,
  onDelete,
}: {
  label: string;
  budgetPrevu: number;
  entries: SpendEntry[];
  onAdd: (dateISO: string, amount: number) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dateInput, setDateInput] = useState("");
  const [amountInput, setAmountInput] = useState("");

  const depense = useMemo(
    () =>
      normalizeEuro(entries.reduce((a, e) => a + (Number(e.amount) || 0), 0)),
    [entries],
  );

  const restant = useMemo(
    () => normalizeEuro((Number(budgetPrevu) || 0) - depense),
    [budgetPrevu, depense],
  );

  const handleAdd = () => {
    const amt = normalizeEuro(Number(amountInput));
    if (!amt || amt <= 0) return;

    const iso = toISODate(dateInput || "");
    onAdd(iso, amt);

    setAmountInput("");
    setDateInput("");
  };

  return (
    <div className="card-finance">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className="font-medium text-sm text-foreground">{label}</div>

        <div className="flex gap-4 items-center">
          <div className="text-xs text-muted-foreground">
            Prévu <strong className="text-foreground">{budgetPrevu.toFixed(2)}€</strong>
          </div>

          <div className="text-xs text-muted-foreground">
            Restant{" "}
            <strong className={restant < 0 ? "text-destructive" : "text-foreground"}>
              {restant.toFixed(2)}€
            </strong>
          </div>

          <div className="text-xs text-muted-foreground">{open ? "▲" : "▼"}</div>
        </div>
      </div>

      {open && (
        <div className="mt-3">
          {restant < 0 && (
            <div className="bg-destructive/10 border border-destructive/30 p-2.5 rounded-lg mb-3 text-sm">
              <strong className="text-destructive">Budget dépassé.</strong>{" "}
              <span className="text-muted-foreground">Chaque euro dépassé ralentit ton objectif Debt-Free.</span>
            </div>
          )}

          <div className="flex gap-2 items-center mb-3">
            <input
              type="date"
              placeholder="Date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="flex-1 px-2.5 py-2 rounded-lg bg-muted border border-border text-sm text-foreground"
            />
            <input
              type="number"
              placeholder="Montant €"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-[140px] px-2.5 py-2 rounded-lg bg-muted border border-border text-sm text-foreground"
              inputMode="decimal"
            />
            <button
              onClick={handleAdd}
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-xs"
            >
              + Ajouter
            </button>
          </div>

          <div className="border-t border-border pt-2.5">
            {entries.length === 0 ? (
              <div className="text-muted-foreground text-xs">
                Aucune dépense enregistrée.
              </div>
            ) : (
              entries.map((e) => (
                <div
                  key={e.id}
                  className="flex justify-between py-2 border-b border-border text-sm"
                >
                  <div className="text-foreground">
                    {e.dateISO} — <strong>{Number(e.amount).toFixed(2)}€</strong>
                  </div>
                  <button
                    onClick={() => onDelete(e.id)}
                    className="btn-delete"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-2.5 text-xs text-muted-foreground">
            Dépensé: <strong className="text-foreground">{depense.toFixed(2)}€</strong> • Restant:{" "}
            <strong className={restant < 0 ? "text-destructive" : "text-foreground"}>
              {restant.toFixed(2)}€
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}
