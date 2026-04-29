import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useChargesData } from "@/hooks/useChargesData";
import { useCourses } from "@/hooks/useCourses";
import { useFinances } from "@/hooks/useFinances";
import Login from "@/pages/Login";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

export default function Diag() {
  const { user, loading, userProfile } = useAuth();
  const { charges, loading: chargesLoading, summary } = useChargesData();
  const { courses, totalCurrentMonth, loading: coursesLoading } = useCourses();
  const { finances, incomes, totalReceived, totalExpected, loading: finLoading } = useFinances();
  const [rawFirebase, setRawFirebase] = useState<Record<string, unknown> | null>(null);
  const [fbLoading, setFbLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    get(ref(db, `users/${user.uid}`)).then((snap) => {
      setRawFirebase(snap.val());
      setFbLoading(false);
    }).catch(() => setFbLoading(false));
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-muted-foreground">Chargement…</div></div>;
  if (!user) return <Login />;

  const solde = finances.startingBalance + totalReceived - summary.totalReel - totalCurrentMonth;

  return (
    <div className="min-h-screen bg-background px-4 py-8 font-mono text-sm">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black font-sans text-foreground">Diagnostic</h1>
          <p className="text-xs text-muted-foreground">Route cachée — état technique</p>
        </div>

        {/* User */}
        <section className="bg-card border border-border rounded-xl p-4 space-y-2">
          <h2 className="font-bold font-sans text-sm text-muted-foreground uppercase tracking-wide">Utilisateur</h2>
          <div className="space-y-1 text-foreground">
            <p>uid: <span className="text-muted-foreground break-all">{user.uid}</span></p>
            <p>email: <span className="text-muted-foreground">{user.email}</span></p>
            <p>memberName: <span className="text-muted-foreground">{userProfile.memberName ?? "—"}</span></p>
            <p>financialProfile: <span className="text-muted-foreground">{userProfile.financialProfile ?? "—"}</span></p>
            <p>quizCompleted: <span className={userProfile.quizCompleted ? "text-emerald-500" : "text-red-500"}>{String(userProfile.quizCompleted)}</span></p>
            <p>onboardingComplete: <span className={userProfile.onboardingComplete ? "text-emerald-500" : "text-red-500"}>{String(userProfile.onboardingComplete)}</span></p>
          </div>
        </section>

        {/* Balance breakdown */}
        <section className="bg-card border border-border rounded-xl p-4 space-y-2">
          <h2 className="font-bold font-sans text-sm text-muted-foreground uppercase tracking-wide">Calcul du solde</h2>
          {finLoading || chargesLoading || coursesLoading ? (
            <p className="text-muted-foreground">Chargement…</p>
          ) : (
            <div className="space-y-1 text-foreground">
              <p>startingBalance: <span className="text-sky-400">{fmt(finances.startingBalance)}</span></p>
              <p>+ totalReceived: <span className="text-emerald-500">+{fmt(totalReceived)}</span></p>
              <p>  (totalExpected: {fmt(totalExpected)}, {incomes.filter(i => i.receivedDate).length}/{incomes.length} reçus)</p>
              <p>- chargesReel: <span className="text-amber-500">-{fmt(summary.totalReel)}</span></p>
              <p>  (chargesPrevu: {fmt(summary.totalPrevu)}, chargesRestant: {fmt(summary.totalRestant)})</p>
              <p>- coursesMonth: <span className="text-orange-500">-{fmt(totalCurrentMonth)}</span></p>
              <p className="font-bold text-lg border-t border-border/40 pt-2 mt-2">= SOLDE: <span className={solde < 0 ? "text-red-500" : "text-emerald-500"}>{fmt(solde)}</span></p>
            </div>
          )}
        </section>

        {/* Charges */}
        <section className="bg-card border border-border rounded-xl p-4 space-y-2">
          <h2 className="font-bold font-sans text-sm text-muted-foreground uppercase tracking-wide">Charges ({charges.length})</h2>
          <div className="space-y-0.5 text-foreground max-h-48 overflow-y-auto">
            {charges.map((c) => (
              <p key={c.id} className="text-xs">
                [{c.categoryId}] {c.name}: prévu={fmt(c.prevu)} réel={fmt(c.reel)} {c.locked ? "🔒" : "🔓"}
              </p>
            ))}
          </div>
        </section>

        {/* Courses */}
        <section className="bg-card border border-border rounded-xl p-4 space-y-2">
          <h2 className="font-bold font-sans text-sm text-muted-foreground uppercase tracking-wide">Courses ({courses.length} total · {fmt(totalCurrentMonth)} ce mois)</h2>
          <div className="space-y-0.5 text-foreground max-h-48 overflow-y-auto">
            {courses.slice(0, 20).map((c) => (
              <p key={c.id} className="text-xs">{c.date} · {fmt(c.montant)} · {c.label || "(sans label)"} · {c.moyenPaiement}</p>
            ))}
            {courses.length > 20 && <p className="text-xs text-muted-foreground">…et {courses.length - 20} de plus</p>}
          </div>
        </section>

        {/* Incomes */}
        <section className="bg-card border border-border rounded-xl p-4 space-y-2">
          <h2 className="font-bold font-sans text-sm text-muted-foreground uppercase tracking-wide">Revenus ({incomes.length})</h2>
          <div className="space-y-0.5 text-foreground">
            {incomes.map((i) => (
              <p key={i.id} className="text-xs">
                {i.name}: {fmt(i.amount)} le {i.receiptDay} — {i.receivedDate ? `✅ reçu le ${i.receivedDate}` : "⏳ en attente"}
              </p>
            ))}
          </div>
        </section>

        {/* Raw Firebase */}
        <section className="bg-card border border-border rounded-xl p-4 space-y-2">
          <h2 className="font-bold font-sans text-sm text-muted-foreground uppercase tracking-wide">Firebase Raw (profile + finances)</h2>
          {fbLoading ? (
            <p className="text-muted-foreground">Chargement…</p>
          ) : (
            <pre className="text-xs text-foreground overflow-auto max-h-64 whitespace-pre-wrap break-all">
              {JSON.stringify({ profile: (rawFirebase as Record<string, unknown>)?.profile, finances: (rawFirebase as Record<string, unknown>)?.finances }, null, 2)}
            </pre>
          )}
        </section>
      </div>
    </div>
  );
}
