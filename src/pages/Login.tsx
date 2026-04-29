import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
const logoDark = "/logo-bleu.png";
const logoLight = "/logo-blanc.png";

export default function Login() {
  const { login, register, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [error, setError] = useState("");
  const [rawCode, setRawCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [configStatus, setConfigStatus] = useState<"ok" | "missing" | null>(null);

  useEffect(() => {
    const cfg = auth.app.options;
    const missing = !cfg.apiKey || !cfg.authDomain || !cfg.projectId;
    setConfigStatus(missing ? "missing" : "ok");
  }, []);

  const FIREBASE_ERRORS: Record<string, string> = {
    "auth/user-not-found": "Aucun compte trouvé avec cet email.",
    "auth/wrong-password": "Mot de passe incorrect.",
    "auth/invalid-credential": "Email ou mot de passe incorrect.",
    "auth/email-already-in-use": "Cet email est déjà utilisé.",
    "auth/weak-password": "Le mot de passe doit avoir au moins 6 caractères.",
    "auth/invalid-email": "Format d'email invalide.",
    "auth/too-many-requests": "Trop de tentatives. Réessayez plus tard.",
    "auth/network-request-failed": "Erreur réseau. Vérifiez votre connexion.",
    "auth/operation-not-allowed":
      "La connexion par email/mot de passe n'est pas activée sur ce projet Firebase.",
    "auth/configuration-not-found":
      "Configuration Firebase introuvable. Vérifiez les variables d'environnement VITE_FIREBASE_*.",
    "auth/api-key-not-valid": "Clé API Firebase invalide.",
    "auth/app-deleted": "Application Firebase supprimée ou non initialisée.",
    "auth/invalid-api-key": "Clé API Firebase invalide.",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setRawCode("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err: any) {
      const code = err?.code ?? "";
      setRawCode(code);
      const known = FIREBASE_ERRORS[code];
      setError(known ?? `Erreur inattendue (${code || "inconnu"}). Vérifiez la console.`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err: any) {
      const code = err?.code ?? "";
      const known = FIREBASE_ERRORS[code];
      setError(known ?? `Erreur (${code || "inconnu"}).`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logoDark} alt="Déclic Financier" className="hidden dark:block w-56 mx-auto mb-2" />
          <img src={logoLight} alt="Déclic Financier" className="block dark:hidden w-56 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {mode === "reset"
              ? "Récupération du mot de passe"
              : mode === "login"
              ? "Connectez-vous à votre compte"
              : "Créez votre compte"}
          </p>
        </div>

        {/* Config warning */}
        {configStatus === "missing" && (
          <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-300 text-sm px-4 py-3 rounded-xl">
            ⚠️ Variables Firebase manquantes. Vérifiez les secrets <code>VITE_FIREBASE_*</code>.
          </div>
        )}

        <div className="bg-card rounded-2xl shadow-lg border border-border p-6 space-y-5">
          {mode === "reset" ? (
            /* ── Reset password view ── */
            resetSent ? (
              <div className="text-center space-y-4 py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
                  <span className="text-2xl">✉️</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Email envoyé !</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
                    Vérifiez aussi vos spams.
                  </p>
                </div>
                <button
                  onClick={() => { setMode("login"); setResetSent(false); setError(""); }}
                  className="w-full min-h-[44px] rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
                >
                  Retour à la connexion
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Entrez votre email pour recevoir un lien de réinitialisation.
                </p>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    required
                    autoComplete="email"
                    className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-muted border-0 focus:ring-2 focus:ring-primary outline-none text-base"
                  />
                </div>
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm px-3 py-3 rounded-lg">
                    <p>{error}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[48px] bg-primary text-primary-foreground rounded-lg font-semibold text-base disabled:opacity-60 transition-opacity"
                >
                  {loading ? "⏳ Envoi..." : "Envoyer le lien"}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); }}
                  className="w-full min-h-[44px] rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Retour
                </button>
              </form>
            )
          ) : (
            /* ── Login / Register view ── */
            <>
              <div className="flex rounded-xl overflow-hidden border border-border">
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); setRawCode(""); }}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    mode === "login" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Se connecter
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("register"); setError(""); setRawCode(""); }}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    mode === "register" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Créer un compte
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    required
                    autoComplete="email"
                    className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-muted border-0 focus:ring-2 focus:ring-primary outline-none text-base"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-foreground">Mot de passe</label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => { setMode("reset"); setError(""); setRawCode(""); }}
                        className="text-xs text-primary hover:underline"
                      >
                        Mot de passe oublié ?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "Minimum 6 caractères" : "••••••••"}
                    required
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-muted border-0 focus:ring-2 focus:ring-primary outline-none text-base"
                  />
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm px-3 py-3 rounded-lg space-y-1">
                    <p>{error}</p>
                    {rawCode && <p className="text-xs opacity-60 font-mono">Code: {rawCode}</p>}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || configStatus === "missing"}
                  className="w-full min-h-[48px] bg-primary text-primary-foreground rounded-lg font-semibold text-base disabled:opacity-60 transition-opacity"
                >
                  {loading
                    ? "⏳ Chargement..."
                    : mode === "login"
                    ? "Se connecter"
                    : "Créer mon compte"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
