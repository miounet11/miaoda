---
created: 2025-08-26T05:26:45Z
last_updated: 2025-08-26T05:26:45Z
version: 1.0
author: Claude Code PM System
---

# Project Style Guide

## Code Organization & Structure

### Directory Naming Conventions
- **Feature Directories**: Use camelCase for multi-word features (`voiceInput/`, `searchResults/`)
- **Component Directories**: Use kebab-case for component folders (`chat-input/`, `voice-recorder/`)
- **Service Directories**: Use camelCase with descriptive suffixes (`export/`, `streaming/`, `mcp/`)
- **Test Directories**: Always `__tests__/` alongside the code being tested

### File Naming Standards

**TypeScript Files**
- **Services**: PascalCase with suffix (`VoiceService.ts`, `ExportService.ts`)
- **Utilities**: camelCase with descriptive names (`timeUtils.ts`, `performanceMonitor.ts`)
- **Types/Interfaces**: camelCase matching the domain (`chat.ts`, `api.ts`, `voice.ts`)
- **Stores**: camelCase feature names (`settings.ts`, `customProviders.ts`)

**Vue Components**
- **Components**: PascalCase matching component name (`ChatInput.vue`, `VoiceRecorder.vue`)
- **Views**: PascalCase with "View" suffix (`SettingsView.vue`, `ChatViewImproved.vue`)
- **Layout Components**: PascalCase descriptive names (`Window.vue`, `TabBar.vue`)

**Test Files**
- **Unit Tests**: ComponentName + `.test.ts` (`ChatInput.test.ts`)
- **Integration Tests**: ServiceName + `.test.ts` (`VoiceService.test.ts`)
- **Utilities**: Descriptive + `.test.ts` (`timeUtils.test.ts`)

## TypeScript Conventions

### Interface & Type Definitions

**Interface Naming**
```typescript
// Use PascalCase with descriptive names
interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: string
}

// Use "Props" suffix for component props
interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
}
```

**Type Definitions**
```typescript
// Use PascalCase for custom types
type MessageRole = 'user' | 'assistant' | 'system'
type ExportFormat = 'markdown' | 'json' | 'html' | 'txt'

// Use descriptive union types
type ProviderStatus = 'connected' | 'connecting' | 'error' | 'disconnected'
```

### Function & Variable Naming
```typescript
// Use camelCase for functions and variables
const getCurrentTimestamp = (): string => {
  return new Date().toISOString()
}

// Use descriptive boolean prefixes
const isVoiceSupported = ref(false)
const hasApiKey = computed(() => settings.value.apiKey.length > 0)
const canExportChat = computed(() => currentChat.value?.messages.length > 0)

// Use SCREAMING_SNAKE_CASE for constants
const DEFAULT_VOICE_RATE = 1.0
const MAX_MESSAGE_LENGTH = 10000
const SEARCH_DEBOUNCE_DELAY = 300
```

## Vue 3 Component Standards

### Composition API Structure
```vue
<script setup lang="ts">
// 1. Import statements (external libraries first, then internal)
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

// 2. Props definition with TypeScript interface
interface Props {
  modelValue: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

// 3. Emits definition
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'submit': [message: string]
}>()

// 4. Composables and stores
const router = useRouter()
const { currentChat } = storeToRefs(useChatStore())

// 5. Reactive references
const inputText = ref('')
const isSubmitting = ref(false)

// 6. Computed properties
const canSubmit = computed(() => 
  inputText.value.trim().length > 0 && !isSubmitting.value
)

// 7. Methods
const handleSubmit = async () => {
  if (!canSubmit.value) return
  
  isSubmitting.value = true
  try {
    emit('submit', inputText.value.trim())
    inputText.value = ''
  } finally {
    isSubmitting.value = false
  }
}

// 8. Lifecycle hooks
onMounted(() => {
  // Initialization logic
})

// 9. Watchers
watch(
  () => props.modelValue,
  (newValue) => {
    inputText.value = newValue
  },
  { immediate: true }
)
</script>
```

### Template Structure
```vue
<template>
  <!-- Use semantic HTML elements -->
  <div class="chat-input-container">
    <!-- Use descriptive CSS classes -->
    <form 
      class="chat-input-form" 
      @submit.prevent="handleSubmit"
    >
      <!-- Use v-model for two-way binding -->
      <input
        v-model="inputText"
        type="text"
        class="chat-input-field"
        :disabled="disabled || isSubmitting"
        placeholder="Type your message..."
        @keydown.enter.prevent="handleSubmit"
      >
      
      <!-- Use conditional rendering appropriately -->
      <button
        type="submit"
        class="chat-submit-button"
        :disabled="!canSubmit"
      >
        <span v-if="isSubmitting">Sending...</span>
        <span v-else>Send</span>
      </button>
    </form>
  </div>
</template>
```

## CSS & Styling Conventions

### Tailwind CSS Usage
```vue
<template>
  <!-- Use semantic class combinations -->
  <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
    <!-- Use responsive utilities -->
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white md:text-xl">
      Chat Title
    </h2>
    
    <!-- Use state-based styling -->
    <button 
      class="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      :class="{ 'animate-pulse': isLoading }"
    >
      Export
    </button>
  </div>
</template>
```

### Custom CSS Classes
```css
/* Use BEM-like naming for component-specific styles */
.chat-input-container {
  @apply relative flex flex-col;
}

.chat-input-field {
  @apply w-full px-4 py-2 text-base border border-gray-300 rounded-lg;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  @apply dark:bg-gray-700 dark:border-gray-600 dark:text-white;
}

/* Use utility-first approach with custom properties for complex components */
.message-content {
  @apply prose prose-sm max-w-none;
  @apply prose-headings:text-gray-900 prose-p:text-gray-700;
  @apply dark:prose-headings:text-white dark:prose-p:text-gray-300;
}
```

## Testing Patterns

### Unit Test Structure
```typescript
describe('ChatInput', () => {
  const createWrapper = (props: Partial<ChatInputProps> = {}) => {
    return mount(ChatInput, {
      props: {
        onSendMessage: vi.fn(),
        ...props
      }
    })
  }

  describe('user interactions', () => {
    it('should emit message on form submission', async () => {
      const onSendMessage = vi.fn()
      const wrapper = createWrapper({ onSendMessage })
      
      const input = wrapper.find('input')
      await input.setValue('Hello world')
      
      const form = wrapper.find('form')
      await form.trigger('submit')
      
      expect(onSendMessage).toHaveBeenCalledWith('Hello world')
    })

    it('should not submit empty messages', async () => {
      const onSendMessage = vi.fn()
      const wrapper = createWrapper({ onSendMessage })
      
      const form = wrapper.find('form')
      await form.trigger('submit')
      
      expect(onSendMessage).not.toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const wrapper = createWrapper()
      const input = wrapper.find('input')
      
      expect(input.attributes('aria-label')).toBeDefined()
      expect(input.attributes('role')).toBeDefined()
    })
  })
})
```

### Service Test Structure
```typescript
describe('VoiceService', () => {
  let voiceService: VoiceService

  beforeEach(() => {
    voiceService = new VoiceService()
  })

  afterEach(() => {
    voiceService.destroy()
  })

  describe('initialization', () => {
    it('should detect browser capabilities correctly', () => {
      const capabilities = voiceService.getCapabilities()
      
      expect(capabilities).toMatchObject({
        speechRecognition: expect.any(Boolean),
        speechSynthesis: expect.any(Boolean),
        getUserMedia: expect.any(Boolean)
      })
    })
  })

  describe('speech recognition', () => {
    it('should start recognition successfully', async () => {
      const result = await voiceService.startRecognition()
      expect(result).toBe(true)
    })

    it('should handle recognition errors gracefully', async () => {
      // Mock error scenario
      vi.spyOn(global, 'SpeechRecognition').mockImplementation(() => {
        throw new Error('Recognition not supported')
      })

      const result = await voiceService.startRecognition()
      expect(result).toBe(false)
    })
  })
})
```

## Documentation Standards

### Code Comments
```typescript
/**
 * Manages voice input and output functionality for the chat application.
 * Provides speech recognition, synthesis, and related utility methods.
 * 
 * @example
 * ```typescript
 * const voiceService = new VoiceService()
 * await voiceService.startRecognition()
 * voiceService.on('result', (text) => console.log(text))
 * ```
 */
class VoiceService {
  /**
   * Starts speech recognition with the current configuration.
   * 
   * @returns Promise resolving to true if started successfully
   * @throws {Error} When speech recognition is not supported
   */
  async startRecognition(): Promise<boolean> {
    // Implementation details...
  }
}
```

### Component Documentation
```vue
<script setup lang="ts">
/**
 * ChatInput - A reusable chat input component with voice support
 * 
 * Features:
 * - Text input with validation
 * - Voice input integration
 * - Keyboard shortcuts (Enter to send, Ctrl+Enter for new line)
 * - Loading states and error handling
 * 
 * @example
 * ```vue
 * <ChatInput
 *   v-model="message"
 *   :disabled="isLoading"
 *   @submit="handleMessage"
 * />
 * ```
 */

interface Props {
  /** Current input value */
  modelValue: string
  /** Whether the input is disabled */
  disabled?: boolean
  /** Placeholder text for the input */
  placeholder?: string
}
</script>
```

## Error Handling Patterns

### Service Error Handling
```typescript
class ExportService {
  async exportChat(chatId: string, format: ExportFormat): Promise<void> {
    try {
      const chat = await this.getChatById(chatId)
      if (!chat) {
        throw new ExportError('Chat not found', 'CHAT_NOT_FOUND')
      }

      const exportData = await this.formatChatData(chat, format)
      await this.saveExportFile(exportData, format)
      
      this.logger.info('Chat exported successfully', { chatId, format })
    } catch (error) {
      this.logger.error('Export failed', { chatId, format, error })
      
      if (error instanceof ExportError) {
        throw error
      }
      
      throw new ExportError(
        'Failed to export chat',
        'EXPORT_FAILED',
        { originalError: error }
      )
    }
  }
}
```

### Component Error Handling
```vue
<script setup lang="ts">
const { handleError } = useErrorHandler()

const exportChat = async () => {
  try {
    isExporting.value = true
    await exportService.exportChat(chatId.value, selectedFormat.value)
    
    showToast('Chat exported successfully', 'success')
  } catch (error) {
    handleError(error, {
      title: 'Export Failed',
      action: 'retry',
      onRetry: () => exportChat()
    })
  } finally {
    isExporting.value = false
  }
}
</script>
```