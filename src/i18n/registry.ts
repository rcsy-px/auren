import type { Locale } from "../types/dashboard";
import { de } from "./locales/de";
import { en } from "./locales/en";
import { fr } from "./locales/fr";
import { hu } from "./locales/hu";
import type { LocaleDefinition } from "./types";

export const fallbackLocale: Locale = "hu";

export const localeRegistry = {
  hu,
  en,
  de,
  fr,
} satisfies Record<Locale, LocaleDefinition>;

export const availableLocales = Object.values(localeRegistry).map(({ code, name, nativeName }) => ({
  code,
  name,
  nativeName,
}));

export function getLocaleDefinition(locale: Locale) {
  return localeRegistry[locale] ?? localeRegistry[fallbackLocale];
}
