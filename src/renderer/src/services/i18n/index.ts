// @ts-nocheck
// @ts-nocheck
import { createI18n } from 'vue-i18n'
import type { I18n, I18nOptions } from 'vue-i18n'

// Supported locales
export const SUPPORTED_LOCALES = {
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false,
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'h:mm a',
  },
  'zh-CN': {
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    flag: '🇨🇳',
    rtl: false,
    dateFormat: 'yyyy年MM月dd日',
    timeFormat: 'HH:mm',
  },
  ja: {
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    rtl: false,
    dateFormat: 'yyyy年MM月dd日',
    timeFormat: 'HH:mm',
  },
  hi: {
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    rtl: false,
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
  },
} as const

export type SupportedLocale = keyof typeof SUPPORTED_LOCALES

// Default locale detection
export function getDefaultLocale(): SupportedLocale {
  // Try to get from localStorage first
  const stored = localStorage.getItem('user-locale') as SupportedLocale
  if (stored && stored in SUPPORTED_LOCALES) {
    return stored
  }

  // Detect from browser
  const browserLang = navigator.language.toLowerCase()

  // Direct match
  if (browserLang in SUPPORTED_LOCALES) {
    return browserLang as SupportedLocale
  }

  // Partial match (e.g., 'zh-cn' matches 'zh-CN')
  for (const locale of Object.keys(SUPPORTED_LOCALES)) {
    if (
      browserLang.startsWith(locale.toLowerCase()) ||
      locale.toLowerCase().startsWith(browserLang)
    ) {
      return locale as SupportedLocale
    }
  }

  // Check for language family matches
  const langCode = browserLang.split('-')[0]
  for (const locale of Object.keys(SUPPORTED_LOCALES)) {
    if (locale.toLowerCase().startsWith(langCode)) {
      return locale as SupportedLocale
    }
  }

  // Default to Chinese (Simplified)
  return 'zh-CN'
}

// I18n configuration with async loading
const i18nOptions: I18nOptions = {
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    // Only load default locale initially
    'zh-CN': {},
  },
  globalInjection: true,
  silentTranslationWarn: true,
  silentFallbackWarn: true,
  fallbackWarn: false,
  missingWarn: false,
  warnHtmlMessage: false,
  formatFallbackMessages: false,
  pluralizationRules: {
    'zh-CN': (choice: number) => 0,
    ja: (choice: number) => 0,
    hi: (choice: number) => (choice === 1 ? 0 : 1),
    en: (choice: number) => (choice === 1 ? 0 : 1),
  },
}

// Create i18n instance
export const i18n: I18n = createI18n(i18nOptions)

// I18n service class with lazy loading
export class I18nService {
  private i18nInstance: I18n
  private loadedLocales = new Set<SupportedLocale>(['zh-CN'])

  constructor(i18nInstance: I18n) {
    this.i18nInstance = i18nInstance
    this.init()
  }

  private async init(): Promise<void> {
    // Load default locale
    const defaultLocale = getDefaultLocale()
    await this.loadLocale(defaultLocale)

    this.updateDocumentDirection()
    this.updateDocumentLanguage()
    this.watchLocaleChanges()
  }

  // Lazy load locale
  private async loadLocale(locale: SupportedLocale): Promise<void> {
    if (this.loadedLocales.has(locale)) {
      return
    }

    try {
      // Dynamic import for proper code splitting
      const messages = await import(`@/locales/${locale}.ts`)
      this.i18nInstance.global.setLocaleMessage(locale, messages.default)
      this.loadedLocales.add(locale)
    } catch (error) {
      console.warn(`Failed to load locale ${locale}:`, error)
    }
  }

  // Get current locale
  getCurrentLocale(): SupportedLocale {
    return this.i18nInstance.global.locale.value as SupportedLocale
  }

  // Set locale with lazy loading
  async setLocale(locale: SupportedLocale): Promise<void> {
    if (!SUPPORTED_LOCALES[locale]) {
      console.warn(`Unsupported locale: ${locale}`)
      return
    }

    // Load locale if not already loaded
    await this.loadLocale(locale)

    // Set the locale
    this.i18nInstance.global.locale.value = locale

    // Persist to localStorage
    localStorage.setItem('user-locale', locale)

    // Update document attributes
    this.updateDocumentDirection()
    this.updateDocumentLanguage()
  }

  // Get available locales
  getAvailableLocales(): Array<{
    code: SupportedLocale
    name: string
    nativeName: string
    flag: string
    current: boolean
  }> {
    const currentLocale = this.getCurrentLocale()

    return Object.entries(SUPPORTED_LOCALES).map(([code, info]) => ({
      code: code as SupportedLocale,
      name: info.name,
      nativeName: info.nativeName,
      flag: info.flag,
      current: code === currentLocale,
    }))
  }

  // Get locale info
  getLocaleInfo(locale?: SupportedLocale): (typeof SUPPORTED_LOCALES)[SupportedLocale] {
    const targetLocale = locale || this.getCurrentLocale()
    return SUPPORTED_LOCALES[targetLocale]
  }

  // Translation helpers
  t(key: string, params?: Record<string, any>, locale?: SupportedLocale): string {
    const { t } = this.i18nInstance.global
    if (locale) {
      return t(key, params, { locale })
    }
    return t(key, params)
  }

  // Private methods
  private updateDocumentDirection(): void {
    const locale = this.getCurrentLocale()
    const localeInfo = this.getLocaleInfo(locale)
    document.documentElement.dir = localeInfo.rtl ? 'rtl' : 'ltr'
  }

  private updateDocumentLanguage(): void {
    const locale = this.getCurrentLocale()
    document.documentElement.lang = locale
  }

  private watchLocaleChanges(): void {
    // Minimal implementation
  }
}

// Create and export service instance
export const i18nService = new I18nService(i18n)

// Vue plugin installation helper
export function setupI18n(app: any): void {
  app.use(i18n)
  app.provide('i18nService', i18nService)
  app.config.globalProperties.$i18nService = i18nService
}

// Composable for using i18n service
export function useI18nService(): I18nService {
  return i18nService
}

// Utility functions
export function isRTL(locale?: SupportedLocale): boolean {
  const targetLocale = locale || i18nService.getCurrentLocale()
  return SUPPORTED_LOCALES[targetLocale]?.rtl || false
}

export default i18n
