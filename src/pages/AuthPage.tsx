import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import helvelittLogo from "@/assets/helvelitt-logo.png";

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else {
        setSuccess(t("auth.checkEmail"));
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <LanguageToggle />
          </div>
          <img src={helvelittLogo} alt="HelveLitt" className="h-20 mx-auto object-contain mix-blend-multiply" />
          <p className="text-muted-foreground text-sm">
            {isLogin ? t("auth.signInSubtitle") : t("auth.signUpSubtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-muted-foreground mb-1 block">{t("auth.email")}</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="h-12 text-base bg-card border-border" />
          </div>
          <div>
            <label className="text-sm font-semibold text-muted-foreground mb-1 block">{t("auth.password")}</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="h-12 text-base bg-card border-border" />
          </div>

          {error && <p className="text-destructive text-sm font-medium text-center">{error}</p>}
          {success && <p className="text-cash text-sm font-medium text-center">{success}</p>}

          <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={loading}>
            {loading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
            {isLogin ? t("auth.signIn") : t("auth.createAccount")}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); }}
            className="text-primary font-bold underline underline-offset-2"
          >
            {isLogin ? t("auth.signUp") : t("auth.signIn")}
          </button>
        </p>
      </div>
    </div>
  );
}
