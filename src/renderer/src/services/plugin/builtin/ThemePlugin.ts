import type { PluginModule, PluginContext } from '../PluginManager'

/**
 * Built-in Theme Plugin
 * Provides advanced theming capabilities and custom theme support
 */
export class ThemePlugin implements PluginModule {
  private context: PluginContext | null = null
  private currentTheme: string = 'system'
  private customThemes: Map<string, ThemeConfig> = new Map()
  private mediaQuery: MediaQueryList | null = null

  async activate(context: PluginContext): Promise<void> {
    this.context = context
    console.log('Theme Plugin activated!')

    // Load saved themes and preferences
    await this.loadThemePreferences()
    await this.loadCustomThemes()

    // Set up system theme detection
    this.setupSystemThemeDetection()

    // Apply current theme
    await this.applyTheme(this.currentTheme)

    // Register CSS custom properties
    this.registerThemeVariables()
  }

  async deactivate(context: PluginContext): Promise<void> {
    console.log('Theme Plugin deactivated!')

    // Clean up media query listener
    if (this.mediaQuery) {
      this.mediaQuery.removeListener(this.onSystemThemeChange.bind(this))
    }

    this.context = null
  }

  // Hook: Called when theme changes
  async onThemeChange(data: any, context: PluginContext): Promise<any> {
    console.log('Theme Plugin: Theme changed', data)

    // Apply theme-specific enhancements
    await this.enhanceTheme(data.theme)

    // Save theme preference
    await context.storage.set('currentTheme', data.theme)
    this.currentTheme = data.theme

    return data
  }

  // Hook: Called when settings change
  async onSettingsChange(data: any, context: PluginContext): Promise<any> {
    console.log('Theme Plugin: Settings changed', data)

    // Check if theme-related settings changed
    if (data.theme) {
      await this.applyTheme(data.theme)
    }

    return data
  }

  // Hook: Called on app initialization
  async onAppInit(data: any, context: PluginContext): Promise<any> {
    console.log('Theme Plugin: App initialized')

    // Ensure theme is properly applied after app loads
    setTimeout(() => {
      this.applyTheme(this.currentTheme)
    }, 100)

    return data
  }

  // Public methods for theme management
  async setTheme(themeName: string): Promise<void> {
    if (!this.context) return

    await this.applyTheme(themeName)
    await this.context.storage.set('currentTheme', themeName)
    this.currentTheme = themeName

    // Notify other components
    this.context.showNotification(`Theme changed to ${themeName}`, 'info')
  }

  async createCustomTheme(themeConfig: ThemeConfig): Promise<void> {
    if (!this.context) return

    // Validate theme config
    if (!this.validateThemeConfig(themeConfig)) {
      throw new Error('Invalid theme configuration')
    }

    // Save custom theme
    this.customThemes.set(themeConfig.id, themeConfig)
    await this.saveCustomThemes()

    this.context.showNotification(`Custom theme "${themeConfig.name}" created!`, 'success')
  }

  async deleteCustomTheme(themeId: string): Promise<void> {
    if (!this.context) return

    if (this.customThemes.has(themeId)) {
      // Switch to default theme if currently using the deleted theme
      if (this.currentTheme === themeId) {
        await this.setTheme('system')
      }

      this.customThemes.delete(themeId)
      await this.saveCustomThemes()

      this.context.showNotification('Custom theme deleted', 'info')
    }
  }

  getAvailableThemes(): ThemeInfo[] {
    const builtinThemes: ThemeInfo[] = [
      {
        id: 'system',
        name: 'System',
        description: 'Follow system theme preference',
        type: 'builtin',
        preview: this.generateThemePreview('system')
      },
      {
        id: 'light',
        name: 'Light',
        description: 'Clean light theme',
        type: 'builtin',
        preview: this.generateThemePreview('light')
      },
      {
        id: 'dark',
        name: 'Dark',
        description: 'Easy on eyes dark theme',
        type: 'builtin',
        preview: this.generateThemePreview('dark')
      },
      {
        id: 'high-contrast',
        name: 'High Contrast',
        description: 'Enhanced contrast for accessibility',
        type: 'builtin',
        preview: this.generateThemePreview('high-contrast')
      }
    ]

    const customThemes: ThemeInfo[] = Array.from(this.customThemes.values()).map(theme => ({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      type: 'custom',
      preview: this.generateThemePreview(theme.id)
    }))

    return [...builtinThemes, ...customThemes]
  }

  getCurrentTheme(): string {
    return this.currentTheme
  }

  // Private methods
  private async loadThemePreferences(): Promise<void> {
    if (!this.context) return

    this.currentTheme = await this.context.storage.get('currentTheme', 'system')
  }

  private async loadCustomThemes(): Promise<void> {
    if (!this.context) return

    try {
      const saved = await this.context.storage.get('customThemes', {})
      for (const [id, config] of Object.entries(saved)) {
        this.customThemes.set(id, config as ThemeConfig)
      }
    } catch (error) {
      console.warn('Failed to load custom themes:', error)
    }
  }

  private async saveCustomThemes(): Promise<void> {
    if (!this.context) return

    const themesObject = Object.fromEntries(this.customThemes)
    await this.context.storage.set('customThemes', themesObject)
  }

  private setupSystemThemeDetection(): void {
    if (typeof window === 'undefined') return

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.mediaQuery.addListener(this.onSystemThemeChange.bind(this))
  }

  private onSystemThemeChange(e: MediaQueryListEvent): void {
    if (this.currentTheme === 'system') {
      this.applySystemTheme(e.matches)
    }
  }

  private async applyTheme(themeName: string): Promise<void> {
    const root = document.documentElement

    // Remove existing theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-high-contrast')

    switch (themeName) {
      case 'system':
        this.applySystemTheme()
        break
      case 'light':
        root.classList.add('theme-light')
        this.applyBuiltinTheme('light')
        break
      case 'dark':
        root.classList.add('theme-dark')
        this.applyBuiltinTheme('dark')
        break
      case 'high-contrast':
        root.classList.add('theme-high-contrast')
        this.applyBuiltinTheme('high-contrast')
        break
      default:
        // Custom theme
        const customTheme = this.customThemes.get(themeName)
        if (customTheme) {
          await this.applyCustomTheme(customTheme)
        }
        break
    }

    // Emit theme change event
    if (this.context) {
      // Trigger hook for other plugins
      // Note: This would normally be handled by the plugin manager
      console.log('Theme applied:', themeName)
    }
  }

  private applySystemTheme(isDark?: boolean): void {
    if (isDark === undefined) {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    const root = document.documentElement
    if (isDark) {
      root.classList.add('theme-dark')
      this.applyBuiltinTheme('dark')
    } else {
      root.classList.add('theme-light')
      this.applyBuiltinTheme('light')
    }
  }

  private applyBuiltinTheme(theme: string): void {
    const themes: Record<string, Record<string, string>> = {
      light: {
        '--color-background': '#ffffff',
        '--color-foreground': '#0f0f0f',
        '--color-muted': '#f1f5f9',
        '--color-muted-foreground': '#64748b',
        '--color-border': '#e2e8f0',
        '--color-primary': '#0f172a',
        '--color-primary-foreground': '#f8fafc',
        '--color-accent': '#f1f5f9',
        '--color-accent-foreground': '#0f172a'
      },
      dark: {
        '--color-background': '#0a0a0a',
        '--color-foreground': '#fafafa',
        '--color-muted': '#1a1a1a',
        '--color-muted-foreground': '#a1a1aa',
        '--color-border': '#27272a',
        '--color-primary': '#fafafa',
        '--color-primary-foreground': '#0a0a0a',
        '--color-accent': '#1a1a1a',
        '--color-accent-foreground': '#fafafa'
      },
      'high-contrast': {
        '--color-background': '#000000',
        '--color-foreground': '#ffffff',
        '--color-muted': '#1a1a1a',
        '--color-muted-foreground': '#cccccc',
        '--color-border': '#444444',
        '--color-primary': '#ffffff',
        '--color-primary-foreground': '#000000',
        '--color-accent': '#333333',
        '--color-accent-foreground': '#ffffff'
      }
    }

    const themeVars = themes[theme]
    if (themeVars) {
      this.setCSSVariables(themeVars)
    }
  }

  private async applyCustomTheme(theme: ThemeConfig): Promise<void> {
    // Apply custom CSS variables
    this.setCSSVariables(theme.colors)

    // Apply custom CSS if provided
    if (theme.customCSS) {
      this.injectCustomCSS(theme.id, theme.customCSS)
    }

    // Apply custom fonts
    if (theme.fonts) {
      this.applyCustomFonts(theme.fonts)
    }
  }

  private setCSSVariables(variables: Record<string, string>): void {
    const root = document.documentElement
    for (const [property, value] of Object.entries(variables)) {
      root.style.setProperty(property, value)
    }
  }

  private injectCustomCSS(themeId: string, css: string): void {
    // Remove existing custom CSS for this theme
    const existingStyle = document.getElementById(`custom-theme-${themeId}`)
    if (existingStyle) {
      existingStyle.remove()
    }

    // Inject new custom CSS
    const style = document.createElement('style')
    style.id = `custom-theme-${themeId}`
    style.textContent = css
    document.head.appendChild(style)
  }

  private applyCustomFonts(fonts: ThemeConfig['fonts']): void {
    if (!fonts) return

    const root = document.documentElement
    if (fonts.primary) {
      root.style.setProperty('--font-primary', fonts.primary)
    }
    if (fonts.mono) {
      root.style.setProperty('--font-mono', fonts.mono)
    }
  }

  private registerThemeVariables(): void {
    // Register CSS custom properties for theme system
    const style = document.createElement('style')
    style.textContent = `
      :root {
        /* Theme transition */
        * {
          transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }
        
        /* Font variables */
        --font-primary: system-ui, -apple-system, sans-serif;
        --font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      }
    `
    document.head.appendChild(style)
  }

  private validateThemeConfig(config: ThemeConfig): boolean {
    return !!(
      config.id &&
      config.name &&
      config.description &&
      config.colors &&
      typeof config.colors === 'object'
    )
  }

  private generateThemePreview(themeId: string): string {
    // Generate a data URL for theme preview
    // This is a simplified version - would normally generate an actual preview image
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="120" height="80" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="80" fill="${this.getThemeColor(themeId, 'background')}"/>
        <rect x="10" y="10" width="100" height="15" fill="${this.getThemeColor(themeId, 'primary')}" rx="2"/>
        <rect x="10" y="35" width="60" height="10" fill="${this.getThemeColor(themeId, 'muted')}" rx="2"/>
        <rect x="10" y="55" width="80" height="10" fill="${this.getThemeColor(themeId, 'accent')}" rx="2"/>
      </svg>
    `)}`
  }

  private getThemeColor(themeId: string, colorType: string): string {
    // Return appropriate color for theme preview
    const colorMaps: Record<string, Record<string, string>> = {
      light: {
        background: '#ffffff',
        primary: '#0f172a',
        muted: '#f1f5f9',
        accent: '#e2e8f0'
      },
      dark: {
        background: '#0a0a0a',
        primary: '#fafafa',
        muted: '#1a1a1a',
        accent: '#27272a'
      },
      'high-contrast': {
        background: '#000000',
        primary: '#ffffff',
        muted: '#333333',
        accent: '#666666'
      },
      system: {
        background: '#f8f9fa',
        primary: '#343a40',
        muted: '#dee2e6',
        accent: '#ced4da'
      }
    }

    return colorMaps[themeId]?.[colorType] || '#cccccc'
  }

  private async enhanceTheme(themeName: string): Promise<void> {
    // Add theme-specific enhancements
    switch (themeName) {
      case 'dark':
        // Enhance readability in dark mode
        this.enhanceDarkMode()
        break
      case 'high-contrast':
        // Add accessibility enhancements
        this.enhanceAccessibility()
        break
      default:
        break
    }
  }

  private enhanceDarkMode(): void {
    // Add subtle glow effects and improved contrast for dark mode
    const style = document.createElement('style')
    style.id = 'dark-mode-enhancements'
    style.textContent = `
      .theme-dark {
        --shadow-glow: 0 0 20px rgba(255, 255, 255, 0.1);
      }
      
      .theme-dark .message-bubble {
        box-shadow: var(--shadow-glow);
      }
      
      .theme-dark .plugin-card:hover {
        box-shadow: 0 4px 20px rgba(255, 255, 255, 0.1);
      }
    `
    document.head.appendChild(style)
  }

  private enhanceAccessibility(): void {
    // Add high contrast accessibility enhancements
    const style = document.createElement('style')
    style.id = 'accessibility-enhancements'
    style.textContent = `
      .theme-high-contrast {
        --focus-ring: 2px solid #ffffff;
      }
      
      .theme-high-contrast *:focus {
        outline: var(--focus-ring);
        outline-offset: 2px;
      }
      
      .theme-high-contrast button:hover {
        background-color: #333333 !important;
      }
    `
    document.head.appendChild(style)
  }
}

// Types
interface ThemeConfig {
  id: string
  name: string
  description: string
  colors: Record<string, string>
  fonts?: {
    primary?: string
    mono?: string
  }
  customCSS?: string
}

interface ThemeInfo {
  id: string
  name: string
  description: string
  type: 'builtin' | 'custom'
  preview: string
}

// Plugin manifest
export const manifest = {
  id: 'builtin-theme',
  name: 'Theme Manager',
  version: '1.0.0',
  description: 'Advanced theming system with custom theme support and accessibility features.',
  author: 'MiaoDa Team',
  category: 'customization' as const,
  minAppVersion: '1.0.0',
  requiredPermissions: ['storage'] as const,
  settings: [
    {
      key: 'currentTheme',
      type: 'select' as const,
      title: 'Current theme',
      description: 'Select the active theme',
      default: 'system',
      required: true,
      options: [
        { label: 'System', value: 'system' },
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'High Contrast', value: 'high-contrast' }
      ]
    },
    {
      key: 'smoothTransitions',
      type: 'boolean' as const,
      title: 'Smooth transitions',
      description: 'Enable smooth color transitions when switching themes',
      default: true,
      required: false
    },
    {
      key: 'autoSwitchTime',
      type: 'boolean' as const,
      title: 'Auto-switch based on time',
      description: 'Automatically switch between light and dark themes based on time of day',
      default: false,
      required: false
    }
  ]
}

// Export plugin instance
export default new ThemePlugin()
