import type { Locale } from "../types/dashboard";
import { useDashboardStore } from "../store/dashboardStore";
import { fallbackLocale, getLocaleDefinition } from "./registry";
import type { TranslationTree, TranslationValue } from "./types";
import { useCallback } from "react";

type Params = Record<string, string | number>;

function readPath(tree: TranslationTree, key: string): TranslationValue | undefined {
  return key.split(".").reduce<TranslationValue | undefined>((value, part) => {
    if (!value || typeof value === "string") return undefined;
    return value[part];
  }, tree);
}

function interpolate(value: string, params?: Params) {
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (match, name) => String(params[name] ?? match));
}

export function translate(locale: Locale, key: string, params?: Params) {
  const localValue = readPath(getLocaleDefinition(locale).translations, key);
  const fallbackValue = readPath(getLocaleDefinition(fallbackLocale).translations, key);
  const value = typeof localValue === "string"
    ? localValue
    : typeof fallbackValue === "string"
      ? fallbackValue
      : key;
  return interpolate(value, params);
}

export function useI18n() {
  const locale = useDashboardStore((state) => state.settings.locale ?? fallbackLocale);
  const definition = getLocaleDefinition(locale);

  return {
    locale,
    dateLocale: definition.dateLocale,
    t: useCallback((key: string, params?: Params) => translate(locale, key, params), [locale]),
  };
}



