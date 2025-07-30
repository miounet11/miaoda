<template>
  <div class="terminal-view">
    <div class="terminal-header">
      <div class="terminal-controls">
        <button
          @click="clearTerminal"
          class="control-btn"
          :title="$t('terminal.clear')"
        >
          <Trash2 :size="16" />
        </button>
        <button
          @click="toggleSettings"
          class="control-btn"
          :title="$t('terminal.settings')"
        >
          <Settings :size="16" />
        </button>
      </div>
      
      <div class="terminal-info">
        <span class="shell-info">{{ shellType }} - {{ workingDirectory }}</span>
      </div>
    </div>
    
    <div ref="terminalRef" class="terminal-container">
      <div class="terminal-output">
        <div
          v-for="(entry, index) in terminalHistory"
          :key="index"
          :class="['terminal-entry', entry.type]"
        >
          <div v-if="entry.type === 'command'" class="command-line">
            <span class="prompt">{{ entry.prompt }}</span>
            <span class="command">{{ entry.content }}</span>
          </div>
          <div v-else-if="entry.type === 'output'" class="output-line">
            <pre>{{ entry.content }}</pre>
          </div>
          <div v-else-if="entry.type === 'error'" class="error-line">
            <pre>{{ entry.content }}</pre>
          </div>
        </div>
      </div>
      
      <div class="terminal-input-line">
        <span class="prompt">{{ currentPrompt }}</span>
        <input
          ref="inputRef"
          v-model="currentCommand"
          @keydown="handleKeyDown"
          @keyup="handleKeyUp"
          class="terminal-input"
          :disabled="isExecuting"
          spellcheck="false"
          autocomplete="off"
        >
        <span v-if="isExecuting" class="executing-indicator">
          <Loader :size="12" class="animate-spin" />
        </span>
      </div>
    </div>
    
    <!-- Terminal Settings -->
    <div v-if="showSettings" class="terminal-settings">
      <div class="settings-header">
        <h4>{{ $t('terminal.settings') }}</h4>
        <button @click="showSettings = false" class="close-btn">
          <X :size="16" />
        </button>
      </div>
      
      <div class="settings-content">
        <div class="setting-group">
          <label>{{ $t('terminal.fontSize') }}</label>
          <input
            v-model.number="settings.fontSize"
            type="range"
            min="10"
            max="24"
            step="1"
            class="setting-slider"
          >
          <span>{{ settings.fontSize }}px</span>
        </div>
        
        <div class="setting-group">
          <label>{{ $t('terminal.theme') }}</label>
          <select v-model="settings.theme" class="setting-select">
            <option value="dark">{{ $t('terminal.themes.dark') }}</option>
            <option value="light">{{ $t('terminal.themes.light') }}</option>
            <option value="hacker">{{ $t('terminal.themes.hacker') }}</option>
          </select>
        </div>
        
        <div class="setting-group">
          <label>
            <input
              v-model="settings.soundEnabled"
              type="checkbox"
              class="setting-checkbox"
            >
            {{ $t('terminal.enableSound') }}
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { Trash2, Settings, X, Loader } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

interface Props {
  tabId: string
  workingDirectory?: string
  shellType?: string
  initialData?: any
}

interface TerminalEntry {
  type: 'command' | 'output' | 'error'
  content: string
  prompt?: string
  timestamp: Date
}

interface TerminalSettings {
  fontSize: number
  theme: 'dark' | 'light' | 'hacker'
  soundEnabled: boolean
}

const props = withDefaults(defineProps<Props>(), {
  workingDirectory: '~',
  shellType: 'bash'
})

const emit = defineEmits<{
  'title-change': [title: string]
  'error': [error: string]
  'loading': [loading: boolean]
}>()

const { t } = useI18n()

// Refs
const terminalRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()

// State
const terminalHistory = ref<TerminalEntry[]>([])
const currentCommand = ref('')
const currentPrompt = ref(`user@miaoda:${props.workingDirectory}$ `)
const isExecuting = ref(false)
const commandHistory = ref<string[]>([])
const historyIndex = ref(-1)
const showSettings = ref(false)

// Settings
const settings = ref<TerminalSettings>({
  fontSize: 14,
  theme: 'dark',
  soundEnabled: true
})

// Built-in commands
const builtinCommands = {
  help: () => {
    return `Available commands:
help     - Show this help message
clear    - Clear the terminal
pwd      - Show current directory
ls       - List directory contents
cd       - Change directory
echo     - Echo text
date     - Show current date
whoami   - Show current user
history  - Show command history
exit     - Close terminal`
  },
  
  clear: () => {
    terminalHistory.value = []
    return ''
  },
  
  pwd: () => {
    return props.workingDirectory || '~'
  },
  
  ls: () => {
    return `file1.txt\nfile2.js\ndirectory1/\ndirectory2/`
  },
  
  cd: (args: string[]) => {
    const dir = args[0] || '~'
    // In a real implementation, this would change the working directory
    return `Changed directory to ${dir}`
  },
  
  echo: (args: string[]) => {
    return args.join(' ')
  },
  
  date: () => {
    return new Date().toString()
  },
  
  whoami: () => {
    return 'user'
  },
  
  history: () => {
    return commandHistory.value
      .map((cmd, index) => `${index + 1}  ${cmd}`)
      .join('\n')
  },
  
  exit: () => {
    emit('title-change', 'Terminal (closed)')
    return 'Terminal session ended.'
  }
}

// Methods
const executeCommand = async (command: string) => {
  if (!command.trim()) return
  
  const trimmedCommand = command.trim()
  
  // Add to history
  commandHistory.value.push(trimmedCommand)
  historyIndex.value = commandHistory.value.length
  
  // Add command to terminal
  terminalHistory.value.push({
    type: 'command',
    content: trimmedCommand,
    prompt: currentPrompt.value,
    timestamp: new Date()
  })
  
  isExecuting.value = true
  
  try {
    const [cmd, ...args] = trimmedCommand.split(' ')
    let output = ''
    
    // Check built-in commands
    if (cmd in builtinCommands) {
      output = (builtinCommands as any)[cmd](args)
    } else {
      // Simulate command execution
      if (window.api?.terminal?.executeCommand) {
        output = await window.api.terminal.executeCommand(trimmedCommand, {
          cwd: props.workingDirectory,
          shell: props.shellType
        })
      } else {
        // Fallback for unsupported commands
        output = `Command '${cmd}' not found. Type 'help' for available commands.`
      }
    }
    
    // Add output to terminal
    if (output) {
      terminalHistory.value.push({
        type: 'output',
        content: output,
        timestamp: new Date()
      })
    }
    
    // Play sound if enabled
    if (settings.value.soundEnabled) {
      playTerminalSound()
    }
    
  } catch (error) {
    // Add error to terminal
    terminalHistory.value.push({
      type: 'error',
      content: error instanceof Error ? error.message : String(error),
      timestamp: new Date()
    })
    
    emit('error', 'Command execution failed')
  } finally {
    isExecuting.value = false
    currentCommand.value = ''
    
    // Scroll to bottom
    await nextTick()
    scrollToBottom()
    
    // Focus input
    inputRef.value?.focus()
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  const { key, ctrlKey, metaKey } = event
  const cmd = ctrlKey || metaKey
  
  switch (key) {
    case 'Enter':
      event.preventDefault()
      executeCommand(currentCommand.value)
      break
      
    case 'ArrowUp':
      event.preventDefault()
      navigateHistory(-1)
      break
      
    case 'ArrowDown':
      event.preventDefault()
      navigateHistory(1)
      break
      
    case 'Tab':
      event.preventDefault()
      // TODO: Implement tab completion
      break
      
    case 'c':
      if (cmd) {
        event.preventDefault()
        // Interrupt current command
        if (isExecuting.value) {
          isExecuting.value = false
          terminalHistory.value.push({
            type: 'output',
            content: '^C',
            timestamp: new Date()
          })
          currentCommand.value = ''
        }
      }
      break
      
    case 'l':
      if (cmd) {
        event.preventDefault()
        clearTerminal()
      }
      break
  }
}

const handleKeyUp = (event: KeyboardEvent) => {
  // Handle any key up events if needed
}

const navigateHistory = (direction: number) => {
  const newIndex = historyIndex.value + direction
  
  if (newIndex >= 0 && newIndex < commandHistory.value.length) {
    historyIndex.value = newIndex
    currentCommand.value = commandHistory.value[historyIndex.value]
  } else if (newIndex === commandHistory.value.length) {
    historyIndex.value = newIndex
    currentCommand.value = ''
  }
}

const clearTerminal = () => {
  terminalHistory.value = []
}

const scrollToBottom = () => {
  if (terminalRef.value) {
    terminalRef.value.scrollTop = terminalRef.value.scrollHeight
  }
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const playTerminalSound = () => {
  // Create a simple beep sound
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.1)
}

// Lifecycle
onMounted(() => {
  // Focus input
  inputRef.value?.focus()
  
  // Add welcome message
  terminalHistory.value.push({
    type: 'output',
    content: `Welcome to MiaoDa Terminal
Type 'help' for available commands.`,
    timestamp: new Date()
  })
  
  // Load settings from localStorage
  const savedSettings = localStorage.getItem('terminal-settings')
  if (savedSettings) {
    try {
      Object.assign(settings.value, JSON.parse(savedSettings))
    } catch (error) {
      console.warn('Failed to load terminal settings:', error)
    }
  }
})

onUnmounted(() => {
  // Save settings
  localStorage.setItem('terminal-settings', JSON.stringify(settings.value))
})

// Watch settings changes
watch(settings, (newSettings) => {
  // Apply settings to terminal
  if (terminalRef.value) {
    terminalRef.value.style.fontSize = `${newSettings.fontSize}px`
    terminalRef.value.className = `terminal-container theme-${newSettings.theme}`
  }
}, { deep: true })

// Apply initial settings
watch(terminalRef, (el) => {
  if (el) {
    el.style.fontSize = `${settings.value.fontSize}px`
    el.className = `terminal-container theme-${settings.value.theme}`
  }
})

defineExpose({
  executeCommand,
  clearTerminal,
  getHistory: () => terminalHistory.value,
  focusInput: () => inputRef.value?.focus()
})
</script>

<style scoped>
.terminal-view {
  @apply flex flex-col h-full bg-black text-green-400 overflow-hidden;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.terminal-header {
  @apply flex items-center justify-between p-2 bg-gray-900 border-b border-gray-700;
}

.terminal-controls {
  @apply flex items-center gap-2;
}

.control-btn {
  @apply p-1 text-gray-400 hover:text-white transition-colors;
}

.terminal-info {
  @apply text-sm text-gray-400;
}

.shell-info {
  @apply font-mono;
}

.terminal-container {
  @apply flex-1 p-4 overflow-auto;
}

.terminal-container.theme-dark {
  @apply bg-black text-green-400;
}

.terminal-container.theme-light {
  @apply bg-white text-black;
}

.terminal-container.theme-hacker {
  @apply bg-black text-lime-400;
}

.terminal-output {
  @apply space-y-1;
}

.terminal-entry {
  @apply leading-relaxed;
}

.command-line {
  @apply flex;
}

.prompt {
  @apply text-blue-400 mr-2 flex-shrink-0;
}

.command {
  @apply text-white;
}

.output-line pre {
  @apply whitespace-pre-wrap text-green-400 m-0;
}

.error-line pre {
  @apply whitespace-pre-wrap text-red-400 m-0;
}

.terminal-input-line {
  @apply flex items-center mt-2;
}

.terminal-input {
  @apply flex-1 bg-transparent border-none outline-none text-white font-mono;
  caret-color: currentColor;
}

.terminal-input:disabled {
  @apply opacity-50;
}

.executing-indicator {
  @apply ml-2 text-yellow-400;
}

/* Terminal Settings */
.terminal-settings {
  @apply absolute bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg shadow-lg w-80 p-4 z-10;
}

.settings-header {
  @apply flex items-center justify-between mb-4;
}

.settings-header h4 {
  @apply font-semibold text-white;
}

.close-btn {
  @apply p-1 text-gray-400 hover:text-white transition-colors;
}

.settings-content {
  @apply space-y-4;
}

.setting-group {
  @apply space-y-2;
}

.setting-group label {
  @apply block text-sm text-gray-300;
}

.setting-slider {
  @apply w-full;
}

.setting-select {
  @apply w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white;
}

.setting-checkbox {
  @apply mr-2;
}

/* Scrollbar styling */
.terminal-container::-webkit-scrollbar {
  width: 8px;
}

.terminal-container::-webkit-scrollbar-track {
  @apply bg-gray-900;
}

.terminal-container::-webkit-scrollbar-thumb {
  @apply bg-gray-600 rounded;
}

.terminal-container::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-500;
}

/* Selection styling */
.terminal-container ::selection {
  @apply bg-blue-600/30;
}

/* Responsive */
@media (max-width: 768px) {
  .terminal-settings {
    @apply bottom-2 right-2 left-2 w-auto;
  }
  
  .terminal-header {
    @apply text-sm;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .terminal-view {
    @apply border border-white;
  }
}

/* Animation for cursor */
@keyframes cursor-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.terminal-input {
  animation: cursor-blink 1s infinite;
}
</style>