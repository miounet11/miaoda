import { createI18n } from 'vue-i18n'
import type { I18n, I18nOptions } from 'vue-i18n'

// Import language files
import en from '@/locales/en'
import zhCN from '@/locales/zh-CN'
import ja from '@/locales/ja'
import hi from '@/locales/hi'

// Supported locales
export const SUPPORTED_LOCALES = {
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false,
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'h:mm a'
  },
  'zh-CN': {
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    flag: '🇨🇳',
    rtl: false,
    dateFormat: 'yyyy年MM月dd日',
    timeFormat: 'HH:mm'
  },
  ja: {
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    rtl: false,
    dateFormat: 'yyyy年MM月dd日',
    timeFormat: 'HH:mm'
  },
  hi: {
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    rtl: false,
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm'
  }
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

  // Default to Chinese (Simplified) for Chinese users
  return 'zh-CN'
}

// I18n configuration
const i18nOptions: I18nOptions = {
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: 'zh-CN', // 回退到中文而非英文
  messages: {
    en,
    'zh-CN': zhCN,
    ja,
    hi
  },
  globalInjection: true,
  silentTranslationWarn: false,
  silentFallbackWarn: false,
  fallbackWarn: true,
  missingWarn: true,
  warnHtmlMessage: true,
  formatFallbackMessages: false,
  modifiers: {
    // Custom modifiers for text formatting
    upper: (str: string) => str.toUpperCase(),
    lower: (str: string) => str.toLowerCase(),
    capitalize: (str: string) => str.charAt(0).toUpperCase() + str.slice(1),
    title: (str: string) =>
      str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
  },
  pluralizationRules: {
    // Chinese and Japanese don't have plural forms
    'zh-CN': (choice: number) => 0,
    ja: (choice: number) => 0,
    hi: (choice: number) => (choice === 1 ? 0 : 1),
    en: (choice: number) => (choice === 1 ? 0 : 1)
  },
  datetimeFormats: {
    en: {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: 'numeric',
        minute: 'numeric'
      },
      time: {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }
    },
    'zh-CN': {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: 'numeric',
        minute: 'numeric'
      },
      time: {
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      }
    },
    ja: {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: 'numeric',
        minute: 'numeric'
      },
      time: {
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      }
    },
    hi: {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: 'numeric',
        minute: 'numeric'
      },
      time: {
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      }
    }
  },
  numberFormats: {
    en: {
      currency: {
        style: 'currency',
        currency: 'USD',
        currencyDisplay: 'symbol'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      },
      percent: {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }
    },
    'zh-CN': {
      currency: {
        style: 'currency',
        currency: 'CNY',
        currencyDisplay: 'symbol'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      },
      percent: {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }
    },
    ja: {
      currency: {
        style: 'currency',
        currency: 'JPY',
        currencyDisplay: 'symbol'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      },
      percent: {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }
    },
    hi: {
      currency: {
        style: 'currency',
        currency: 'INR',
        currencyDisplay: 'symbol'
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      },
      percent: {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }
    }
  }
}

// Create i18n instance
export const i18n: I18n = createI18n(i18nOptions)

// I18n service class
export class I18nService {
  private i18nInstance: I18n

  constructor(i18nInstance: I18n) {
    this.i18nInstance = i18nInstance
    this.init()
  }

  private init(): void {
    // Set document direction based on current locale
    this.updateDocumentDirection()

    // Set document language
    this.updateDocumentLanguage()

    // Watch for locale changes
    this.watchLocaleChanges()
  }

  // Get current locale
  getCurrentLocale(): SupportedLocale {
    return this.i18nInstance.global.locale.value as SupportedLocale
  }

  // Set locale
  async setLocale(locale: SupportedLocale): Promise<void> {
    if (!SUPPORTED_LOCALES[locale]) {
      console.warn(`Unsupported locale: ${locale}`)
      return
    }

    // Load locale messages if not already loaded
    if (!this.i18nInstance.global.availableLocales.includes(locale)) {
      try {
        const messages = await this.loadLocaleMessages(locale)
        this.i18nInstance.global.setLocaleMessage(locale, messages)
      } catch (error) {
        console.error(`Failed to load locale ${locale}:`, error)
        return
      }
    }

    // Set the locale
    this.i18nInstance.global.locale.value = locale

    // Persist to localStorage
    localStorage.setItem('user-locale', locale)

    // Update document attributes
    this.updateDocumentDirection()
    this.updateDocumentLanguage()

    console.log(`Locale changed to: ${locale}`)
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
      current: code === currentLocale
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

  tc(key: string, choice: number, params?: Record<string, any>, locale?: SupportedLocale): string {
    const { tc } = this.i18nInstance.global
    if (locale) {
      return tc(key, choice, params, { locale })
    }
    return tc(key, choice, params)
  }

  te(key: string, locale?: SupportedLocale): boolean {
    const { te } = this.i18nInstance.global
    if (locale) {
      return te(key, locale)
    }
    return te(key)
  }

  // Date/time formatting
  d(value: number | Date, format?: string, locale?: SupportedLocale): string {
    const { d } = this.i18nInstance.global
    if (locale) {
      return d(value, format, locale)
    }
    return d(value, format)
  }

  // Number formatting
  n(value: number, format?: string, locale?: SupportedLocale): string {
    const { n } = this.i18nInstance.global
    if (locale) {
      return n(value, format, locale)
    }
    return n(value, format)
  }

  // Relative time formatting
  rt(value: number | Date): string {
    const now = new Date()
    const date = value instanceof Date ? value : new Date(value)
    const diff = now.getTime() - date.getTime()

    const rtf = new Intl.RelativeTimeFormat(this.getCurrentLocale(), {
      numeric: 'auto',
      style: 'long'
    })

    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)

    if (Math.abs(years) > 0) {
      return rtf.format(-years, 'year')
    } else if (Math.abs(months) > 0) {
      return rtf.format(-months, 'month')
    } else if (Math.abs(weeks) > 0) {
      return rtf.format(-weeks, 'week')
    } else if (Math.abs(days) > 0) {
      return rtf.format(-days, 'day')
    } else if (Math.abs(hours) > 0) {
      return rtf.format(-hours, 'hour')
    } else if (Math.abs(minutes) > 0) {
      return rtf.format(-minutes, 'minute')
    } else {
      return this.t('time.justNow')
    }
  }

  // Format file size with localization
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    const value = bytes / Math.pow(k, i)
    return `${this.n(value, 'decimal')} ${sizes[i]}`
  }

  // Format currency
  formatCurrency(amount: number, currency?: string): string {
    const locale = this.getCurrentLocale()
    const localeInfo = this.getLocaleInfo()

    let defaultCurrency = 'USD'
    switch (locale) {
      case 'zh-CN':
        defaultCurrency = 'CNY'
        break
      case 'ja':
        defaultCurrency = 'JPY'
        break
      case 'hi':
        defaultCurrency = 'INR'
        break
      default:
        defaultCurrency = 'USD'
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || defaultCurrency
    }).format(amount)
  }

  // Pluralization helper
  plural(count: number, key: string, params?: Record<string, any>): string {
    return this.tc(key, count, { count, ...params })
  }

  // Private methods
  private async loadLocaleMessages(locale: SupportedLocale): Promise<any> {
    try {
      // Dynamic import for code splitting
      const messages = await import(`@/locales/${locale}.ts`)
      return messages.default
    } catch (error) {
      console.error(`Failed to load locale messages for ${locale}:`, error)
      throw error
    }
  }

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
    // Watch for system locale changes
    if ('navigator' in window && 'language' in navigator) {
      // Note: This doesn't actually watch for changes in most browsers
      // It's here for potential future use
    }
  }
}

// Create and export service instance
export const i18nService = new I18nService(i18n)

// Vue plugin installation helper
export function setupI18n(app: any): void {
  app.use(i18n)

  // Provide i18n service globally
  app.provide('i18nService', i18nService)

  // Add global properties
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

export function getLocaleDateFormat(locale?: SupportedLocale): string {
  const targetLocale = locale || i18nService.getCurrentLocale()
  return SUPPORTED_LOCALES[targetLocale]?.dateFormat || 'MM/dd/yyyy'
}

export function getLocaleTimeFormat(locale?: SupportedLocale): string {
  const targetLocale = locale || i18nService.getCurrentLocale()
  return SUPPORTED_LOCALES[targetLocale]?.timeFormat || 'h:mm a'
}

// Helper for component templates
export function createI18nHelpers() {
  return {
    t: i18nService.t.bind(i18nService),
    tc: i18nService.tc.bind(i18nService),
    te: i18nService.te.bind(i18nService),
    d: i18nService.d.bind(i18nService),
    n: i18nService.n.bind(i18nService),
    rt: i18nService.rt.bind(i18nService),
    formatFileSize: i18nService.formatFileSize.bind(i18nService),
    formatCurrency: i18nService.formatCurrency.bind(i18nService),
    plural: i18nService.plural.bind(i18nService),
    getCurrentLocale: i18nService.getCurrentLocale.bind(i18nService),
    setLocale: i18nService.setLocale.bind(i18nService),
    getAvailableLocales: i18nService.getAvailableLocales.bind(i18nService),
    isRTL: () => isRTL()
  }
}

export default i18n
