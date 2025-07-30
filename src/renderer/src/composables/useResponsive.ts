import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Breakpoints, ResponsiveValue } from '@renderer/src/types'

export function useResponsive() {
  const windowWidth = ref(0)
  const windowHeight = ref(0)
  
  // Standard breakpoints (Tailwind CSS compatible)
  const breakpoints: Breakpoints = {
    xs: 475,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  }
  
  // Update window dimensions
  const updateDimensions = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
  }
  
  // Computed breakpoint checks
  const isXs = computed(() => windowWidth.value >= breakpoints.xs)
  const isSm = computed(() => windowWidth.value >= breakpoints.sm)
  const isMd = computed(() => windowWidth.value >= breakpoints.md)
  const isLg = computed(() => windowWidth.value >= breakpoints.lg)
  const isXl = computed(() => windowWidth.value >= breakpoints.xl)
  const is2Xl = computed(() => windowWidth.value >= breakpoints['2xl'])
  
  // Current breakpoint
  const currentBreakpoint = computed(() => {
    if (is2Xl.value) return '2xl'
    if (isXl.value) return 'xl'
    if (isLg.value) return 'lg'
    if (isMd.value) return 'md'
    if (isSm.value) return 'sm'
    if (isXs.value) return 'xs'
    return 'base'
  })
  
  // Device type detection
  const isMobile = computed(() => windowWidth.value < breakpoints.md)
  const isTablet = computed(() => windowWidth.value >= breakpoints.md && windowWidth.value < breakpoints.lg)
  const isDesktop = computed(() => windowWidth.value >= breakpoints.lg)
  
  // Orientation
  const isPortrait = computed(() => windowHeight.value > windowWidth.value)
  const isLandscape = computed(() => windowWidth.value > windowHeight.value)
  
  // Screen size categories
  const isSmallScreen = computed(() => windowWidth.value < breakpoints.sm)
  const isMediumScreen = computed(() => windowWidth.value >= breakpoints.sm && windowWidth.value < breakpoints.xl)
  const isLargeScreen = computed(() => windowWidth.value >= breakpoints.xl)
  
  // Touch device detection
  const isTouchDevice = computed(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })
  
  // Responsive value resolver
  const resolveResponsiveValue = <T>(value: ResponsiveValue<T> | T): T => {
    if (typeof value !== 'object' || value === null) {
      return value as T
    }
    
    const responsiveValue = value as ResponsiveValue<T>
    
    // Check breakpoints in descending order
    if (is2Xl.value && responsiveValue['2xl'] !== undefined) return responsiveValue['2xl']
    if (isXl.value && responsiveValue.xl !== undefined) return responsiveValue.xl
    if (isLg.value && responsiveValue.lg !== undefined) return responsiveValue.lg
    if (isMd.value && responsiveValue.md !== undefined) return responsiveValue.md
    if (isSm.value && responsiveValue.sm !== undefined) return responsiveValue.sm
    if (isXs.value && responsiveValue.xs !== undefined) return responsiveValue.xs
    
    // Fallback to base value
    return responsiveValue.base as T
  }
  
  // CSS class helpers
  const getResponsiveClasses = (classMap: ResponsiveValue<string>) => {
    const classes: string[] = []
    
    if (classMap.base) classes.push(classMap.base)
    if (classMap.xs && isXs.value) classes.push(`xs:${classMap.xs}`)
    if (classMap.sm && isSm.value) classes.push(`sm:${classMap.sm}`)
    if (classMap.md && isMd.value) classes.push(`md:${classMap.md}`)
    if (classMap.lg && isLg.value) classes.push(`lg:${classMap.lg}`)
    if (classMap.xl && isXl.value) classes.push(`xl:${classMap.xl}`)
    if (classMap['2xl'] && is2Xl.value) classes.push(`2xl:${classMap['2xl']}`)
    
    return classes.join(' ')
  }
  
  // Grid columns helper
  const getResponsiveColumns = (columns: ResponsiveValue<number>) => {
    return resolveResponsiveValue(columns)
  }
  
  // Spacing helper
  const getResponsiveSpacing = (spacing: ResponsiveValue<string>) => {
    return resolveResponsiveValue(spacing)
  }
  
  // Media query helpers
  const matchesMediaQuery = (query: string) => {
    return window.matchMedia(query).matches
  }
  
  const createMediaQuery = (minWidth?: number, maxWidth?: number) => {
    const conditions: string[] = []
    
    if (minWidth) conditions.push(`(min-width: ${minWidth}px)`)
    if (maxWidth) conditions.push(`(max-width: ${maxWidth - 1}px)`)
    
    return conditions.join(' and ')
  }
  
  // Breakpoint utilities
  const isAtBreakpoint = (breakpoint: keyof Breakpoints) => {
    return windowWidth.value >= breakpoints[breakpoint]
  }
  
  const isBetweenBreakpoints = (min: keyof Breakpoints, max: keyof Breakpoints) => {
    return windowWidth.value >= breakpoints[min] && windowWidth.value < breakpoints[max]
  }
  
  // Container max-width resolver
  const getContainerMaxWidth = () => {
    if (is2Xl.value) return '1536px'
    if (isXl.value) return '1280px'
    if (isLg.value) return '1024px'
    if (isMd.value) return '768px'
    if (isSm.value) return '640px'
    return '100%'
  }
  
  // Sidebar behavior helper
  const getSidebarBehavior = () => {
    return {
      shouldCollapse: isMobile.value,
      shouldOverlay: isMobile.value || isTablet.value,
      shouldFloat: isMobile.value,
      defaultWidth: isMobile.value ? '100%' : isSmallScreen.value ? '200px' : '280px'
    }
  }
  
  // Typography scaling
  const getResponsiveFontSize = (baseSize: number) => {
    const scale = isMobile.value ? 0.9 : isLargeScreen.value ? 1.1 : 1
    return `${baseSize * scale}rem`
  }
  
  // Component sizing helpers
  const getComponentSize = (size: ResponsiveValue<'sm' | 'md' | 'lg'>) => {
    return resolveResponsiveValue(size)
  }
  
  // Layout helpers
  const getLayoutConfig = () => {
    return {
      showSidebar: !isMobile.value,
      sidebarWidth: isMobile.value ? '100%' : '280px',
      contentPadding: isMobile.value ? '1rem' : '2rem',
      maxContentWidth: getContainerMaxWidth(),
      headerHeight: isMobile.value ? '60px' : '80px',
      showMobileMenu: isMobile.value
    }
  }
  
  // Event handlers
  const handleResize = () => {
    updateDimensions()
  }
  
  // Setup
  onMounted(() => {
    updateDimensions()
    window.addEventListener('resize', handleResize, { passive: true })
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
  
  return {
    // Dimensions
    windowWidth,
    windowHeight,
    
    // Breakpoint checks
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    currentBreakpoint,
    
    // Device types
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    
    // Orientation
    isPortrait,
    isLandscape,
    
    // Screen sizes
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    
    // Utilities
    resolveResponsiveValue,
    getResponsiveClasses,
    getResponsiveColumns,
    getResponsiveSpacing,
    getResponsiveFontSize,
    getComponentSize,
    
    // Media queries
    matchesMediaQuery,
    createMediaQuery,
    isAtBreakpoint,
    isBetweenBreakpoints,
    
    // Layout helpers
    getContainerMaxWidth,
    getSidebarBehavior,
    getLayoutConfig,
    
    // Constants
    breakpoints
  }
}

// Global responsive manager
let globalResponsiveManager: ReturnType<typeof useResponsive> | null = null

export function useGlobalResponsive() {
  if (!globalResponsiveManager) {
    globalResponsiveManager = useResponsive()
  }
  return globalResponsiveManager
}