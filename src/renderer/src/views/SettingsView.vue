<template>
  <div class="settings-view flex h-full">
    <!-- Settings Sidebar -->
    <aside class="w-64 bg-secondary/50 border-r p-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">Settings</h2>
        <button
          @click="$router.push('/')"
          class="p-1.5 hover:bg-accent/50 rounded-lg transition-colors"
          title="Back to chat"
        >
          <ArrowLeft :size="18" />
        </button>
      </div>
      <nav class="space-y-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2',
            activeTab === tab.id 
              ? 'bg-accent text-accent-foreground' 
              : 'hover:bg-accent/50'
          ]"
        >
          <component :is="tab.icon" :size="18" />
          {{ tab.label }}
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
            <label class="block">
              <span class="text-sm font-medium mb-2 block">Provider</span>
              <select 
                v-model="llmConfig.provider"
                class="w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="ollama">Ollama (Local)</option>
              </select>
            </label>

            <!-- API Key (for cloud providers) -->
            <div v-if="llmConfig.provider !== 'ollama'" class="space-y-2">
              <label class="block">
                <span class="text-sm font-medium mb-2 block">API Key</span>
                <input
                  v-model="llmConfig.apiKey"
                  type="password"
                  placeholder="sk-..."
                  class="w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
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
            <div v-if="statusMessage" :class="[
              'p-3 rounded-lg text-sm',
              statusMessage.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
            ]">
              {{ statusMessage.text }}
            </div>
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
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Bot, Palette, ArrowLeft } from 'lucide-vue-next'

const tabs = [
  { id: 'llm', label: 'LLM Provider', icon: Bot },
  { id: 'appearance', label: 'Appearance', icon: Palette }
]

const activeTab = ref('llm')
const theme = ref('system')

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

// Load existing config on mount
onMounted(async () => {
  const config = await window.api.llm.getConfig()
  if (config) {
    llmConfig.provider = config.provider
    llmConfig.apiKey = config.apiKey || ''
    llmConfig.baseURL = config.baseURL || ''
    llmConfig.model = config.model || ''
  }
})
</script>