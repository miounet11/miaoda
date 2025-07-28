<template>
  <div class="settings-view flex h-full">
    <!-- Settings Sidebar -->
    <aside class="w-64 bg-secondary/30 backdrop-blur-sm border-r flex flex-col">
      <div class="p-4 border-b">
        <div class="flex items-center gap-3">
          <button
            @click="$router.push('/')"
            class="p-2 hover:bg-accent/50 rounded-lg transition-colors"
            title="Back to chat"
          >
            <ArrowLeft :size="18" />
          </button>
          <h2 class="text-lg font-semibold">Settings</h2>
        </div>
      </div>
      
      <nav class="p-3 space-y-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-3',
            activeTab === tab.id 
              ? 'bg-primary/10 border border-primary/20 text-primary' 
              : 'hover:bg-accent/50 border border-transparent'
          ]"
        >
          <component :is="tab.icon" :size="18" />
          <span class="font-medium">{{ tab.label }}</span>
          <ChevronRight v-if="activeTab === tab.id" :size="16" class="ml-auto" />
        </button>
      </nav>
    </aside>

    <!-- Settings Content -->
    <main class="flex-1 p-6 overflow-y-auto">
      <div class="max-w-2xl">
        <!-- LLM Provider Settings -->
        <div v-if="activeTab === 'llm'" class="space-y-6">
          <div>
            <h3 class="text-xl font-semibold mb-4">LLM Provider</h3>
            <p class="text-muted-foreground mb-6">
              Configure your preferred AI model provider
            </p>
          </div>

          <!-- Provider Selection -->
          <div class="space-y-4">
            <div>
              <span class="text-sm font-medium mb-3 block">Choose Provider</span>
              <div class="grid grid-cols-3 gap-3">
                <button
                  v-for="provider in providers"
                  :key="provider.id"
                  @click="llmConfig.provider = provider.id"
                  :class="[
                    'p-4 rounded-lg border-2 transition-all text-center',
                    llmConfig.provider === provider.id
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/50'
                  ]"
                >
                  <div class="text-2xl mb-2">{{ provider.emoji }}</div>
                  <div class="font-medium text-sm">{{ provider.name }}</div>
                  <div class="text-xs text-muted-foreground mt-1">{{ provider.subtitle }}</div>
                </button>
              </div>
            </div>

            <!-- API Key (for cloud providers) -->
            <div v-if="llmConfig.provider !== 'ollama'" class="space-y-2">
              <label class="block">
                <span class="text-sm font-medium mb-2 block">API Key</span>
                <div class="relative">
                  <input
                    v-model="llmConfig.apiKey"
                    :type="showApiKey ? 'text' : 'password'"
                    placeholder="sk-..."
                    class="w-full px-3 py-2.5 pr-10 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    @click="showApiKey = !showApiKey"
                    type="button"
                    class="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent/50 rounded"
                  >
                    <Eye v-if="!showApiKey" :size="16" />
                    <EyeOff v-else :size="16" />
                  </button>
                </div>
              </label>
            </div>

            <!-- Base URL (optional) -->
            <div class="space-y-2">
              <label class="block">
                <span class="text-sm font-medium mb-2 block">
                  Base URL 
                  <span class="text-muted-foreground text-xs">(optional)</span>
                </span>
                <input
                  v-model="llmConfig.baseURL"
                  type="url"
                  :placeholder="getPlaceholderURL()"
                  class="w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>

            <!-- Model (for Ollama) -->
            <div v-if="llmConfig.provider === 'ollama'" class="space-y-2">
              <label class="block">
                <span class="text-sm font-medium mb-2 block">Model</span>
                <input
                  v-model="llmConfig.model"
                  type="text"
                  placeholder="llama2, mistral, etc."
                  class="w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>

            <!-- Enable Tools -->
            <div class="space-y-2">
              <label class="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors">
                <div>
                  <span class="text-sm font-medium block">Enable MCP Tools</span>
                  <span class="text-xs text-muted-foreground">Allow AI to use filesystem, code execution, and other tools</span>
                </div>
                <input
                  v-model="toolsEnabled"
                  @change="toggleTools"
                  type="checkbox"
                  class="w-4 h-4 text-primary bg-background border-muted rounded focus:ring-primary/20"
                />
              </label>
            </div>

            <!-- Save Button -->
            <div class="flex gap-3 pt-4">
              <button
                @click="saveLLMConfig"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Save Configuration
              </button>
              <button
                @click="testConnection"
                class="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Test Connection
              </button>
            </div>

            <!-- Status Message -->
            <transition name="fade">
              <div v-if="statusMessage" :class="[
                'p-4 rounded-lg flex items-start gap-3',
                statusMessage.type === 'success' 
                  ? 'bg-green-500/10 border border-green-500/20' 
                  : 'bg-red-500/10 border border-red-500/20'
              ]">
                <Check v-if="statusMessage.type === 'success'" :size="18" class="text-green-600 flex-shrink-0 mt-0.5" />
                <AlertCircle v-else :size="18" class="text-red-600 flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                  <p class="text-sm font-medium" :class="statusMessage.type === 'success' ? 'text-green-800' : 'text-red-800'">
                    {{ statusMessage.text }}
                  </p>
                  <p v-if="statusMessage.type === 'success'" class="text-xs text-green-700 mt-1">
                    You can now start chatting with your AI assistant.
                  </p>
                </div>
              </div>
            </transition>
          </div>
        </div>

        <!-- Theme Settings -->
        <div v-if="activeTab === 'appearance'" class="space-y-6">
          <div>
            <h3 class="text-xl font-semibold mb-4">Appearance</h3>
            <p class="text-muted-foreground mb-6">
              Customize the look and feel of the application
            </p>
          </div>

          <div class="space-y-4">
            <label class="block">
              <span class="text-sm font-medium mb-2 block">Theme</span>
              <select 
                v-model="theme"
                class="w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </label>
          </div>
        </div>

        <!-- Shortcuts -->
        <div v-if="activeTab === 'shortcuts'" class="space-y-6">
          <div>
            <h3 class="text-xl font-semibold mb-4">Keyboard Shortcuts</h3>
            <p class="text-muted-foreground mb-6">
              Quick actions to enhance your productivity
            </p>
          </div>

          <div class="space-y-3">
            <div
              v-for="shortcut in shortcuts"
              :key="shortcut.key"
              class="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <span class="text-sm">{{ shortcut.description }}</span>
              <kbd class="px-2 py-1 text-xs bg-background border rounded">
                {{ shortcut.key }}
              </kbd>
            </div>
          </div>
        </div>

        <!-- Plugins -->
        <div v-if="activeTab === 'plugins'" class="space-y-6">
          <div>
            <h3 class="text-xl font-semibold mb-4">Plugins</h3>
            <p class="text-muted-foreground mb-6">
              Extend MiaoDa Chat with additional features and tools
            </p>
          </div>

          <div v-if="plugins.length === 0" class="text-center py-12 bg-muted/30 rounded-lg">
            <Puzzle :size="48" class="mx-auto mb-4 text-muted-foreground" />
            <p class="text-muted-foreground">No plugins installed</p>
            <button class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Browse Plugins
            </button>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="plugin in plugins"
              :key="plugin.id"
              class="p-4 bg-muted/30 rounded-lg"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h4 class="font-semibold">{{ plugin.name }}</h4>
                    <span class="text-xs px-2 py-0.5 bg-muted rounded">v{{ plugin.version }}</span>
                  </div>
                  <p class="text-sm text-muted-foreground mb-2">{{ plugin.description }}</p>
                  <div class="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>ID: {{ plugin.id }}</span>
                    <span v-if="plugin.author">By {{ plugin.author }}</span>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="plugin.enabled"
                    @change="togglePlugin(plugin.id, $event.target.checked)"
                    class="sr-only peer"
                  >
                  <div class="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary/80 transition-colors"></div>
                  <div class="absolute left-0.5 top-0.5 bg-background w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5"></div>
                </label>
              </div>
              
              <!-- Plugin capabilities -->
              <div v-if="plugin.capabilities" class="mt-3 flex gap-2">
                <span 
                  v-if="plugin.capabilities.tools"
                  class="text-xs px-2 py-1 bg-blue-500/10 text-blue-600 rounded"
                >
                  Tools
                </span>
                <span 
                  v-if="plugin.capabilities.commands"
                  class="text-xs px-2 py-1 bg-green-500/10 text-green-600 rounded"
                >
                  Commands
                </span>
                <span 
                  v-if="plugin.capabilities.themes"
                  class="text-xs px-2 py-1 bg-purple-500/10 text-purple-600 rounded"
                >
                  Themes
                </span>
                <span 
                  v-if="plugin.capabilities.ui"
                  class="text-xs px-2 py-1 bg-orange-500/10 text-orange-600 rounded"
                >
                  UI
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Bot, Palette, ArrowLeft, Keyboard, Puzzle, ChevronRight, Check, AlertCircle, Eye, EyeOff } from 'lucide-vue-next'

const tabs = [
  { id: 'llm', label: 'LLM Provider', icon: Bot },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  { id: 'plugins', label: 'Plugins', icon: Puzzle }
]

const activeTab = ref('llm')
const theme = ref('system')
const shortcuts = ref<Array<{ key: string, description: string }>>([])
const toolsEnabled = ref(false)
const plugins = ref<Array<any>>([])
const showApiKey = ref(false)

// Provider configurations
const providers = [
  { id: 'openai', name: 'OpenAI', emoji: '🤖', subtitle: 'GPT-4, GPT-3.5' },
  { id: 'anthropic', name: 'Anthropic', emoji: '🧠', subtitle: 'Claude 3' },
  { id: 'ollama', name: 'Ollama', emoji: '🦙', subtitle: 'Local models' }
]

const llmConfig = reactive({
  provider: 'openai' as 'openai' | 'anthropic' | 'ollama',
  apiKey: '',
  baseURL: '',
  model: ''
})

const statusMessage = ref<{ type: 'success' | 'error', text: string } | null>(null)

const getPlaceholderURL = () => {
  switch (llmConfig.provider) {
    case 'openai':
      return 'https://api.openai.com/v1'
    case 'anthropic':
      return 'https://api.anthropic.com'
    case 'ollama':
      return 'http://localhost:11434'
    default:
      return ''
  }
}

const saveLLMConfig = async () => {
  statusMessage.value = null
  
  const result = await window.api.llm.setProvider({
    provider: llmConfig.provider,
    apiKey: llmConfig.apiKey || undefined,
    baseURL: llmConfig.baseURL || undefined,
    model: llmConfig.model || undefined
  })
  
  if (result.success) {
    statusMessage.value = {
      type: 'success',
      text: 'Configuration saved successfully!'
    }
  } else {
    statusMessage.value = {
      type: 'error',
      text: result.error || 'Failed to save configuration'
    }
  }
}

const testConnection = async () => {
  statusMessage.value = null
  
  try {
    // First save the config
    const saveResult = await window.api.llm.setProvider({
      provider: llmConfig.provider,
      apiKey: llmConfig.apiKey || undefined,
      baseURL: llmConfig.baseURL || undefined,
      model: llmConfig.model || undefined
    })
    
    if (!saveResult.success) {
      throw new Error(saveResult.error)
    }
    
    // Test with a simple message
    await window.api.llm.sendMessage('Hello', 'test', 'test')
    
    statusMessage.value = {
      type: 'success',
      text: 'Connection successful!'
    }
  } catch (error: any) {
    statusMessage.value = {
      type: 'error',
      text: `Connection failed: ${error.message}`
    }
  }
}

const toggleTools = async () => {
  try {
    await window.api.llm.setToolsEnabled(toolsEnabled.value)
  } catch (error: any) {
    console.error('Failed to toggle tools:', error)
    // Revert the toggle if it failed
    toolsEnabled.value = !toolsEnabled.value
  }
}

const togglePlugin = async (pluginId: string, enabled: boolean) => {
  try {
    if (enabled) {
      await window.api.plugins.enable(pluginId)
    } else {
      await window.api.plugins.disable(pluginId)
    }
    
    // Reload plugins list
    await loadPlugins()
    
    // Show success message
    statusMessage.value = {
      type: 'success',
      text: `Plugin ${enabled ? 'enabled' : 'disabled'} successfully`
    }
  } catch (error: any) {
    console.error('Failed to toggle plugin:', error)
    // Reload to revert UI state
    await loadPlugins()
    
    statusMessage.value = {
      type: 'error',
      text: `Failed to ${enabled ? 'enable' : 'disable'} plugin: ${error.message}`
    }
  }
}

const loadPlugins = async () => {
  try {
    plugins.value = await window.api.plugins.getAll()
  } catch (error) {
    console.error('Failed to load plugins:', error)
    plugins.value = []
  }
}

// Load existing config on mount
onMounted(async () => {
  // Load LLM config
  const config = await window.api.llm.getConfig()
  if (config) {
    llmConfig.provider = config.provider
    llmConfig.apiKey = config.apiKey || ''
    llmConfig.baseURL = config.baseURL || ''
    llmConfig.model = config.model || ''
  }
  
  // Load tools enabled state
  toolsEnabled.value = await window.api.llm.getToolsEnabled()
  
  // Load shortcuts
  shortcuts.value = await window.api.shortcuts.getAll()
  
  // Load plugins
  await loadPlugins()
})
</script>

<style scoped>
/* Fade transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgb(var(--muted-foreground) / 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--muted-foreground) / 0.5);
}

/* Form focus states */
input:focus, select:focus, textarea:focus {
  outline: none;
}

/* Smooth transitions */
button, input, select {
  transition: all 0.2s ease;
}
</style>