import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ScanBarcode, ArrowRightLeft, BarChart3, Check } from "lucide-react";
import helvelittLogo from "@/assets/helvelitt-logo.png";

export default function LandingPage() {
  const { t } = useLanguage();

  const features = [
    { icon: ScanBarcode, titleKey: "landing.feature1Title", descKey: "landing.feature1Desc" },
    { icon: ArrowRightLeft, titleKey: "landing.feature2Title", descKey: "landing.feature2Desc" },
    { icon: BarChart3, titleKey: "landing.feature3Title", descKey: "landing.feature3Desc" },
  ];

  const plans = [
    { nameKey: "landing.monthly", priceKey: "landing.monthlyPrice", recommended: false },
    { nameKey: "landing.semester", priceKey: "landing.semesterPrice", recommended: true },
    { nameKey: "landing.annual", priceKey: "landing.annualPrice", recommended: false },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <div className="flex items-center gap-2">
            <img src={helvelittLogo} alt="HelveLitt" className="h-8 sm:h-10 object-contain" />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <LanguageToggle />
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="font-semibold text-xs sm:text-sm px-2 sm:px-3">{t("auth.signIn")}</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="font-bold text-xs sm:text-sm px-3 sm:px-4">{t("auth.signUp")}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-10 sm:pt-20 pb-10 sm:pb-16 text-center">
        <img src={helvelittLogo} alt="HelveLitt" className="h-16 w-16 sm:h-24 sm:w-24 mx-auto mb-4 sm:mb-6 object-contain" />
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground mb-3 sm:mb-4">
          HelveLitt
        </h1>
        <p className="text-base sm:text-xl md:text-2xl font-medium text-primary italic mb-2 sm:mb-3 px-2">
          {t("landing.slogan")}
        </p>
        <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-10 px-2">
          {t("landing.subheadline")}
        </p>
        <Link to="/auth">
          <Button size="lg" className="h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg font-bold">
            {t("landing.getStarted")}
          </Button>
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 pb-12 sm:pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f) => (
            <div key={f.titleKey} className="rounded-xl bg-card border border-border p-4 sm:p-6 text-center">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <f.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-1 sm:mb-2">{t(f.titleKey)}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-4 pb-12 sm:pb-20">
        <h2 className="text-2xl sm:text-3xl font-black text-center text-foreground mb-6 sm:mb-10">{t("landing.pricing")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {plans.map((plan) => (
            <div
              key={plan.nameKey}
              className={`rounded-xl border p-5 sm:p-6 text-center relative ${
                plan.recommended
                  ? "bg-card border-primary shadow-lg sm:scale-105"
                  : "bg-card border-border"
              }`}
            >
              {plan.recommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  {t("landing.recommended")}
                </span>
              )}
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">{t(plan.nameKey)}</h3>
              <p className="text-2xl sm:text-3xl font-black text-primary mb-4 sm:mb-6">{t(plan.priceKey)}</p>
              <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6 text-xs sm:text-sm text-muted-foreground">
                {features.map((f) => (
                  <li key={f.titleKey} className="flex items-center gap-2 justify-center">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    {t(f.titleKey)}
                  </li>
                ))}
              </ul>
              <Link to="/auth">
                <Button className="w-full font-bold" variant={plan.recommended ? "default" : "secondary"}>
                  {t("landing.subscribe")}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 sm:py-8 text-center px-4">
        <p className="text-xs sm:text-sm text-muted-foreground">{t("landing.footer")}</p>
      </footer>
    </div>
  );
}
