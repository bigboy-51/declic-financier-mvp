import { useState } from "react";
import { MessageSquare, X, Star } from "lucide-react";
import { ref, push } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

type FeedbackCategorie = "bug" | "ux" | "manque";

const VERSION = "0.1.0";

export function FeedbackButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(0);
  const [categorie, setCategorie] = useState<FeedbackCategorie>("ux");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user) return null;

  const handleSend = async () => {
    if (!note || !message.trim() || sending) return;
    setSending(true);
    try {
      const timestamp = Date.now();
      await push(ref(db, `feedback/${user.uid}`), {
        note,
        categorie,
        message: message.trim(),
        version: VERSION,
        createdAt: new Date(timestamp).toISOString(),
        uid: user.uid,
        email: user.email ?? "",
      });
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setOpen(false);
        setNote(0);
        setMessage("");
        setCategorie("ux");
      }, 1500);
    } catch (err) {
      console.error("Feedback error:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-sky-400/50 transition-all hover:scale-105 active:scale-95"
        aria-label="Donner un avis"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground">Votre avis</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {sent ? (
              <div className="py-6 text-center">
                <p className="text-2xl mb-2">🎉</p>
                <p className="font-semibold text-foreground">Merci pour votre retour !</p>
              </div>
            ) : (
              <>
                {/* Stars */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Note globale</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setNote(n)}
                        className={`text-2xl transition-transform hover:scale-110 active:scale-95 ${n <= note ? "text-amber-400" : "text-muted-foreground/30"}`}>
                        <Star className={`w-7 h-7 ${n <= note ? "fill-amber-400 text-amber-400" : ""}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Catégorie</p>
                  <div className="flex gap-2">
                    {(["bug", "ux", "manque"] as FeedbackCategorie[]).map((c) => (
                      <button key={c} onClick={() => setCategorie(c)}
                        className={`flex-1 min-h-[36px] rounded-xl border-2 text-xs font-semibold transition-colors ${
                          categorie === c
                            ? "border-sky-400 bg-sky-400/15 text-sky-600 dark:text-sky-300"
                            : "border-border text-muted-foreground hover:border-sky-400/30"
                        }`}>
                        {c === "bug" ? "🐛 Bug" : c === "ux" ? "✨ UX" : "➕ Manque"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Message</p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Décrivez votre retour…"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  />
                </div>

                <button
                  onClick={handleSend}
                  disabled={!note || !message.trim() || sending}
                  className="w-full min-h-[44px] rounded-xl bg-sky-400 hover:bg-sky-500 text-white text-sm font-bold transition-colors disabled:opacity-40"
                >
                  {sending ? "Envoi…" : "Envoyer"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
