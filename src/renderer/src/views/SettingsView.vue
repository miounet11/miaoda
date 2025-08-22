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
          >
            <X :size="18" />
          </button>
          
          <button
            @click="$router.push('/')"
            class="p-2 hover:bg-surface-hover/80 rounded-lg transition-all duration-200 transform hover:scale-105"
            title="Back to chat"
          >
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
        >
          <component :is="tab.icon" :size="18" />
          <span class="font-medium">{{ tab.label }}</span>
          <ChevronRight v-if="activeTab === tab.id" :size="16" class="ml-auto" />
        </button>
      </nav>
    </aside>

    <!-- Settings Content -->
    <main class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <!-- Mobile header -->
      <header v-if="isMobile" class="flex items-center justify-between p-4 border-b border-border/40 bg-surface-elevated/95 backdrop-blur-sm md:hidden flex-shrink-0">
        <button
          @click="sidebarOpen = !sidebarOpen"
          class="p-2 hover:bg-surface-hover/80 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          <Menu :size="20" />
        </button>
        <h1 class="font-semibold text-text-primary">{{ getActiveTabLabel() }}</h1>
        <button
          @click="$router.push('/')"
          class="p-2 hover:bg-surface-hover/80 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
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
                <label class="flex items-center justify-between p-4 bg-surface-elevated/80 border border-border/40 rounded-xl cursor-pointer hover:bg-surface-hover/80 hover:border-border/60 hover:shadow-sm transition-all duration-200 transform hover:scale-[1.01]">
                  <div>
                    <span class="text-sm font-semibold block text-text-primary">Enable MCP Tools</span>
                    <span class="text-xs text-text-secondary mt-1">Allow AI to use filesystem, code execution, and other tools</span>
                  </div>
                  <input
                    v-model="toolsEnabled"
                    @change="toggleTools"
                    type="checkbox"
                    class="w-5 h-5 text-primary bg-surface-elevated border-border/60 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary/60 transition-all duration-200"
                  >
                </label>
              </div>

              <!-- Save and Test Actions -->
              <div class="flex gap-3 pt-4">
                <button
                  @click="saveLLMConfig"
                  :disabled="!isConfigValid"
                  class="px-4 py-2 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-lg hover:from-primary/90 hover:to-primary/80 transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Save Configuration
                </button>
                <button
                  @click="testConnection"
                  :disabled="!isConfigValid || isTestingConnection"
                  class="px-4 py-2 bg-surface-elevated text-text-primary border border-border/60 rounded-lg hover:bg-surface-hover hover:border-border hover:shadow-sm transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                >
                  <Loader2 v-if="isTestingConnection" :size="16" class="animate-spin" />
                  <Zap v-else :size="16" />
                  {{ isTestingConnection ? 'Testing...' : 'Test Connection' }}
                </button>
              </div>

              <!-- Status Message -->
              <transition name="fade">
                <div
                  v-if="statusMessage" :class="[
                    'p-4 rounded-lg flex items-start gap-3',
                    statusMessage.type === 'success' 
                      ? 'bg-green-500/10 border border-green-500/20' 
                      : 'bg-red-500/10 border border-red-500/20'
                  ]"
                >
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
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
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
              <p class="text-muted-foreground mb-6">
                Quick actions to enhance your productivity
              </p>
            </div>

            <div class="space-y-3">
              <div
                v-for="shortcut in shortcuts"
                :key="shortcut.key"
                class="flex items-center justify-between p-4 bg-surface-elevated/80 border border-border/40 rounded-xl hover:bg-surface-hover/80 hover:border-border/60 hover:shadow-sm transition-all duration-200 transform hover:scale-[1.005]"
              >
                <span class="text-sm font-medium text-text-primary">{{ shortcut.description }}</span>
                <kbd class="px-3 py-1.5 text-xs font-mono bg-surface-elevated border border-border/60 rounded-lg shadow-sm text-text-secondary">
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
                Choose your preferred language for the interface. All settings and messages will be displayed in the selected language.
              </p>
            </div>

            <div class="space-y-6">
              <!-- Current Language Display -->
              <div class="bg-surface-elevated/80 border border-border/40 p-6 rounded-xl hover:bg-surface-hover/50 hover:border-border/60 hover:shadow-sm transition-all duration-200">
                <div class="flex items-center gap-4 mb-4">
                  <div class="p-2 bg-primary/10 rounded-lg">
                    <Globe :size="24" class="text-primary" />
                  </div>
                  <div>
                    <h4 class="font-semibold text-text-primary">Interface Language</h4>
                    <p class="text-sm text-text-secondary">Select your preferred language for the user interface</p>
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
                    Language changes apply immediately to the interface. 
                    AI model responses will still be in the language you communicate with the model.
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
                >
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
              <button class="mt-4 px-4 py-2 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-lg hover:from-primary/90 hover:to-primary/80 transition-all duration-200 transform hover:scale-105 hover:shadow-lg">
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
                    <div class="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary/80 transition-colors" />
                    <div class="absolute left-0.5 top-0.5 bg-background w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5" />
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
import { Bot, Palette, ArrowLeft, Keyboard, Puzzle, ChevronRight, ChevronDown, Check, AlertCircle, Eye, EyeOff, Menu, X, Server, Loader2, Zap, Globe } from 'lucide-vue-next'
import ProviderList from '@renderer/src/components/settings/ProviderList.vue'
import ProviderSelector from '@renderer/src/components/settings/ProviderSelector.vue'
import UnifiedProviderConfig from '@renderer/src/components/settings/UnifiedProviderConfig.vue'
import LanguageSelector from '@renderer/src/components/settings/LanguageSelector.vue'
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
const shortcuts = ref<Array<{ key: string, description: string }>>([])
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

const statusMessage = ref<{ type: 'success' | 'error', text: string } | null>(null)
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
          text: provider.status === 'connected' 
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
  return function(...args: any[]) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(null, args), wait)
  }
}

// Watch for configuration changes and auto-save
watch([() => llmConfig.provider, () => llmConfig.apiKey, () => llmConfig.baseURL, () => llmConfig.model], 
  debounce(async () => {
    if (llmConfig.provider) { // Only save if a provider is selected
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
      models: [{
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
      }],
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

