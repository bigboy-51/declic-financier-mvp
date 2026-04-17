type CoupleProfile = "boss" | "wife";

interface CoupleProfileModalProps {
  onSelect: (profile: CoupleProfile) => void;
  memberName: string | null;
  partnerName: string | null;
}

export function CoupleProfileModal({ onSelect, memberName, partnerName }: CoupleProfileModalProps) {
  const bossLabel = memberName ? `Je suis ${memberName}` : "Je suis le mari";
  const wifeLabel = partnerName ? `Je suis ${partnerName}` : "Je suis l'épouse";

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur flex items-center justify-center px-5">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <p className="text-4xl">👥</p>
          <h2 className="text-2xl font-black text-foreground">Qui êtes-vous ?</h2>
          <p className="text-sm text-muted-foreground">
            Sélectionnez votre profil
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => onSelect("boss")}
            data-testid="couple-profile-boss"
            className="w-full flex items-center gap-4 px-5 rounded-2xl border-2 border-border bg-card hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all active:scale-[0.98] group min-h-[64px]"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform flex-shrink-0">🎯</span>
            <div className="text-left">
              <p className="font-black text-foreground text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {bossLabel}
              </p>
              <p className="text-xs text-blue-500 font-semibold mt-0.5">Chef de famille A · Stratège</p>
            </div>
          </button>

          <button
            onClick={() => onSelect("wife")}
            data-testid="couple-profile-wife"
            className="w-full flex items-center gap-4 px-5 rounded-2xl border-2 border-border bg-card hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-all active:scale-[0.98] group min-h-[64px]"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform flex-shrink-0">🛡️</span>
            <div className="text-left">
              <p className="font-black text-foreground text-base group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                {wifeLabel}
              </p>
              <p className="text-xs text-pink-500 font-semibold mt-0.5">Chef de famille B · Économe</p>
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Vous pourrez changer à tout moment dans les paramètres
        </p>
      </div>
    </div>
  );
}
