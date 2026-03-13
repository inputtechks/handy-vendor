import { useLanguage } from "@/context/LanguageContext";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex rounded-lg bg-secondary border border-border overflow-hidden text-xs font-bold">
      <button
        onClick={() => setLanguage("de")}
        className={`px-3 py-1.5 transition-colors ${
          language === "de"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        DE
      </button>
      <button
        onClick={() => setLanguage("fr")}
        className={`px-3 py-1.5 transition-colors ${
          language === "fr"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        FR
      </button>
    </div>
  );
}
