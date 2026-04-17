import { useState } from "react";
import type { UserType } from "@/context/AuthContext";

interface UserTypeModalProps {
  onSelect: (userType: UserType) => Promise<void>;
}

export function UserTypeModal({ onSelect }: UserTypeModalProps) {
  const [saving, setSaving] = useState(false);

  const handleSelect = async (type: UserType) => {
    if (saving) return;
    setSaving(true);
    try {
      await onSelect(type);
    } catch (err) {
      console.error("Failed to save user type:", err);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm px-5">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-foreground">Bienvenue dans Déclic Financier</h1>
          <p className="text-sm text-muted-foreground">Êtes-vous seul(e) ou en couple ?</p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => handleSelect("single")}
            disabled={saving}
            data-testid="button-user-type-single"
            className="w-full flex flex-col items-center gap-2 px-6 py-6 rounded-2xl border-2 border-border bg-card hover:border-sky-400 hover:bg-sky-400/10 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed group min-h-[80px]"
          >
            <span className="text-4xl">🧍</span>
            <span className="text-lg font-black text-foreground group-hover:text-sky-500 transition-colors">Seul(e)</span>
            <span className="text-sm text-muted-foreground">Gestion personnelle de mes finances</span>
          </button>

          <button
            onClick={() => handleSelect("couple")}
            disabled={saving}
            data-testid="button-user-type-couple"
            className="w-full flex flex-col items-center gap-2 px-6 py-6 rounded-2xl border-2 border-border bg-card hover:border-sky-400 hover:bg-sky-400/10 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed group min-h-[80px]"
          >
            <span className="text-4xl">👥</span>
            <span className="text-lg font-black text-foreground group-hover:text-sky-500 transition-colors">En couple</span>
            <span className="text-sm text-muted-foreground">Gestion financière partagée</span>
          </button>
        </div>

        {saving && (
          <p className="text-sm text-muted-foreground animate-pulse">Enregistrement...</p>
        )}
      </div>
    </div>
  );
}
