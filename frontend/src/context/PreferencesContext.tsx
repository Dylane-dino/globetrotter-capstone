"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";

export type Language = "en" | "fr";
export type Theme = "light" | "dark" | "system";

const dictionaries = {
  en: { home: "Home", community: "Community", trips: "My Trips", settings: "Settings", showRoute: "Show Route", hotels: "Hotels", hospitals: "Hospitals", liveMap: "Live map & directions", settingsHeading: "Settings" },
  fr: { home: "Accueil", community: "Communauté", trips: "Mes voyages", settings: "Paramètres", showRoute: "Afficher l’itinéraire", hotels: "Hôtels", hospitals: "Hôpitaux", liveMap: "Carte et itinéraires", settingsHeading: "Paramètres" },
} as const;

type TranslationKey = keyof typeof dictionaries.en;
type PreferencesContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: TranslationKey) => string;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);
const LANGUAGE_KEY = "globetrotter_language";
const THEME_KEY = "globetrotter_theme";

function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_KEY);
    const savedTheme = window.localStorage.getItem(THEME_KEY);
    if (savedLanguage === "en" || savedLanguage === "fr") setLanguageState(savedLanguage);
    if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system") {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else applyTheme("system");
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [theme]);

  const setLanguage = (next: Language) => { setLanguageState(next); window.localStorage.setItem(LANGUAGE_KEY, next); document.documentElement.lang = next; };
  const setTheme = (next: Theme) => { setThemeState(next); window.localStorage.setItem(THEME_KEY, next); applyTheme(next); };

  return <PreferencesContext.Provider value={{ language, setLanguage, theme, setTheme, t: (key) => dictionaries[language][key] }}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("usePreferences must be used within PreferencesProvider");
  return context;
}
