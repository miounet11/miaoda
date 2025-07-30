<template>
  <div class="language-selector">
    <!-- Trigger Button -->
    <button
      @click="toggleDropdown"
      class="language-trigger"
      :class="{ 'active': isOpen }"
      :aria-label="$t('settings.language')"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
    >
      <div class="current-language">
        <span class="language-flag">{{ currentLocale.flag }}</span>
        <span class="language-name">{{ showNative ? currentLocale.nativeName : currentLocale.name }}</span>
      </div>
      
      <ChevronDown :size="16" class="dropdown-icon" :class="{ 'rotated': isOpen }" />
    </button>
    
    <!-- Dropdown Menu -->
    <div
      v-if="isOpen"
      class="language-dropdown"
      role="listbox"
      :aria-label="$t('settings.selectLanguage')"
    >
      <div class="dropdown-header" v-if="showHeader">
        <Globe :size="16" />
        <span>{{ $t('settings.selectLanguage') }}</span>
      </div>
      
      <div class="language-list">
        <button
          v-for="locale in availableLocales"
          :key="locale.code"
          @click="selectLanguage(locale.code)"
          class="language-option"
          :class="{ 'active': locale.current }"
          role="option"
          :aria-selected="locale.current"
        >
          <div class="option-content">
            <span class="option-flag">{{ locale.flag }}</span>
            
            <div class="option-text">
              <span class="option-name">{{ locale.name }}</span>
              <span class="option-native">{{ locale.nativeName }}</span>
            </div>
          </div>
          
          <Check v-if="locale.current" :size="16" class="check-icon" />
        </button>
      </div>
      
      <div class="dropdown-footer" v-if="showFooter">
        <button @click="openTranslationHelp" class="help-button">
          <HelpCircle :size="14" />
          <span>{{ $t('settings.translationHelp') }}</span>
        </button>
      </div>
    </div>
    
    <!-- Overlay -->
    <div
      v-if="isOpen"
      class="language-overlay"
      @click="closeDropdown"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronDown, Globe, Check, HelpCircle } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useI18nService, type SupportedLocale } from '@renderer/src/services/i18n'

// Props
interface Props {
  showNative?: boolean
  showHeader?: boolean
  showFooter?: boolean
  size?: 'small' | 'medium' | 'large'
  variant?: 'default' | 'compact' | 'minimal'
}

const props = withDefaults(defineProps<Props>(), {
  showNative: false,
  showHeader: true,
  showFooter: true,
  size: 'medium',
  variant: 'default'
})

// Emits
const emit = defineEmits<{
  'language-change': [locale: SupportedLocale]
}>()

// Composables
const { t } = useI18n()
const i18nService = useI18nService()

// State
const isOpen = ref(false)

// Computed
const currentLocale = computed(() => {
  const availableLocales = i18nService.getAvailableLocales()
  return availableLocales.find(locale => locale.current) || availableLocales[0]
})

const availableLocales = computed(() => {
  return i18nService.getAvailableLocales()
})

// Methods
const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  isOpen.value = false
}

const selectLanguage = async (locale: SupportedLocale) => {
  try {
    await i18nService.setLocale(locale)
    emit('language-change', locale)
    closeDropdown()
    
    // Show success notification
    if (window.showNotification) {
      const localeInfo = i18nService.getLocaleInfo(locale)
      window.showNotification(
        t('settings.languageChanged', { language: localeInfo.name }),
        'success'
      )
    }
  } catch (error) {
    console.error('Failed to change language:', error)
    
    // Show error notification
    if (window.showNotification) {
      window.showNotification(
        t('settings.languageChangeError'),
        'error'
      )
    }
  }
}

const openTranslationHelp = () => {
  // Open translation help or contribution guide
  const helpUrl = 'https://github.com/miaodachat/translations'
  window.open(helpUrl, '_blank')
  closeDropdown()
}

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (!isOpen.value) return

  switch (event.key) {
    case 'Escape':
      closeDropdown()
      break
    case 'Tab':
      // Let natural tab behavior work
      break
    default:
      break
  }
}

// Click outside handler
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Element
  if (!target.closest('.language-selector')) {
    closeDropdown()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.language-selector {
  @apply relative inline-block;
}

.language-trigger {
  @apply flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-md hover:bg-accent transition-colors focus:ring-2 focus:ring-primary focus:outline-none;
}

.language-trigger.active {
  @apply bg-accent border-primary;
}

.current-language {
  @apply flex items-center gap-2;
}

.language-flag {
  @apply text-lg leading-none;
}

.language-name {
  @apply text-sm font-medium;
}

.dropdown-icon {
  @apply transition-transform duration-200;
}

.dropdown-icon.rotated {
  @apply rotate-180;
}

.language-dropdown {
  @apply absolute top-full left-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 min-w-64 max-w-80;
  animation: slideDown 0.15s ease-out;
}

.language-overlay {
  @apply fixed inset-0 z-40;
}

.dropdown-header {
  @apply flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30;
}

.dropdown-header span {
  @apply text-sm font-medium;
}

.language-list {
  @apply py-2 max-h-80 overflow-y-auto;
}

.language-option {
  @apply w-full flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors text-left;
}

.language-option.active {
  @apply bg-primary/10 text-primary;
}

.option-content {
  @apply flex items-center gap-3;
}

.option-flag {
  @apply text-lg leading-none;
}

.option-text {
  @apply flex flex-col;
}

.option-name {
  @apply text-sm font-medium;
}

.option-native {
  @apply text-xs text-muted-foreground;
}

.language-option.active .option-native {
  @apply text-primary/70;
}

.check-icon {
  @apply text-primary;
}

.dropdown-footer {
  @apply border-t border-border bg-muted/30;
}

.help-button {
  @apply w-full flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors;
}

/* Size variants */
.language-selector.small .language-trigger {
  @apply px-2 py-1 text-xs;
}

.language-selector.small .language-name {
  @apply text-xs;
}

.language-selector.small .language-flag {
  @apply text-sm;
}

.language-selector.large .language-trigger {
  @apply px-4 py-3;
}

.language-selector.large .language-name {
  @apply text-base;
}

/* Variant styles */
.language-selector.compact .current-language {
  @apply gap-1;
}

.language-selector.compact .language-name {
  @apply hidden;
}

.language-selector.minimal .language-trigger {
  @apply border-0 bg-transparent hover:bg-accent/50;
}

.language-selector.minimal .dropdown-icon {
  @apply hidden;
}

/* Animations */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* RTL support */
:global([dir="rtl"]) .language-dropdown {
  @apply right-0 left-auto;
}

:global([dir="rtl"]) .current-language {
  @apply flex-row-reverse;
}

:global([dir="rtl"]) .option-content {
  @apply flex-row-reverse;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .language-trigger {
    @apply border-2;
  }
  
  .language-trigger:focus {
    @apply ring-2 ring-primary;
  }
  
  .language-option.active {
    @apply bg-primary text-primary-foreground;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .language-dropdown {
    animation: none;
  }
  
  .dropdown-icon {
    transition: none;
  }
  
  .language-trigger,
  .language-option,
  .help-button {
    transition: none;
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .language-dropdown {
    @apply left-auto right-0 min-w-56;
  }
  
  .option-text {
    @apply min-w-0;
  }
  
  .option-name,
  .option-native {
    @apply truncate;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .language-dropdown {
    @apply bg-background border-border;
  }
}
</style>