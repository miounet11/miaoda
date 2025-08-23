<template>
  <div class="language-selector" :data-size="size" :data-variant="variant">
    <!-- Trigger Button -->
    <button
      @click="toggleDropdown"
      class="language-trigger"
      :class="{
        active: isOpen,
        'language-change-success': showSuccessFeedback
      }"
      :aria-label="$t('settings.language')"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
    >
      <div class="current-language">
        <span class="language-flag">{{ currentLocale.flag }}</span>
        <span class="language-name">{{
          showNative ? currentLocale.nativeName : currentLocale.name
        }}</span>
      </div>

      <ChevronDown :size="16" class="dropdown-icon" :class="{ rotated: isOpen }" />
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
          :class="{ active: locale.current }"
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
    <div v-if="isOpen" class="language-overlay" @click="closeDropdown" />
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
const showSuccessFeedback = ref(false)

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

    // Show visual success feedback
    showSuccessFeedback.value = true
    setTimeout(() => {
      showSuccessFeedback.value = false
    }, 2000)

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
      window.showNotification(t('settings.languageChangeError'), 'error')
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
  @apply flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-lg font-medium text-sm;
  position: relative;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center center;
  backface-visibility: hidden;
  min-height: 48px;
  cursor: pointer;
}

.language-trigger:hover:not(:disabled) {
  @apply bg-accent border-primary/30;
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

.language-trigger:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.language-trigger.active {
  @apply bg-accent border-primary shadow-md;
  transform: scale(1.01);
}

.language-trigger:focus-visible {
  @apply outline-none ring-2 ring-primary ring-offset-2;
  transform: scale(1.01);
}

.current-language {
  @apply flex items-center gap-3 flex-1;
}

.language-flag {
  @apply text-xl leading-none;
}

.language-name {
  @apply text-sm font-medium;
}

.dropdown-icon {
  @apply text-muted-foreground transition-transform;
  transition-duration: 150ms;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
  @apply text-primary;
}

.language-dropdown {
  @apply absolute top-full left-0 mt-2 bg-background border border-border rounded-xl shadow-xl z-50 min-w-72 max-w-80;
  backdrop-filter: blur(8px);
}

.language-overlay {
  @apply fixed inset-0 z-40 bg-black/10 backdrop-blur-sm;
}

.dropdown-header {
  @apply flex items-center gap-3 px-4 py-4 border-b border-border/50 bg-muted/20;
}

.dropdown-header span {
  @apply text-sm font-semibold;
}

.language-list {
  @apply py-2 max-h-80 overflow-y-auto;
}

.language-option {
  @apply w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.language-option:hover {
  @apply bg-accent/50;
  transform: translateX(4px);
}

.language-option:active {
  transform: translateX(2px) scale(0.98);
}

.language-option.active {
  @apply bg-primary/5 text-primary border-r-2 border-primary;
  font-weight: 600;
}

.option-content {
  @apply flex items-center gap-4 flex-1;
}

.option-flag {
  @apply text-xl leading-none;
}

.language-option:hover .option-flag {
  transform: scale(1.1) rotate(5deg);
}

.option-text {
  @apply flex flex-col;
}

.option-name {
  @apply text-sm font-medium leading-tight;
}

.option-native {
  @apply text-xs text-muted-foreground mt-0.5;
}

.language-option:hover .option-name {
  @apply text-primary;
}

.language-option:hover .option-native {
  @apply text-primary/70;
}

.language-option.active .option-native {
  @apply text-primary/80;
}

.check-icon {
  @apply text-primary;
  animation: checkSlideIn 250ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes checkSlideIn {
  0% {
    transform: scale(0) rotate(180deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.dropdown-footer {
  @apply border-t border-border/50 bg-muted/20;
}

.help-button {
  @apply w-full flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground cursor-pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.help-button:hover {
  @apply text-foreground bg-accent/30;
  transform: translateX(2px);
}

.help-button:active {
  transform: translateX(1px) scale(0.98);
}

/* Success animation for language change */
.language-change-success::after {
  content: '✓';
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  color: rgb(34, 197, 94);
  font-weight: bold;
  animation: successCheckmark 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes successCheckmark {
  0% {
    transform: translateY(-50%) scale(0) rotate(180deg);
    opacity: 0;
  }
  50% {
    transform: translateY(-50%) scale(1.2) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(-50%) scale(1) rotate(0deg);
    opacity: 0;
  }
}

/* Size variants */
.language-selector[data-size='small'] .language-trigger {
  @apply px-3 py-2 text-xs min-h-10;
}

.language-selector[data-size='small'] .language-name {
  @apply text-xs;
}

.language-selector[data-size='small'] .language-flag {
  @apply text-lg;
}

.language-selector[data-size='large'] .language-trigger {
  @apply px-5 py-4 min-h-14;
}

.language-selector[data-size='large'] .language-name {
  @apply text-base;
}

.language-selector[data-size='large'] .current-language {
  @apply gap-4;
}

/* Variant styles */
.language-selector[data-variant='compact'] .current-language {
  @apply gap-2;
}

.language-selector[data-variant='compact'] .language-name {
  @apply hidden;
}

.language-selector[data-variant='minimal'] .language-trigger {
  @apply border-0 bg-transparent hover:bg-accent/50 shadow-none;
}

.language-selector[data-variant='minimal'] .dropdown-icon {
  @apply hidden;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .language-dropdown {
    @apply left-auto right-0 min-w-64 max-w-72;
    position: fixed;
    top: auto;
    bottom: 80px;
    left: 16px;
    right: 16px;
    width: auto;
    max-width: none;
  }

  .language-trigger {
    @apply min-h-12 px-4 py-3;
  }

  .language-option {
    @apply py-4 px-4;
  }

  .help-button {
    @apply py-4 px-4;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .language-dropdown {
    @apply bg-background/95 border-border/60;
    backdrop-filter: blur(12px);
    box-shadow:
      0 10px 25px -5px rgba(0, 0, 0, 0.3),
      0 10px 10px -5px rgba(0, 0, 0, 0.2);
  }

  .dropdown-header {
    @apply bg-muted/30;
  }

  .dropdown-footer {
    @apply bg-muted/30;
  }

  .language-overlay {
    @apply bg-black/30;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .language-trigger {
    @apply border-2;
  }

  .language-trigger:focus-visible {
    @apply ring-4 ring-primary;
  }

  .language-option.active {
    @apply bg-primary text-primary-foreground border-0;
  }

  .dropdown-header,
  .dropdown-footer {
    @apply border-2 border-border;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .language-trigger,
  .language-option,
  .help-button,
  .option-flag,
  .dropdown-icon {
    transition: none !important;
    animation: none !important;
    transform: none !important;
  }
}
</style>
