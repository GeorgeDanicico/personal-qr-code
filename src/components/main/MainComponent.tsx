import { useCallback, useMemo, useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Main.module.css";
import VCardForm from "../vcard/VCardForm";
import {
  languageMeta,
  languageOrder,
  resolveTranslation,
  translations,
  type Language,
} from "../../../i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const MainComponent = () => {
  const [language, setLanguage] = useState<Language>("en");

  const translation = useMemo(() => translations[language], [language]);
  const translate = useCallback(
    (key: string) => resolveTranslation(translation, key),
    [translation]
  );

  const languageOptions = useMemo(
    () =>
      languageOrder.map((value) => ({
        value,
        label: `${languageMeta[value].flag} ${languageMeta[value].code}`,
      })),
    []
  );

  return (
    <div className={`${styles.page} ${geistSans.variable} ${geistMono.variable}`}>
      <main className={styles.main}>
        <div className={styles.languageRow}>
          <div className={styles.languageSwitcher}>
            <label className={styles.languageLabel} htmlFor="language-select">
              {translation.languageLabel}
            </label>
            <select
              id="language-select"
              className={styles.languageSelect}
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
              title={translation.languageLabel}
            >
              {languageOptions.map(({ value, label }) => (
                <option
                  key={value}
                  value={value}
                  title={translation.languageOptions[value]}
                >
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <section className={styles.intro}>
          <span className={styles.badge}>{translation.badge}</span>
          <h1 className={styles.title}>{translation.title}</h1>
          <p className={styles.description}>{translation.description}</p>
        </section>

        <VCardForm translation={translation} translate={translate} />
      </main>

      <footer className={styles.footer}>
        © {new Date().getFullYear()} George Danicico. All rights reserved.
      </footer>
    </div>
  );
};

export default MainComponent;
