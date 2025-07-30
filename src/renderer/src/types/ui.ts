// UI State Types
export interface UIState {
  theme: Theme
  sidebarOpen: boolean
  sidebarWidth: number
  compactMode: boolean
  fontSize: FontSize
  language: string
  shortcuts: KeyboardShortcuts
}

export type Theme = 'light' | 'dark' | 'system'
export type FontSize = 'small' | 'medium' | 'large'

// Component Props Types
export interface BaseComponentProps {
  className?: string
  testId?: string
  disabled?: boolean
  loading?: boolean
}

// Modal and Dialog Types
export interface ModalProps extends BaseComponentProps {
  open: boolean
  title?: string
  description?: string
  closable?: boolean
  size?: ModalSize
  onClose?: () => void
}

export type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen'

// Form Types
export interface FormField {
  name: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  description?: string
  validation?: ValidationRule[]
  defaultValue?: any
  options?: SelectOption[]
}

export type FieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'textarea' 
  | 'select' 
  | 'checkbox' 
  | 'radio' 
  | 'file' 
  | 'date' 
  | 'range'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
  group?: string
}

export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom'
  value?: any
  message: string
  validator?: (value: any) => boolean
}

// Loading States
export interface LoadingState {
  isLoading: boolean
  message?: string
  progress?: number
  canCancel?: boolean
}

// Error States
export interface ErrorState {
  hasError: boolean
  message?: string
  code?: string
  details?: string
  retryable?: boolean
  timestamp?: Date
}

// Toast/Notification Types
export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  actions?: ToastAction[]
  persistent?: boolean
}

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary' | 'destructive'
}

// Keyboard Shortcuts
export interface KeyboardShortcuts {
  newChat: string
  openSettings: string
  toggleSidebar: string
  focusInput: string
  sendMessage: string
  searchChats: string
  nextChat: string
  prevChat: string
  clearChat: string
  exportChat: string
}

// Context Menu Types
export interface ContextMenuItem {
  id: string
  label: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  separator?: boolean
  submenu?: ContextMenuItem[]
  action?: () => void
}

export interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  items: ContextMenuItem[]
  target?: HTMLElement
}

// Drag and Drop Types
export interface DragItem {
  id: string
  type: DragItemType
  data: any
}

export type DragItemType = 'message' | 'chat' | 'file' | 'attachment'

export interface DropZone {
  id: string
  accepts: DragItemType[]
  active: boolean
  highlight: boolean
}

// Animation and Transition Types
export interface AnimationConfig {
  duration: number
  easing: string
  delay?: number
  loop?: boolean
}

export interface TransitionProps {
  name: string
  duration?: number
  enterClass?: string
  leaveClass?: string
  appear?: boolean
}

// Responsive Design Types
export interface Breakpoints {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
}

export interface ResponsiveValue<T> {
  base?: T
  xs?: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
  '2xl'?: T
}

// Virtualization Types (for large lists)
export interface VirtualListProps {
  items: any[]
  itemHeight: number | ((index: number) => number)
  containerHeight: number
  overscan?: number
  scrollToIndex?: number
  onScroll?: (scrollTop: number) => void
}

export interface VirtualListItem {
  index: number
  style: {
    position: 'absolute'
    top: number
    left: number
    height: number
    width: string
  }
}

// Accessibility Types
export interface A11yProps {
  role?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-hidden'?: boolean
  'aria-live'?: 'polite' | 'assertive' | 'off'
  'aria-busy'?: boolean
  tabIndex?: number
}

// Performance Monitoring Types
export interface PerformanceMetrics {
  renderTime: number
  interactionTime: number
  memoryUsage: number
  componentCount: number
  updateCount: number
}

// Component Event Types
export interface ComponentEvent<T = any> {
  type: string
  target: EventTarget | null
  data: T
  timestamp: Date
  preventDefault?: () => void
  stopPropagation?: () => void
}