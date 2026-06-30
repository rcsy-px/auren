import type { Locale } from "../types/dashboard";

export type TranslationValue = string | { [key: string]: TranslationValue };
export type TranslationTree = Record<string, TranslationValue>;

export type LocaleDefinition = {
  code: Locale;
  name: string;
  nativeName: string;
  dateLocale: string;
  translations: TranslationTree;
};

