import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
const logoDark = "/logo-bleu.png";
const logoLight = "/logo-blanc.png";

export default function Login() {
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [rawCode, setRawCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [configStatus, setConfigStatus] = useState<"ok" | "missing" | null>(null);

  // Verify Firebase config on mount
  useEffect(() => {
    const cfg = auth.app.options;
    const missing = !cfg.apiKey || !cfg.authDomain || !cfg.projectId;
    setConfigStatus(missing ? "missing" : "ok");
    if (missing) {
      console.error("Firebase config manquant:", {
        apiKey: !!cfg.apiKey,
        authDomain: !!cfg.authDomain,
        projectId: !!cfg.projectId,
        appId: !!cfg.appId,
      });
    }
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
      "La connexion par email/mot de passe n'est pas activée sur ce projet Firebase. Allez dans Firebase Console → Authentication → Sign-in method → Email/Password et activez-le.",
    "auth/configuration-not-found":
      "Configuration Firebase introuvable. Vérifiez les variables d'environnement VITE_FIREBASE_*.",
    "auth/api-key-not-valid":
      "Clé API Firebase invalide. Vérifiez VITE_FIREBASE_API_KEY.",
    "auth/app-deleted": "Application Firebase supprimée ou non initialisée.",
    "auth/invalid-api-key":
      "Clé API Firebase invalide. Vérifiez les secrets VITE_FIREBASE_*.",
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
      console.error("Firebase auth error:", code, err?.message);
      const known = FIREBASE_ERRORS[code];
      if (known) {
        setError(known);
      } else if (err?.message?.includes("400")) {
        setError(
          "Erreur 400 Firebase : la méthode Email/Password n'est probablement pas activée. " +
          "Allez dans Firebase Console → Authentication → Sign-in method → Email/Password et activez-la.",
        );
      } else {
        setError(`Erreur inattendue (${code || "inconnu"}). Vérifiez la console.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <img
            src={logoDark}
            alt="Déclic Financier"
            className="hidden dark:block w-56 mx-auto mb-2"
          />
          <img
            src={logoLight}
            alt="Déclic Financier"
            className="block dark:hidden w-56 mx-auto mb-2"
          />
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Connectez-vous à votre compte" : "Créez votre compte"}
          </p>
        </div>

        {/* Config warning banner */}
        {configStatus === "missing" && (
          <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-300 text-sm px-4 py-3 rounded-xl">
            ⚠️ Variables Firebase manquantes. Vérifiez les secrets <code>VITE_FIREBASE_*</code> dans les paramètres.
          </div>
        )}

        <div className="bg-card rounded-2xl shadow-lg border border-border p-6 space-y-5">
          {/* Mode toggle */}
          <div className="flex rounded-xl overflow-hidden border border-border">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); setRawCode(""); }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                mode === "login"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
              data-testid="tab-login"
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); setRawCode(""); }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                mode === "register"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
              data-testid="tab-register"
            >
              Créer un compte
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                autoComplete="email"
                className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-muted border-0 focus:ring-2 focus:ring-primary outline-none text-base"
                data-testid="input-email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Minimum 6 caractères" : "••••••••"}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-muted border-0 focus:ring-2 focus:ring-primary outline-none text-base"
                data-testid="input-password"
              />
            </div>

            {error && (
              <div
                className="bg-destructive/10 text-destructive text-sm px-3 py-3 rounded-lg space-y-1"
                data-testid="error-auth"
              >
                <p>{error}</p>
                {rawCode && (
                  <p className="text-xs opacity-60 font-mono">Code: {rawCode}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || configStatus === "missing"}
              className="w-full min-h-[48px] bg-primary text-primary-foreground rounded-lg font-semibold text-base disabled:opacity-60 transition-opacity"
              data-testid="button-submit-auth"
            >
              {loading
                ? "⏳ Chargement..."
                : mode === "login"
                  ? "Se connecter"
                  : "Créer mon compte"}
            </button>
          </form>
        </div>

        {/* Help section */}
        <div className="mt-4 bg-card border border-border rounded-xl p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground text-sm">En cas d'erreur 400 :</p>
          <ol className="list-decimal list-inside space-y-1 leading-relaxed">
            <li>Allez sur <span className="font-mono">console.firebase.google.com</span></li>
            <li>Sélectionnez le projet <span className="font-mono">familiyfree</span></li>
            <li>Authentication → Sign-in method</li>
            <li>Activez <strong>Email/Password</strong> (premier élément)</li>
            <li>Vérifiez que "Email link" est <strong>désactivé</strong></li>
            <li>Sauvegardez et réessayez</li>
          </ol>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Vos données sont chiffrées et synchronisées avec Firebase ☁️
        </p>
      </div>
    </div>
  );
}
