import { useState, useEffect, useRef } from "react";
import { Heart, Send, Trash2, MessageCircle, Lightbulb, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirebaseData } from "@/context/FirebaseDataContext";

interface CoupleMessage {
  id: string;
  text: string;
  author: "moi" | "partner";
  senderRole?: "boss" | "wife";
  timestamp: string;
}

const MESSAGE_TEMPLATES = [
  { emoji: "🎉", text: "Bravo ! Tu as respecté le budget ce mois !" },
  { emoji: "💪", text: "Excellent cette semaine, continue comme ça !" },
  { emoji: "❤️", text: "Je suis fier(e) de nous — on avance ensemble." },
  { emoji: "👏", text: "Tu gères super bien les courses, merci !" },
  { emoji: "🌟", text: "On est une équipe imbattable !" },
  { emoji: "🎯", text: "Encore un pas vers notre objectif debt-free !" },
];

const COMMUNICATION_TIPS = [
  {
    avoid: "\"Achète juste ce qu'il faut\"",
    better: "\"Achète ce que tu estimes juste au regard du budget restant\"",
    why: "Laisse l'autre décider en connaissance de cause, sans te déresponsabiliser.",
  },
  {
    avoid: "\"Tu dépenses trop\"",
    better: "\"On est à X€ du budget, qu'est-ce qu'on peut ajuster ensemble ?\"",
    why: "Transforme l'accusation en résolution commune.",
  },
  {
    avoid: "\"Tu n'as rien économisé ce mois\"",
    better: "\"Super effort ce mois, on a économisé X€ de plus qu'avant.\"",
    why: "Valorise les progrès plutôt que de souligner les manques.",
  },
  {
    avoid: "\"On n'a pas d'argent\"",
    better: "\"Notre priorité ce mois c'est les dettes, on verra pour les extras ensuite.\"",
    why: "Donne une direction positive au lieu d'une déclaration de pénurie.",
  },
  {
    avoid: "\"C'est moi qui gère les finances\"",
    better: "\"Regardons les chiffres ensemble et décidons ensemble.\"",
    why: "La transparence renforce la confiance et la responsabilité partagée.",
  },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

interface CoupleProps {
  surplus: number;
  groceryBudget: number;
  totalGrocerySpent: number;
  totalPoints: number;
  dailyCompleted: number;
  weeklyCompleted: number;
  monthlyCompleted: number;
  totalDebt: number;
  memberName: string | null;
  partnerName: string | null;
  currentProfile: "boss" | "wife" | null;
}

type CoupleTab = "messages" | "guide" | "stats";

export function Couple({
  surplus,
  groceryBudget,
  totalGrocerySpent,
  totalPoints,
  dailyCompleted,
  weeklyCompleted,
  monthlyCompleted,
  totalDebt,
  memberName,
  partnerName,
  currentProfile,
}: CoupleProps) {
  const myName = currentProfile === "boss" ? (memberName || "Moi") : currentProfile === "wife" ? (partnerName || "Moi") : "Moi";
  const theirName = currentProfile === "boss" ? (partnerName || "Partenaire") : currentProfile === "wife" ? (memberName || "Partenaire") : "Partenaire";
  const { coupleMessages: fbMessages, saveCoupleMessages, saveNotification } = useFirebaseData();
  const [activeTab, setActiveTab] = useState<CoupleTab>("messages");
  const [messages, setMessages] = useState<CoupleMessage[]>(() => {
    if (Array.isArray(fbMessages)) return fbMessages;
    return [];
  });
  const [customText, setCustomText] = useState("");
  const [author, setAuthor] = useState<"moi" | "partner">("moi");
  const [expandedTip, setExpandedTip] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync Firebase messages into local state
  useEffect(() => {
    if (Array.isArray(fbMessages)) {
      setMessages(fbMessages);
    }
  }, [fbMessages]);

  // Save to Firebase when local messages change
  useEffect(() => {
    saveCoupleMessages(messages);
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const senderRole: "boss" | "wife" =
      author === "moi"
        ? (currentProfile ?? "boss")
        : currentProfile === "boss" ? "wife" : "boss";
    const recipientProfile: "boss" | "wife" = senderRole === "boss" ? "wife" : "boss";
    const senderName = author === "moi" ? myName : theirName;
    const id = Date.now().toString();
    const msg: CoupleMessage = {
      id,
      text: text.trim(),
      author,
      senderRole,
      timestamp: new Date().toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, msg]);
    setCustomText("");
    saveNotification({
      id,
      text: text.trim(),
      senderName,
      senderRole,
      forProfile: recipientProfile,
      timestamp: Date.now(),
    });
  };

  const deleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const groceryRestant = groceryBudget - totalGrocerySpent;
  const totalChallenges = dailyCompleted + weeklyCompleted + monthlyCompleted;

  return (
    <div className="space-y-4 pb-6">
      {/* Header Card */}
      <div className="card-finance bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-l-4 border-pink-500">
        <div className="flex items-center gap-3">
          <Heart className="w-7 h-7 text-pink-500 flex-shrink-0" />
          <div>
            <p className="font-bold text-lg text-foreground">Espace Couple</p>
            <p className="text-xs text-muted-foreground">Encouragements, communication & progrès ensemble</p>
          </div>
        </div>
        {/* Budget snapshot */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-background/60 rounded-lg py-2 px-1">
            <p className="text-muted-foreground">Surplus</p>
            <p className={cn("font-bold text-sm", surplus >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive")}>
              {fmt(surplus)}
            </p>
          </div>
          <div className="bg-background/60 rounded-lg py-2 px-1">
            <p className="text-muted-foreground">Restant courses</p>
            <p className={cn("font-bold text-sm", groceryRestant >= 0 ? "text-blue-600 dark:text-blue-400" : "text-destructive")}>
              {fmt(groceryRestant)}
            </p>
          </div>
          <div className="bg-background/60 rounded-lg py-2 px-1">
            <p className="text-muted-foreground">Points couple</p>
            <p className="font-bold text-sm text-amber-600 dark:text-amber-400">{totalPoints} pts</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl">
        {(["messages", "guide", "stats"] as CoupleTab[]).map((tab) => {
          const icons = { messages: <MessageCircle className="w-4 h-4" />, guide: <Lightbulb className="w-4 h-4" />, stats: <BarChart3 className="w-4 h-4" /> };
          const labels = { messages: "Messages", guide: "Guide", stats: "Stats" };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              data-testid={`tab-couple-${tab}`}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all",
                activeTab === tab
                  ? "bg-card text-pink-600 dark:text-pink-400 shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {icons[tab]}
              <span>{labels[tab]}</span>
            </button>
          );
        })}
      </div>

      {/* ─── MESSAGES TAB ─────────────────────────────────── */}
      {activeTab === "messages" && (
        <div className="space-y-4">
          {/* Author selector */}
          <div className="card-finance py-3">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Envoyer en tant que :</p>
            <div className="flex gap-2">
              {(["moi", "partner"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setAuthor(a)}
                  data-testid={`button-author-${a}`}
                  className={cn(
                    "flex-1 min-h-[40px] rounded-lg text-sm font-semibold border transition-all",
                    author === a
                      ? "bg-pink-500 text-white border-pink-500"
                      : "bg-card text-muted-foreground border-border hover:bg-muted",
                  )}
                >
                  {a === "moi" ? `👤 ${myName}` : `👥 ${theirName}`}
                </button>
              ))}
            </div>
          </div>

          {/* Message Templates */}
          <div className="card-finance space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Messages rapides</p>
            <div className="grid grid-cols-1 gap-2">
              {MESSAGE_TEMPLATES.map((tmpl, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(tmpl.text)}
                  data-testid={`button-template-${i}`}
                  className="text-left flex items-start gap-2 w-full px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors min-h-[44px] border border-border hover:border-pink-300 dark:hover:border-pink-700"
                >
                  <span className="text-xl flex-shrink-0">{tmpl.emoji}</span>
                  <span className="text-sm text-foreground">{tmpl.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div className="card-finance space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Message personnalisé</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendMessage(customText); }}
                placeholder="Écris ton message..."
                className="flex-1 min-h-[44px] px-3 py-2 rounded-lg bg-muted border border-border text-sm outline-none focus:ring-2 focus:ring-pink-400"
                data-testid="input-couple-message"
              />
              <button
                onClick={() => sendMessage(customText)}
                disabled={!customText.trim()}
                className="min-h-[44px] min-w-[44px] px-3 bg-pink-500 text-white rounded-lg flex items-center justify-center disabled:opacity-40 transition-opacity"
                data-testid="button-send-message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Message History */}
          {messages.length > 0 ? (
            <div className="card-finance space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Historique ({messages.length})
                </p>
                <button
                  onClick={() => { if (confirm("Effacer tout l'historique ?")) setMessages([]); }}
                  className="text-xs text-muted-foreground hover:text-destructive min-h-[32px] px-2"
                  data-testid="button-clear-messages"
                >
                  Tout effacer
                </button>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {messages.map((msg) => {
                  const isMoi = msg.author === "moi";
                  const senderName = isMoi ? myName : theirName;
                  return (
                    <div
                      key={msg.id}
                      className={cn("flex gap-1.5 items-end", isMoi ? "flex-row-reverse" : "flex-row")}
                    >
                      {/* Avatar dot */}
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white mb-0.5",
                          isMoi ? "bg-blue-400" : "bg-pink-500",
                        )}
                      >
                        {senderName.charAt(0).toUpperCase()}
                      </div>

                      {/* Bubble + delete */}
                      <div className={cn("flex gap-1 items-end max-w-[78%]", isMoi ? "flex-row-reverse" : "flex-row")}>
                        <div
                          className={cn(
                            "px-3 py-2.5 rounded-2xl text-sm shadow-sm",
                            isMoi
                              ? "bg-blue-400 text-white rounded-br-sm"
                              : "bg-pink-500 text-white rounded-bl-sm",
                          )}
                        >
                          <p className={cn("text-[10px] font-bold mb-0.5 opacity-80")}>
                            {senderName}
                          </p>
                          <p className="leading-snug">{msg.text}</p>
                          <p className="text-[10px] mt-1 text-white/60">{msg.timestamp}</p>
                        </div>
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className="text-muted-foreground hover:text-destructive flex-shrink-0 p-1 opacity-30 hover:opacity-100 transition-opacity mb-1"
                          data-testid={`button-delete-message-${msg.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>
          ) : (
            <div className="card-finance text-center py-8 text-muted-foreground">
              <Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Pas encore de messages — envoyez le premier !</p>
            </div>
          )}
        </div>
      )}

      {/* ─── GUIDE TAB ─────────────────────────────────────── */}
      {activeTab === "guide" && (
        <div className="space-y-4">
          {/* Budget Context */}
          <div className="card-finance bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-2">Contexte budget en temps réel</p>
            <div className="space-y-1 text-sm">
              <p className="text-foreground">
                🛒 Restant courses : <strong className={groceryRestant >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}>{fmt(groceryRestant)}</strong>
                <span className="text-muted-foreground text-xs ml-1">— à toi de voir !</span>
              </p>
              <p className="text-foreground">
                💰 Surplus du mois : <strong className={surplus >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}>{fmt(surplus)}</strong>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {COMMUNICATION_TIPS.map((tip, i) => (
              <div key={i} className="card-finance border border-border overflow-hidden">
                <button
                  className="w-full flex items-center justify-between text-left min-h-[44px] py-1"
                  onClick={() => setExpandedTip(expandedTip === i ? null : i)}
                  data-testid={`button-tip-${i}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="flex-shrink-0 text-xs font-bold bg-destructive/10 text-destructive px-2 py-0.5 rounded">Éviter</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">{tip.avoid}</span>
                    </div>
                  </div>
                  {expandedTip === i ? <ChevronUp className="w-4 h-4 flex-shrink-0 text-muted-foreground ml-2" /> : <ChevronDown className="w-4 h-4 flex-shrink-0 text-muted-foreground ml-2" />}
                </button>

                {expandedTip === i && (
                  <div className="mt-2 space-y-2 pt-2 border-t border-border">
                    <div>
                      <p className="text-xs font-semibold text-destructive mb-1">❌ À éviter :</p>
                      <p className="text-sm text-muted-foreground italic">{tip.avoid}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">✅ Essayez plutôt :</p>
                      <p className="text-sm font-medium text-foreground">{tip.better}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground"><strong className="text-foreground">Pourquoi ?</strong> {tip.why}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="card-finance bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-center py-4">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">💡 Règle d'or</p>
            <p className="text-xs text-muted-foreground mt-1">
              Parlez des chiffres, pas des comportements.
              <br />
              "Le budget est à X€" est neutre — "tu dépenses trop" est une attaque.
            </p>
          </div>
        </div>
      )}

      {/* ─── STATS TAB ─────────────────────────────────────── */}
      {activeTab === "stats" && (
        <div className="space-y-4">
          {/* Monthly savings celebration */}
          {surplus > 0 ? (
            <div className="card-finance bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-l-4 border-green-500 text-center py-5">
              <p className="text-4xl mb-2">🎊</p>
              <p className="text-base font-bold text-green-700 dark:text-green-300">
                On a économisé <span className="text-2xl font-black">{fmt(surplus)}</span> ensemble ce mois-ci !
              </p>
              <p className="text-xs text-muted-foreground mt-1">Super boulot à tous les deux 💪</p>
            </div>
          ) : surplus < 0 ? (
            <div className="card-finance bg-gradient-to-br from-orange-500/10 to-red-500/10 border-l-4 border-orange-400 text-center py-5">
              <p className="text-4xl mb-2">💬</p>
              <p className="text-base font-bold text-orange-700 dark:text-orange-300">
                Solde : <span className="text-2xl font-black">{fmt(surplus)}</span> ce mois
              </p>
              <p className="text-xs text-muted-foreground mt-1">Ensemble on peut ajuster — parlez-en avec bienveillance ❤️</p>
            </div>
          ) : null}

          {/* Combined Points */}
          <div className="card-finance bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-l-4 border-amber-500 text-center">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wide">Points couple combinés</p>
            <p className="text-5xl font-black text-amber-500 mt-2">{totalPoints}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalPoints < 100 ? "🌱 Débutants — continuez !" :
               totalPoints < 250 ? "🥉 Bronze — bien parti !" :
               totalPoints < 500 ? "🥈 Argent — bonne équipe !" :
               totalPoints < 1000 ? "🥇 Or — champions !" :
               "💎 Platine — légendaires !"}
            </p>
          </div>

          {/* Challenges completed this month */}
          <div className="card-finance space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Défis complétés ensemble ce mois</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center py-4 bg-muted/50 rounded-xl border-l-2 border-green-500">
                <p className="text-3xl font-black text-green-600 dark:text-green-400">{dailyCompleted}</p>
                <p className="text-xs text-muted-foreground mt-1">Quotidiens</p>
              </div>
              <div className="text-center py-4 bg-muted/50 rounded-xl border-l-2 border-blue-500">
                <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{weeklyCompleted}</p>
                <p className="text-xs text-muted-foreground mt-1">Hebdo</p>
              </div>
              <div className="text-center py-4 bg-muted/50 rounded-xl border-l-2 border-purple-500">
                <p className="text-3xl font-black text-purple-600 dark:text-purple-400">{monthlyCompleted}</p>
                <p className="text-xs text-muted-foreground mt-1">Mensuels</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1 border-t border-border">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="text-xs text-muted-foreground">Total défis complétés</p>
                <p className="text-lg font-black text-foreground">{totalChallenges} défi{totalChallenges !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>

          {/* Debt progress */}
          <div className="card-finance space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Progression dette totale</p>
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏔️</div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Restant à rembourser</p>
                <p className="text-xl font-black text-foreground">{fmt(totalDebt)}</p>
              </div>
            </div>
            {surplus > 0 && (
              <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-2 text-xs text-green-700 dark:text-green-300">
                💪 Avec votre surplus de <strong>{fmt(surplus)}</strong>, vous avancez vers la liberté financière !
              </div>
            )}
          </div>

          {/* Messages sent */}
          <div className="card-finance flex items-center gap-4">
            <div className="text-4xl">💌</div>
            <div>
              <p className="text-sm text-muted-foreground">Messages d'encouragement envoyés</p>
              <p className="text-2xl font-black text-foreground">
                {messages.length} message{messages.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
