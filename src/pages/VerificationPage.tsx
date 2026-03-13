import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { LogOut, Clock } from "lucide-react";
import helvelittLogo from "@/assets/helvelitt-logo.png";

export default function VerificationPage() {
  const { signOut } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-end">
          <LanguageToggle />
        </div>
        <img src={helvelittLogo} alt="HelveLitt" className="h-16 w-16 mx-auto object-contain" />
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Clock className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-black text-foreground">{t("verify.title")}</h1>
        <p className="text-muted-foreground leading-relaxed">{t("verify.message")}</p>
        <Button variant="secondary" className="gap-2" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          {t("dash.signOut")}
        </Button>
      </div>
    </div>
  );
}
