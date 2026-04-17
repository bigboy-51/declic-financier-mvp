import { useState } from "react";
import type { UserType } from "@/context/AuthContext";

interface NamesModalProps {
  userType: UserType;
  onComplete: (memberName: string, partnerName: string | null) => Promise<void>;
}

export function NamesModal({ userType, onComplete }: NamesModalProps) {
  const [memberName, setMemberName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [saving, setSaving] = useState(false);

  const isCouple = userType === "couple";

  const canSubmit = memberName.trim().length > 0 && (!isCouple || partnerName.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      await onComplete(memberName.trim(), isCouple ? partnerName.trim() : null);
    } catch (err) {
      console.error("Failed to save names:", err);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <p className="text-4xl">{isCouple ? "👥" : "👋"}</p>
          <h2 className="text-2xl font-black text-foreground">Personnalisez votre app</h2>
          <p className="text-sm text-muted-foreground">
            Ces prénoms seront utilisés partout dans l'application
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              {isCouple ? "Votre prénom" : "Votre prénom"}
            </label>
            <input
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder={isCouple ? "Ex: Marc" : "Ex: Sophie"}
              data-testid="input-member-name"
              maxLength={30}
              className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-base"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCouple && canSubmit) handleSubmit();
              }}
            />
          </div>

          {isCouple && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">
                Prénom de votre partenaire
              </label>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Ex: Julie"
                data-testid="input-partner-name"
                maxLength={30}
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-base"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSubmit) handleSubmit();
                }}
              />
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || saving}
          data-testid="button-save-names"
          className="w-full min-h-[52px] rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-base font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Enregistrement..." : "Continuer →"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Vous pourrez modifier ces prénoms dans les paramètres
        </p>
      </div>
    </div>
  );
}
