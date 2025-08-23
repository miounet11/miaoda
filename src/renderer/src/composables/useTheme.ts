import { ref, computed, watch, onMounted } from 'vue'
import type { Theme, ThemeColors, ThemeConfig } from '@renderer/src/types'

export function useTheme() {
  const currentTheme = ref<Theme>('system')
  const systemPrefersDark = ref(false)

  // Check system preference
  const updateSystemPreference = () => {
    systemPrefersDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  // Computed actual theme
  const effectiveTheme = computed(() => {
    if (currentTheme.value === 'system') {
      return systemPrefersDark.value ? 'dark' : 'light'
    }
    return currentTheme.value
  })

  const isDark = computed(() => effectiveTheme.value === 'dark')
  const isLight = computed(() => effectiveTheme.value === 'light')

  // Theme colors
  const colors = computed<ThemeColors>(() => {
    const theme = effectiveTheme.value

    const lightColors: ThemeColors = {
      primary: 'hsl(221, 83%, 53%)',
      secondary: 'hsl(210, 20%, 96%)',
      accent: 'hsl(210, 20%, 98%)',
      background: 'hsl(0, 0%, 100%)',
      surface: 'hsl(0, 0%, 98%)',
      error: 'hsl(0, 84%, 60%)',
      warning: 'hsl(38, 92%, 50%)',
      info: 'hsl(199, 89%, 48%)',
      success: 'hsl(142, 71%, 45%)',
      text: 'hsl(222, 47%, 11%)',
      textSecondary: 'hsl(215, 20%, 45%)',
      border: 'hsl(214, 32%, 91%)',
      shadow: 'rgba(0, 0, 0, 0.1)'
    }

    const darkColors: ThemeColors = {
      primary: 'hsl(221, 83%, 65%)',
      secondary: 'hsl(217, 33%, 17%)',
      accent: 'hsl(217, 33%, 15%)',
      background: 'hsl(222, 47%, 11%)',
      surface: 'hsl(222, 47%, 15%)',
      error: 'hsl(0, 84%, 70%)',
      warning: 'hsl(38, 92%, 60%)',
      info: 'hsl(199, 89%, 58%)',
      success: 'hsl(142, 71%, 55%)',
      text: 'hsl(210, 20%, 98%)',
      textSecondary: 'hsl(215, 20%, 65%)',
      border: 'hsl(215, 20%, 25%)',
      shadow: 'rgba(0, 0, 0, 0.3)'
    }

    return theme === 'dark' ? darkColors : lightColors
  })

  // Apply theme to document
  const applyTheme = () => {
    const root = document.documentElement
    const theme = effectiveTheme.value

    // Set theme attribute
    root.setAttribute('data-theme', theme)

    // Apply CSS custom properties
    Object.entries(colors.value).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', colors.value.background)
    }
  }

  // Set theme
  const setTheme = (theme: Theme) => {
    currentTheme.value = theme
    localStorage.setItem('theme', theme)
  }

  // Toggle between light and dark
  const toggleTheme = () => {
    if (currentTheme.value === 'system') {
      setTheme(systemPrefersDark.value ? 'light' : 'dark')
    } else {
      setTheme(currentTheme.value === 'light' ? 'dark' : 'light')
    }
  }

  // Get theme options
  const themeOptions = [
    { value: 'light', label: 'Light', icon: 'sun' },
    { value: 'dark', label: 'Dark', icon: 'moon' },
    { value: 'system', label: 'System', icon: 'monitor' }
  ] as const

  // Theme animation
  const animateThemeChange = () => {
    const root = document.documentElement

    // Add transition class
    root.classList.add('theme-transitioning')

    // Remove after animation
    setTimeout(() => {
      root.classList.remove('theme-transitioning')
    }, 300)
  }

  // Create custom theme
  const createCustomTheme = (
    name: string,
    lightColors: Partial<ThemeColors>,
    darkColors: Partial<ThemeColors>
  ): ThemeConfig => {
    return {
      name,
      displayName: name,
      colors: {
        light: { ...colors.value, ...lightColors },
        dark: { ...colors.value, ...darkColors }
      },
      fonts: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif']
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem'
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      },
      animations: {
        fast: '0.15s ease-out',
        normal: '0.3s ease-out',
        slow: '0.5s ease-out'
      }
    }
  }

  // Get color with opacity
  const getColorWithOpacity = (colorKey: keyof ThemeColors, opacity: number) => {
    const color = colors.value[colorKey]

    // If it's already an HSL color, we can modify the alpha
    if (color.startsWith('hsl(')) {
      return color.replace('hsl(', 'hsla(').replace(')', `, ${opacity})`)
    }

    // For other formats, we'd need more complex parsing
    return color
  }

  // Generate CSS variables
  const generateCSSVariables = () => {
    return Object.entries(colors.value)
      .map(([key, value]) => `--color-${key}: ${value};`)
      .join('\n')
  }

  // Load saved theme
  const loadSavedTheme = () => {
    const saved = localStorage.getItem('theme') as Theme
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      currentTheme.value = saved
    }
  }

  // Watch for theme changes
  watch(effectiveTheme, () => {
    applyTheme()
    animateThemeChange()
  })

  // Setup
  onMounted(() => {
    // Load saved theme
    loadSavedTheme()

    // Check system preference
    updateSystemPreference()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateSystemPreference)

    // Apply initial theme
    applyTheme()

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', updateSystemPreference)
    }
  })

  return {
    // State
    currentTheme,
    effectiveTheme,
    isDark,
    isLight,
    colors,

    // Methods
    setTheme,
    toggleTheme,
    applyTheme,
    createCustomTheme,
    getColorWithOpacity,
    generateCSSVariables,

    // Constants
    themeOptions
  }
}

// Global theme manager
let globalThemeManager: ReturnType<typeof useTheme> | null = null

export function useGlobalTheme() {
  if (!globalThemeManager) {
    globalThemeManager = useTheme()
  }
  return globalThemeManager
}
