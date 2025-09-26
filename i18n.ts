import en from "./locales/en.json";
import ro from "./locales/ro.json";
import de from "./locales/de.json";
import es from "./locales/es.json";

export type Language = "ro" | "en" | "de" | "es";
export type Translation = typeof en;

export const translations: Record<Language, Translation> = {
  en,
  ro: ro as Translation,
  de: de as Translation,
  es: es as Translation,
};

export const languageOrder: Language[] = ["ro", "en", "de", "es"];

export const languageMeta: Record<Language, { flag: string; code: string }> = {
  ro: { flag: "🇷🇴", code: "ro" },
  en: { flag: "🇬🇧", code: "en" },
  de: { flag: "🇩🇪", code: "de" },
  es: { flag: "🇪🇸", code: "es" },
};

export const resolveTranslation = (translation: Translation, path: string): string => {
  const segments = path.split(".");
  let current: unknown = translation;

  for (const segment of segments) {
    if (typeof current === "object" && current !== null && segment in current) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return path;
    }
  }

  return typeof current === "string" ? current : path;
};
