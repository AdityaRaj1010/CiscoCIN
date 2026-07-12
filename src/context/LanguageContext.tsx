import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Stand-in for a Bhashini translation layer. A real integration would call the
 * Bhashini API per string; here a small dictionary demonstrates the seam and
 * lets the government tenant flip the whole UI to Hindi/Marathi live.
 */
export type Lang = "en" | "hi" | "mr";

export const LANGUAGES: { id: Lang; label: string; native: string }[] = [
  { id: "en", label: "English", native: "English" },
  { id: "hi", label: "Hindi", native: "हिन्दी" },
  { id: "mr", label: "Marathi", native: "मराठी" },
];

type Dict = Record<string, string>;

const STRINGS: Record<Lang, Dict> = {
  en: {
    "nav.feed": "Proposals",
    "nav.tally": "Live Tally",
    "nav.budget": "Budgeting",
    "action.support": "Support",
    "action.supported": "Supported",
    "action.vote": "Cast your vote",
    "feed.heading": "Proposals",
    "feed.sub": "Raised by the community, moving through the trust pipeline.",
    "tally.heading": "Live Tally",
    "common.votes": "votes",
    "common.byGroup": "by",
  },
  hi: {
    "nav.feed": "प्रस्ताव",
    "nav.tally": "लाइव गणना",
    "nav.budget": "बजट",
    "action.support": "समर्थन करें",
    "action.supported": "समर्थित",
    "action.vote": "अपना वोट डालें",
    "feed.heading": "प्रस्ताव",
    "feed.sub": "समुदाय द्वारा उठाए गए, ट्रस्ट पाइपलाइन से गुजरते हुए।",
    "tally.heading": "लाइव गणना",
    "common.votes": "वोट",
    "common.byGroup": "द्वारा",
  },
  mr: {
    "nav.feed": "प्रस्ताव",
    "nav.tally": "थेट मोजणी",
    "nav.budget": "अर्थसंकल्प",
    "action.support": "समर्थन द्या",
    "action.supported": "समर्थित",
    "action.vote": "तुमचे मत नोंदवा",
    "feed.heading": "प्रस्ताव",
    "feed.sub": "समुदायाने मांडलेले, ट्रस्ट पाइपलाइनमधून जाणारे.",
    "tally.heading": "थेट मोजणी",
    "common.votes": "मते",
    "common.byGroup": "द्वारा",
  },
};

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      t: (key) => STRINGS[lang][key] ?? STRINGS.en[key] ?? key,
    }),
    [lang],
  );
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within a LanguageProvider");
  return ctx;
}
