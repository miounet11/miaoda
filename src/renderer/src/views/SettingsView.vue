<template>
  <div class="settings-view flex h-screen relative overflow-hidden">
    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen && isMobile"
      class="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Settings Sidebar -->
    <aside
      class="settings-sidebar w-64 bg-gradient-to-b from-background to-background/95 backdrop-blur-md border-r border-border/60 flex flex-col transition-all duration-300 ease-in-out z-50 shadow-sm"
      :class="{
        'fixed top-0 left-0 h-full md:relative md:translate-x-0': isMobile,
        '-translate-x-full': isMobile && !sidebarOpen,
        'translate-x-0': !isMobile || sidebarOpen
      }"
    >
      <div class="p-4 border-b border-border/40 bg-surface-elevated/95 backdrop-blur-sm">
        <div class="flex items-center gap-3">
          <!-- Mobile menu button -->
          <button
            v-if="isMobile"
            @click="sidebarOpen = false"
            class="p-2 hover:bg-surface-hover/80 rounded-lg transition-all duration-200 transform hover:scale-105"
            title="Close menu"
           aria-label="按钮">
            <X :size="18" />
          </button>

          <button
            @click="$router.push('/')"
            class="p-2 hover:bg-surface-hover/80 rounded-lg transition-all duration-200 transform hover:scale-105"
            title="Back to chat"
           aria-label="按钮">
            <ArrowLeft :size="18" />
          </button>
          <h2 class="text-lg font-semibold text-text-primary">Settings</h2>
        </div>
      </div>

      <nav class="p-3 space-y-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'w-full text-left px-3 py-2.5 rounded-lg transition-all duration-300 flex items-center gap-3 transform',
            activeTab === tab.id
              ? 'bg-primary/12 border border-primary/25 text-primary shadow-md ring-1 ring-primary/20 translate-x-1'
              : 'hover:bg-surface-hover/80 border border-transparent hover:border-border/40 hover:shadow-sm hover:translate-x-2'
          ]"
         aria-label="按钮">
          <component :is="tab.icon" :size="18" />
          <span class="font-medium">{{ tab.label }}</span>
          <ChevronRight v-if="activeTab === tab.id" :size="16" class="ml-auto" />
        </button>
      </nav>
    </aside>

    <!-- Settings Content -->
    <main class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <!-- Mobile header -->
      <header
        v-if="isMobile"
        class="flex items-center justify-between p-4 border-b border-border/40 bg-surface-elevated/95 backdrop-blur-sm md:hidden flex-shrink-0"
      >
        <button
          @click="sidebarOpen = !sidebarOpen"
          class="p-2 hover:bg-surface-hover/80 rounded-lg transition-all duration-200 transform hover:scale-105"
         aria-label="按钮">
          <Menu :size="20" />
        </button>
        <h1 class="font-semibold text-text-primary">{{ getActiveTabLabel() }}</h1>
        <button
          @click="$router.push('/')"
          class="p-2 hover:bg-surface-hover/80 rounded-lg transition-all duration-200 transform hover:scale-105"
         aria-label="按钮">
          <ArrowLeft :size="20" />
        </button>
      </header>

      <div class="flex-1 overflow-y-auto">
        <div class="max-w-2xl mx-auto p-4 sm:p-6">
          <!-- LLM Provider Settings -->
          <div v-if="activeTab === 'llm'" class="space-y-6">
            <div>
              <h3 class="text-xl font-semibold mb-4">LLM Provider Configuration</h3>
              <p class="text-muted-foreground mb-6">
                Select and configure your AI model provider. All settings are managed in one place.
              </p>
            </div>

            <!-- Unified Provider Configuration -->
            <UnifiedProviderConfig
              v-model:provider="llmConfig.provider"
              v-model:api-key="llmConfig.apiKey"
              v-model:base-url="llmConfig.baseURL"
              v-model:model="llmConfig.model"
              :custom-providers="customProviders"
              @provider-selected="handleProviderSelected"
              @custom-provider-added="handleProviderAdded"
              @custom-provider-updated="handleProviderUpdated"
              @custom-provider-deleted="handleProviderDeleted"
              @custom-provider-tested="handleProviderTested"
            />

            <!-- Tools and Advanced Settings -->
            <div class="space-y-4 border-t pt-6">
              <h4 class="text-lg font-medium">Advanced Settings</h4>

              <!-- Enable Tools -->
              <div class="space-y-2">
                <label
                  class="flex items-center justify-between p-4 bg-surface-elevated/80 border border-border/40 rounded-xl cursor-pointer hover:bg-surface-hover/80 hover:border-border/60 hover:shadow-sm transition-all duration-200 transform hover:scale-[1.01]"
                >
                  <div>
                    <span class="text-sm font-semibold block text-text-primary"
                      >Enable MCP Tools</span
                    >
                    <span class="text-xs text-text-secondary mt-1"
                      >Allow AI to use filesystem, code execution, and other tools</span
                    >
                  </div>
                  <input id="input-94x03i8ev"
                    v-model="toolsEnabled"
                    @change="toggleTools"
                    type="checkbox"
                    class="w-5 h-5 text-primary bg-surface-elevated border-border/60 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary/60 transition-all duration-200"
                   aria-label="输入框">
                </label>
              </div>

              <!-- Save and Test Actions -->
              <div class="flex gap-3 pt-4">
                <button
                  @click="saveLLMConfig"
                  :disabled="!isConfigValid"
                  class="px-4 py-2 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-lg hover:from-primary/90 hover:to-primary/80 transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                 aria-label="按钮">
                  Save Configuration
                </button>
                <button
                  @click="testConnection"
                  :disabled="!isConfigValid || isTestingConnection"
                  class="px-4 py-2 bg-surface-elevated text-text-primary border border-border/60 rounded-lg hover:bg-surface-hover hover:border-border hover:shadow-sm transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                 aria-label="按钮">
                  <Loader2 v-if="isTestingConnection" :size="16" class="animate-spin" />
                  <Zap v-else :size="16" />
                  {{ isTestingConnection ? 'Testing...' : 'Test Connection' }}
                </button>
              </div>

              <!-- Status Message -->
              <transition name="fade">
                <div
                  v-if="statusMessage"
                  :class="[
                    'p-4 rounded-lg flex items-start gap-3',
                    statusMessage.type === 'success'
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-red-500/10 border border-red-500/20'
                  ]"
                >
                  <Check
                    v-if="statusMessage.type === 'success'"
                    :size="18"
                    class="text-green-600 flex-shrink-0 mt-0.5"
                  />
                  <AlertCircle v-else :size="18" class="text-red-600 flex-shrink-0 mt-0.5" />
                  <div class="flex-1">
                    <p
                      class="text-sm font-medium"
                      :class="statusMessage.type === 'success' ? 'text-green-800' : 'text-red-800'"
                    >
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

          <!-- Custom Providers -->
          <div v-if="activeTab === 'providers'" class="space-y-6">
            <div>
              <h3 class="text-xl font-semibold mb-4">Custom Providers</h3>
              <p class="text-muted-foreground mb-6">
                Manage custom LLM providers to extend beyond the default options
              </p>
            </div>

            <ProviderList
              :providers="customProviders"
              @provider-added="handleProviderAdded"
              @provider-updated="handleProviderUpdated"
              @provider-deleted="handleProviderDeleted"
              @provider-toggled="handleProviderToggled"
              @provider-tested="handleProviderTested"
              @providers-reordered="handleProvidersReordered"
            />
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
                <span class="text-sm font-semibold mb-3 block text-text-primary">Theme</span>
                <div class="relative">
                  <select
                    v-model="theme"
                    class="w-full px-4 py-3 bg-surface-elevated border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 hover:border-border hover:bg-surface-hover transition-all duration-200 text-text-primary appearance-none pr-10"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                  <div
                    class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                  >
                    <ChevronDown :size="16" class="text-text-tertiary" />
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- Shortcuts -->
          <div v-if="activeTab === 'shortcuts'" class="space-y-6">
            <div>
              <h3 class="text-xl font-semibold mb-4">Keyboard Shortcuts</h3>
              <p class="text-muted-foreground mb-6">Quick actions to enhance your productivity</p>
            </div>

            <div class="space-y-3">
              <div
                v-for="shortcut in shortcuts"
                :key="shortcut.key"
                class="flex items-center justify-between p-4 bg-surface-elevated/80 border border-border/40 rounded-xl hover:bg-surface-hover/80 hover:border-border/60 hover:shadow-sm transition-all duration-200 transform hover:scale-[1.005]"
              >
                <span class="text-sm font-medium text-text-primary">{{
                  shortcut.description
                }}</span>
                <kbd
                  class="px-3 py-1.5 text-xs font-mono bg-surface-elevated border border-border/60 rounded-lg shadow-sm text-text-secondary"
                >
                  {{ shortcut.key }}
                </kbd>
              </div>
            </div>
          </div>

          <!-- Language Settings -->
          <div v-if="activeTab === 'language'" class="space-y-6">
            <div>
              <h3 class="text-xl font-semibold mb-4">Language Settings</h3>
              <p class="text-muted-foreground mb-6">
                Choose your preferred language for the interface. All settings and messages will be
                displayed in the selected language.
              </p>
            </div>

            <div class="space-y-6">
              <!-- Current Language Display -->
              <div
                class="bg-surface-elevated/80 border border-border/40 p-6 rounded-xl hover:bg-surface-hover/50 hover:border-border/60 hover:shadow-sm transition-all duration-200"
              >
                <div class="flex items-center gap-4 mb-4">
                  <div class="p-2 bg-primary/10 rounded-lg">
                    <Globe :size="24" class="text-primary" />
                  </div>
                  <div>
                    <h4 class="font-semibold text-text-primary">Interface Language</h4>
                    <p class="text-sm text-text-secondary">
                      Select your preferred language for the user interface
                    </p>
                  </div>
                </div>

                <!-- Language Selector Component -->
                <LanguageSelector
                  :show-native="true"
                  :show-header="false"
                  :show-footer="true"
                  size="large"
                  variant="default"
                  @language-change="handleLanguageChange"
                />
              </div>

              <!-- Language Information -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-muted/20 rounded-lg">
                  <h5 class="font-semibold mb-2 flex items-center gap-2">
                    <Check :size="16" class="text-green-500" />
                    Supported Languages
                  </h5>
                  <ul class="text-sm text-muted-foreground space-y-1">
                    <li>🇺🇸 English</li>
                    <li>🇨🇳 简体中文 (Simplified Chinese)</li>
                    <li>🇯🇵 日本語 (Japanese)</li>
                    <li>🇮🇳 हिन्दी (Hindi)</li>
                  </ul>
                </div>

                <div class="p-4 bg-muted/20 rounded-lg">
                  <h5 class="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle :size="16" class="text-blue-500" />
                    Translation Notes
                  </h5>
                  <p class="text-sm text-muted-foreground">
                    Language changes apply immediately to the interface. AI model responses will
                    still be in the language you communicate with the model.
                  </p>
                </div>
              </div>

              <!-- Reset to Default -->
              <div class="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                <div>
                  <h5 class="font-semibold">Reset Language Settings</h5>
                  <p class="text-sm text-muted-foreground">Reset to browser's default language</p>
                </div>
                <button
                  @click="resetLanguage"
                  class="px-4 py-2 bg-surface-elevated text-text-primary border border-border/60 hover:bg-surface-hover hover:border-border hover:shadow-sm rounded-lg transition-all duration-200 transform hover:scale-105"
                 aria-label="按钮">
                  Reset to Default
                </button>
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
              <button
                class="mt-4 px-4 py-2 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-lg hover:from-primary/90 hover:to-primary/80 transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
               aria-label="按钮">
                Browse Plugins
              </button>
            </div>

            <div v-else class="space-y-4">
              <div v-for="plugin in plugins" :key="plugin.id" class="p-4 bg-muted/30 rounded-lg">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <h4 class="font-semibold">{{ plugin.name }}</h4>
                      <span class="text-xs px-2 py-0.5 bg-muted rounded"
                        >v{{ plugin.version }}</span
                      >
                    </div>
                    <p class="text-sm text-muted-foreground mb-2">{{ plugin.description }}</p>
                    <div class="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>ID: {{ plugin.id }}</span>
                      <span v-if="plugin.author">By {{ plugin.author }}</span>
                    </div>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input id="input-wzpicyrvc"
                      type="checkbox"
                      :checked="plugin.enabled"
                      @change="togglePlugin(plugin.id, $event.target.checked)"
                      class="sr-only peer"
                     aria-label="输入框">
                    <div
                      class="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary/80 transition-colors"
                    />
                    <div
                      class="absolute left-0.5 top-0.5 bg-background w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5"
                    />
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
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  Bot,
  Palette,
  ArrowLeft,
  Keyboard,
  Puzzle,
  ChevronRight,
  ChevronDown,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Menu,
  X,
  Server,
  Loader2,
  Zap,
  Globe
} from 'lucide-vue-next'
import ProviderList from '@renderer/src/components/settings/ProviderList.vue'
import ProviderSelector from '@renderer/src/components/settings/ProviderSelector.vue'
import UnifiedProviderConfig from '@renderer/src/components/settings/UnifiedProviderConfig.vue'
import LanguageSelector from '@/components/settings/LanguageSelector.vue'
import { useCustomProvidersStore } from '@renderer/src/stores/customProviders'
import type { LLMProvider } from '@renderer/src/types/api'

const tabs = [
  { id: 'llm', label: 'LLM Provider', icon: Bot },
  { id: 'providers', label: 'Custom Providers', icon: Server },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'language', label: 'Language', icon: Globe },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  { id: 'plugins', label: 'Plugins', icon: Puzzle }
]

const activeTab = ref('llm')
const theme = ref('system')
const shortcuts = ref<Array<{ key: string; description: string }>>([])
const toolsEnabled = ref(false)
const plugins = ref<Array<any>>([])
const showApiKey = ref(false)
const customProviders = ref<LLMProvider[]>([])

// Check for URL parameters to set initial tab
const urlParams = new URLSearchParams(window.location.search)
const initialTab = urlParams.get('tab')
if (initialTab && ['llm', 'providers', 'appearance', 'shortcuts', 'plugins'].includes(initialTab)) {
  activeTab.value = initialTab
}

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

const statusMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const isTestingConnection = ref(false)

// Computed properties
const isConfigValid = computed(() => {
  if (!llmConfig.provider) return false

  // For built-in providers, require API key (except Ollama)
  if (['openai', 'anthropic', 'google'].includes(llmConfig.provider)) {
    return !!llmConfig.apiKey
  }

  // For Ollama, require model name
  if (llmConfig.provider === 'ollama') {
    return !!llmConfig.model
  }

  // For custom providers, basic validation
  return !!llmConfig.provider
})

// Mobile responsive state
const sidebarOpen = ref(false)
const isMobile = ref(false)

// Check if device is mobile
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) {
    sidebarOpen.value = false
  }
}

// Handle window resize
const handleResize = () => {
  checkMobile()
}

// Get active tab label for mobile header
const getActiveTabLabel = () => {
  const tab = tabs.find(t => t.id === activeTab.value)
  return tab ? tab.label : 'Settings'
}

// Language handling functions
const handleLanguageChange = async (locale: any) => {
  try {
    console.log('Language changed to:', locale)
    // The LanguageSelector component handles the actual language change
    // We can add any additional logic here if needed
  } catch (error) {
    console.error('Failed to change language:', error)
  }
}

const resetLanguage = async () => {
  try {
    // Import the i18n service dynamically to avoid circular dependencies
    const { useI18nService, getDefaultLocale } = await import('@renderer/src/services/i18n')
    const i18nService = useI18nService()
    const defaultLocale = getDefaultLocale()

    await i18nService.setLocale(defaultLocale)
    console.log('Language reset to default:', defaultLocale)
  } catch (error) {
    console.error('Failed to reset language:', error)
  }
}

const handleProviderSelected = async (config: any) => {
  // Update llmConfig based on selected provider
  if (config) {
    llmConfig.provider = config.provider || config.id
    llmConfig.apiKey = config.apiKey || ''
    llmConfig.baseURL = config.baseURL || ''
    llmConfig.model = config.model || ''

    // Don't auto-save, let the user save manually with the Save button
    console.log('Provider selected:', config)
  }
}

// Auto-save LLM configuration when changed
const saveConfigurationImmediately = async () => {
  try {
    // Save LLM config to backend
    await window.api.llm.setProvider({
      provider: llmConfig.provider,
      apiKey: llmConfig.apiKey,
      baseURL: llmConfig.baseURL,
      model: llmConfig.model
    })

    console.log('LLM configuration saved successfully')
  } catch (error) {
    console.error('Failed to save LLM configuration:', error)
  }
}

const saveLLMConfig = async () => {
  statusMessage.value = null

  try {
    // Directly save the configuration
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
  } catch (error: any) {
    statusMessage.value = {
      type: 'error',
      text: `Failed to save: ${error.message}`
    }
  }
}

const customProvidersStore = useCustomProvidersStore()

const testConnection = async () => {
  if (isTestingConnection.value || !isConfigValid.value) return

  isTestingConnection.value = true
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
  } finally {
    isTestingConnection.value = false
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

// Custom Provider Handlers
const handleProviderAdded = async (provider: LLMProvider) => {
  try {
    // In real implementation, save to backend/storage
    customProviders.value.push(provider)
    statusMessage.value = {
      type: 'success',
      text: `Provider "${provider.displayName}" added successfully!`
    }
  } catch (error: any) {
    statusMessage.value = {
      type: 'error',
      text: `Failed to add provider: ${error.message}`
    }
  }
}

const handleProviderUpdated = async (provider: LLMProvider) => {
  try {
    const index = customProviders.value.findIndex(p => p.id === provider.id)
    if (index !== -1) {
      customProviders.value[index] = provider
      statusMessage.value = {
        type: 'success',
        text: `Provider "${provider.displayName}" updated successfully!`
      }
    }
  } catch (error: any) {
    statusMessage.value = {
      type: 'error',
      text: `Failed to update provider: ${error.message}`
    }
  }
}

const handleProviderDeleted = async (providerId: string) => {
  try {
    const index = customProviders.value.findIndex(p => p.id === providerId)
    if (index !== -1) {
      const providerName = customProviders.value[index].displayName
      customProviders.value.splice(index, 1)
      statusMessage.value = {
        type: 'success',
        text: `Provider "${providerName}" deleted successfully!`
      }
    }
  } catch (error: any) {
    statusMessage.value = {
      type: 'error',
      text: `Failed to delete provider: ${error.message}`
    }
  }
}

const handleProviderToggled = async (providerId: string, enabled: boolean) => {
  try {
    const provider = customProviders.value.find(p => p.id === providerId)
    if (provider) {
      provider.enabled = enabled
      statusMessage.value = {
        type: 'success',
        text: `Provider "${provider.displayName}" ${enabled ? 'enabled' : 'disabled'} successfully!`
      }
    }
  } catch (error: any) {
    statusMessage.value = {
      type: 'error',
      text: `Failed to toggle provider: ${error.message}`
    }
  }
}

const handleProviderTested = async (providerId: string) => {
  try {
    const provider = customProviders.value.find(p => p.id === providerId)
    if (provider) {
      // Simulate connection test
      provider.status = 'configuring'

      setTimeout(() => {
        // Randomly succeed or fail for demo
        provider.status = Math.random() > 0.3 ? 'connected' : 'error'

        statusMessage.value = {
          type: provider.status === 'connected' ? 'success' : 'error',
          text:
            provider.status === 'connected'
              ? `Connection to "${provider.displayName}" successful!`
              : `Connection to "${provider.displayName}" failed. Check configuration.`
        }
      }, 2000)
    }
  } catch (error: any) {
    statusMessage.value = {
      type: 'error',
      text: `Failed to test provider: ${error.message}`
    }
  }
}

const handleProvidersReordered = async (providerIds: string[]) => {
  try {
    // Reorder providers based on the new order
    const reorderedProviders = providerIds
      .map(id => customProviders.value.find(p => p.id === id))
      .filter(Boolean) as LLMProvider[]

    customProviders.value = reorderedProviders

    statusMessage.value = {
      type: 'success',
      text: 'Provider order updated successfully!'
    }
  } catch (error: any) {
    statusMessage.value = {
      type: 'error',
      text: `Failed to reorder providers: ${error.message}`
    }
  }
}

// Simple debounce function
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout
  return function (...args: any[]) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(null, args), wait)
  }
}

// Watch for configuration changes and auto-save
watch(
  [
    () => llmConfig.provider,
    () => llmConfig.apiKey,
    () => llmConfig.baseURL,
    () => llmConfig.model
  ],
  debounce(async () => {
    if (llmConfig.provider) {
      // Only save if a provider is selected
      await saveConfigurationImmediately()
    }
  }, 500),
  { deep: true }
)

// Load existing config on mount
onMounted(async () => {
  // Setup responsive behavior
  checkMobile()
  window.addEventListener('resize', handleResize)

  // Initialize custom providers store
  await customProvidersStore.initialize()

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

  // Load custom providers from store - creating proper LLMProvider objects
  customProviders.value = customProvidersStore.providers.map(p => {
    const provider: LLMProvider = {
      id: p.id,
      name: p.config.name,
      displayName: p.config.displayName || p.config.name,
      description: '',
      icon: '⚡',
      models: [
        {
          id: p.config.model,
          name: p.config.model,
          displayName: p.config.model,
          contextLength: 4096,
          capabilities: {
            chat: true,
            streaming: true,
            toolCalling: false,
            vision: false
          }
        }
      ],
      capabilities: {
        chat: true,
        streaming: true,
        toolCalling: false,
        vision: false
      },
      configuration: {
        baseUrl: p.config.baseURL,
        apiKey: p.config.apiKey,
        defaultModel: p.config.model,
        headers: p.config.headers || {}
      },
      status: p.isHealthy ? 'connected' : 'disconnected',
      enabled: p.isHealthy
    }
    return provider
  })
})

// Cleanup
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>

/* 🎨 响应式设计系统 */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* 🎨 响应式实用类 */
.container-sm { max-width: var(--breakpoint-sm); }
.container-md { max-width: var(--breakpoint-md); }
.container-lg { max-width: var(--breakpoint-lg); }
.container-xl { max-width: var(--breakpoint-xl); }

/* 响应式显示 */
.hidden-sm { display: none; }
.hidden-md { display: none; }
.hidden-lg { display: none; }

@media (min-width: 640px) {
  .hidden-sm { display: block; }
}

@media (min-width: 768px) {
  .hidden-md { display: block; }
}

@media (min-width: 1024px) {
  .hidden-lg { display: block; }
}

/* 响应式文本 */
.text-responsive-sm { font-size: clamp(0.875rem, 2vw, 1rem); }
.text-responsive-base { font-size: clamp(1rem, 2.5vw, 1.125rem); }
.text-responsive-lg { font-size: clamp(1.125rem, 3vw, 1.25rem); }
.text-responsive-xl { font-size: clamp(1.25rem, 3.5vw, 1.5rem); }

/* 响应式间距 */
.space-responsive-sm { gap: clamp(0.5rem, 2vw, 1rem); }
.space-responsive-md { gap: clamp(1rem, 3vw, 1.5rem); }
.space-responsive-lg { gap: clamp(1.5rem, 4vw, 2rem); }

/* 响应式网格 */
.grid-responsive-sm {
  grid-template-columns: repeat(auto-fit, minmax(clamp(200px, 25vw, 300px), 1fr));
}

.grid-responsive-md {
  grid-template-columns: repeat(auto-fit, minmax(clamp(250px, 30vw, 350px), 1fr));
}

.grid-responsive-lg {
  grid-template-columns: repeat(auto-fit, minmax(clamp(300px, 35vw, 400px), 1fr));
}

/* 响应式布局调整 */
@media (max-width: 640px) {
  .flex-col-mobile { flex-direction: column; }
  .grid-1-mobile { grid-template-columns: 1fr; }
  .gap-2-mobile { gap: var(--space-2); }
  .p-4-mobile { padding: var(--space-4); }
}

@media (max-width: 768px) {
  .flex-col-tablet { flex-direction: column; }
  .grid-2-tablet { grid-template-columns: repeat(2, 1fr); }
  .gap-4-tablet { gap: var(--space-4); }
  .p-6-tablet { padding: var(--space-6); }
}

@media (max-width: 1024px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: static;
  }
}

/* 🎨 现代布局系统 */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-start {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.flex-end {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.flex-wrap {
  display: flex;
  flex-wrap: wrap;
}

/* 🎨 网格系统 */
.grid-auto-fit {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
}

.grid-auto-fill {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
}

.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

.grid-gap-2 { gap: var(--space-2); }
.grid-gap-4 { gap: var(--space-4); }
.grid-gap-6 { gap: var(--space-6); }

/* 🎨 卡片布局 */
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.card-interactive:hover {
  cursor: pointer;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1);
}

/* 🎨 页面布局 */
.page-layout {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: white;
  border-bottom: 1px solid var(--color-gray-200);
}

.page-main {
  padding: var(--space-6) 0;
}

.page-footer {
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
}

/* 🎨 侧边栏布局 */
.sidebar-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-6);
}

.sidebar {
  position: sticky;
  top: var(--space-6);
  height: fit-content;
}

.sidebar-content {
  padding: var(--space-6);
  background: white;
  border-radius: 12px;
  border: 1px solid var(--color-gray-200);
}

/* 🎨 响应式工具 */
@media (max-width: 768px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .hidden-mobile { display: none; }
  .flex-mobile-col { flex-direction: column; }
  .grid-mobile-1 { grid-template-columns: 1fr; }
}

/* 🎨 完整间距系统 - 基于4px网格 */
:root {
  --space-0: 0;
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-5: 1.25rem;    /* 20px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */
  --space-32: 8rem;      /* 128px */

  /* 负间距 */
  --space-neg-1: -0.25rem;
  --space-neg-2: -0.5rem;
  --space-neg-4: -1rem;
}

/* 🎨 间距实用类 */
.m-1 { margin: var(--space-1); }
.m-2 { margin: var(--space-2); }
.m-3 { margin: var(--space-3); }
.m-4 { margin: var(--space-4); }
.m-6 { margin: var(--space-6); }
.m-8 { margin: var(--space-8); }

.p-1 { padding: var(--space-1); }
.p-2 { padding: var(--space-2); }
.p-3 { padding: var(--space-3); }
.p-4 { padding: var(--space-4); }
.p-6 { padding: var(--space-6); }
.p-8 { padding: var(--space-8); }

.mx-auto { margin-left: auto; margin-right: auto; }
.my-auto { margin-top: auto; margin-bottom: auto; }

.px-1 { padding-left: var(--space-1); padding-right: var(--space-1); }
.px-2 { padding-left: var(--space-2); padding-right: var(--space-2); }
.px-3 { padding-left: var(--space-3); padding-right: var(--space-3); }
.px-4 { padding-left: var(--space-4); padding-right: var(--space-4); }
.px-6 { padding-left: var(--space-6); padding-right: var(--space-6); }

.py-1 { padding-top: var(--space-1); padding-bottom: var(--space-1); }
.py-2 { padding-top: var(--space-2); padding-bottom: var(--space-2); }
.py-3 { padding-top: var(--space-3); padding-bottom: var(--space-3); }
.py-4 { padding-top: var(--space-4); padding-bottom: var(--space-4); }
.py-6 { padding-top: var(--space-6); padding-bottom: var(--space-6); }

/* 🎨 容器和布局间距 */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

.section-spacing {
  padding-top: var(--space-12);
  padding-bottom: var(--space-12);
}

.card-spacing {
  padding: var(--space-6);
}

.stack-sm > * + * { margin-top: var(--space-2); }
.stack-md > * + * { margin-top: var(--space-4); }
.stack-lg > * + * { margin-top: var(--space-6); }
.stack-xl > * + * { margin-top: var(--space-8); }

.inline-sm > * + * { margin-left: var(--space-2); }
.inline-md > * + * { margin-left: var(--space-4); }
.inline-lg > * + * { margin-left: var(--space-6); }

/* 🎨 完整字体系统 */
:root {
  /* 字体族 */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;

  /* 字体大小 - 基于1.25的倍数比例 */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
  --font-size-5xl: 3rem;      /* 48px */

  /* 字体权重 */
  --font-weight-thin: 100;
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  /* 行高 */
  --line-height-tight: 1.25;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  --line-height-loose: 2;

  /* 字母间距 */
  --letter-spacing-tighter: -0.05em;
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;
  --letter-spacing-wider: 0.05em;
  --letter-spacing-widest: 0.1em;
}

/* 🎨 字体实用类 */
.font-sans { font-family: var(--font-family-sans); }
.font-mono { font-family: var(--font-family-mono); }

.text-xs { font-size: var(--font-size-xs); line-height: var(--line-height-tight); }
.text-sm { font-size: var(--font-size-sm); line-height: var(--line-height-snug); }
.text-base { font-size: var(--font-size-base); line-height: var(--line-height-normal); }
.text-lg { font-size: var(--font-size-lg); line-height: var(--line-height-relaxed); }
.text-xl { font-size: var(--font-size-xl); line-height: var(--line-height-relaxed); }
.text-2xl { font-size: var(--font-size-2xl); line-height: var(--line-height-loose); }
.text-3xl { font-size: var(--font-size-3xl); line-height: var(--line-height-loose); }

.font-thin { font-weight: var(--font-weight-thin); }
.font-light { font-weight: var(--font-weight-light); }
.font-normal { font-weight: var(--font-weight-normal); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }

.leading-tight { line-height: var(--line-height-tight); }
.leading-snug { line-height: var(--line-height-snug); }
.leading-normal { line-height: var(--line-height-normal); }
.leading-relaxed { line-height: var(--line-height-relaxed); }

.tracking-tight { letter-spacing: var(--letter-spacing-tight); }
.tracking-normal { letter-spacing: var(--letter-spacing-normal); }
.tracking-wide { letter-spacing: var(--letter-spacing-wide); }

/* 🎨 文本层次优化 */
.heading-1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tighter);
  margin-bottom: 1rem;
}

.heading-2 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tighter);
  margin-bottom: 0.875rem;
}

.heading-3 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-tight);
  margin-bottom: 0.75rem;
}

.body-large {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  letter-spacing: var(--letter-spacing-normal);
}

.body-regular {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-normal);
}

.body-small {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-wide);
}

.caption {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-wide);
  color: var(--color-gray-600);
}

/* 🎨 高级色彩系统 */
:root {
  /* 基础色彩 */
  --color-primary: hsl(221 83% 53%);
  --color-primary-hover: hsl(221 83% 48%);
  --color-primary-active: hsl(221 83% 43%);

  /* 语义色彩 */
  --color-success: hsl(142 71% 45%);
  --color-warning: hsl(38 92% 50%);
  --color-error: hsl(0 84% 60%);
  --color-info: hsl(217 91% 60%);

  /* 中性色彩 */
  --color-gray-50: hsl(210 20% 98%);
  --color-gray-100: hsl(210 15% 95%);
  --color-gray-200: hsl(210 10% 89%);
  --color-gray-300: hsl(210 8% 75%);
  --color-gray-400: hsl(210 8% 56%);
  --color-gray-500: hsl(210 6% 43%);
  --color-gray-600: hsl(210 8% 35%);
  --color-gray-700: hsl(210 10% 28%);
  --color-gray-800: hsl(210 12% 21%);
  --color-gray-900: hsl(210 15% 15%);

  /* 透明度变体 */
  --color-primary-10: hsl(221 83% 53% / 0.1);
  --color-primary-20: hsl(221 83% 53% / 0.2);
  --color-primary-30: hsl(221 83% 53% / 0.3);
  --color-success-10: hsl(142 71% 45% / 0.1);
  --color-error-10: hsl(0 84% 60% / 0.1);
}

/* 🎨 色彩实用类 */
.text-primary { color: var(--color-primary); }
.text-success { color: var(--color-success); }
.text-warning { color: var(--color-warning); }
.text-error { color: var(--color-error); }
.text-gray-500 { color: var(--color-gray-500); }
.text-gray-600 { color: var(--color-gray-600); }
.text-gray-700 { color: var(--color-gray-700); }

.bg-primary { background-color: var(--color-primary); }
.bg-primary-hover:hover { background-color: var(--color-primary-hover); }
.bg-success { background-color: var(--color-success); }
.bg-warning { background-color: var(--color-warning); }
.bg-error { background-color: var(--color-error); }

.border-primary { border-color: var(--color-primary); }
.border-success { border-color: var(--color-success); }
.border-error { border-color: var(--color-error); }

/* 🎨 对比度增强 */
.high-contrast {
  --color-primary: hsl(221 100% 40%);
  --color-gray-900: hsl(210 20% 10%);
  --color-gray-100: hsl(210 15% 95%);
}

/* 🎨 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  :root {
    --color-gray-50: hsl(210 15% 15%);
    --color-gray-100: hsl(210 12% 21%);
    --color-gray-200: hsl(210 10% 28%);
    --color-gray-300: hsl(210 8% 35%);
    --color-gray-400: hsl(210 6% 43%);
    --color-gray-500: hsl(210 8% 56%);
    --color-gray-600: hsl(210 8% 75%);
    --color-gray-700: hsl(210 10% 89%);
    --color-gray-800: hsl(210 15% 95%);
    --color-gray-900: hsl(210 20% 98%);
  }
}
/* 🎨 SettingsView 组件样式 - 符合现代CSS最佳实践 */

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 焦点样式 */
:focus-visible {
  outline: 2px solid hsl(var(--ring, 59 130 230));
  outline-offset: 2px;
}

/* 高对比度支持 */
@media (prefers-contrast: high) {
  :focus-visible {
    outline-width: 3px;
  }
}

/* 基础组件样式 */
.settingsview {
  /* 基础样式 */
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settingsview {
    /* 移动端样式 */
  }
}


/* 🎨 表单用户体验优化 */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}

.form-input.error {
  border-color: hsl(0 84% 60%);
}

.form-error {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: hsl(0 84% 60%);
}

.form-success {
  border-color: hsl(142 71% 45%);
}

/* 加载状态 */
.form-input.loading {
  background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  background-size: 200% 100%;
  animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}</style>