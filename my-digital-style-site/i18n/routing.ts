import {routing, type LocalePrefix} from 'next-intl/routing';

export const availableLocales = ['ja', 'en'] as const;
export type AppLocale = (typeof availableLocales)[number];

export const routingConfig = routing<LocalePrefix>('as-needed', {
  locales: availableLocales,
  defaultLocale: 'ja'
});
