import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Login from "@/pages/Login";

interface FeedbackEntry {
  uid: string;
  email: string;
  note: number;
  categorie: string;
  message: string;
  version: string;
  createdAt: string;
}

const STARS = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

export default function Admin() {
  const { user, loading } = useAuth();
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    get(ref(db, "feedback")).then((snap) => {
      const raw = snap.val() ?? {};
      const entries: FeedbackEntry[] = [];
      Object.entries(raw).forEach(([uid, userFeedbacks]) => {
        Object.values(userFeedbacks as Record<string, unknown>).forEach((fb) => {
          const f = fb as Record<string, unknown>;
          entries.push({
            uid,
            email: String(f.email ?? uid),
            note: Number(f.note ?? 0),
            categorie: String(f.categorie ?? ""),
            message: String(f.message ?? ""),
            version: String(f.version ?? ""),
            createdAt: String(f.createdAt ?? ""),
          });
        });
      });
      entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setFeedbacks(entries);
      setFetching(false);
    }).catch(() => setFetching(false));
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-muted-foreground">Chargement…</div></div>;
  if (!user) return <Login />;

  const filtered = filter === "all" ? feedbacks : feedbacks.filter((f) => f.categorie === filter);
  const avgNote = feedbacks.length ? (feedbacks.reduce((s, f) => s + f.note, 0) / feedbacks.length).toFixed(1) : "—";
  const byCategorie = feedbacks.reduce((acc, f) => { acc[f.categorie] = (acc[f.categorie] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-foreground">Admin · Feedbacks</h1>
          <p className="text-sm text-muted-foreground">Route cachée — lecture seule</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-foreground">{feedbacks.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-amber-500">{avgNote}</p>
            <p className="text-xs text-muted-foreground">Moy. note</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-foreground">{new Set(feedbacks.map((f) => f.uid)).size}</p>
            <p className="text-xs text-muted-foreground">Testeurs</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {["all", "bug", "ux", "manque"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`min-h-[32px] px-3 rounded-full text-xs font-semibold border-2 transition-colors ${
                filter === f ? "border-sky-400 bg-sky-400/15 text-sky-600 dark:text-sky-300" : "border-border text-muted-foreground hover:border-sky-400/30"
              }`}>
              {f === "all" ? `Tous (${feedbacks.length})` : `${f === "bug" ? "🐛" : f === "ux" ? "✨" : "➕"} ${f} (${byCategorie[f] ?? 0})`}
            </button>
          ))}
        </div>

        {/* List */}
        {fetching ? (
          <div className="py-8 text-center"><div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Aucun feedback</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((fb, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-sm font-mono">{STARS(fb.note)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      fb.categorie === "bug" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                      fb.categorie === "ux" ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" :
                      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    }`}>{fb.categorie}</span>
                    <span className="text-xs text-muted-foreground font-mono">v{fb.version}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </span>
                </div>
                <p className="text-sm text-foreground">{fb.message}</p>
                <p className="text-xs text-muted-foreground font-mono">{fb.email}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
