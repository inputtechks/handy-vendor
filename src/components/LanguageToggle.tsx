import { useLanguage } from "@/context/LanguageContext";

const langs = ["fr", "de", "en"] as const;

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex rounded-lg bg-secondary border border-border overflow-hidden text-xs font-bold">
      {langs.map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`px-3 py-1.5 transition-colors ${
            language === lang
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
