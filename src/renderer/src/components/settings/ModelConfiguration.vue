<template>
  <div class="model-configuration space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="font-medium text-lg">Models</h3>
      <button
        type="button"
        @click="addModel"
        class="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm"
      >
        <Plus :size="16" />
        <span>Add Model</span>
      </button>
    </div>

    <!-- Models List -->
    <div v-if="models.length > 0" class="space-y-3">
      <div
        v-for="(model, index) in models"
        :key="model.id || index"
        class="model-item bg-muted/30 rounded-lg border border-muted-foreground/10 transition-all hover:border-muted-foreground/20"
      >
        <!-- Model Header -->
        <div class="flex items-center justify-between p-4 pb-2">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <Bot :size="16" class="text-muted-foreground" />
              <h4 class="font-medium">{{ model.displayName || model.name || `Model ${index + 1}` }}</h4>
            </div>
            <div v-if="model.contextLength" class="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
              {{ formatContextLength(model.contextLength) }}
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <!-- Expand/Collapse -->
            <button
              type="button"
              @click="toggleModelExpanded(index)"
              class="p-1 hover:bg-accent/50 rounded transition-colors"
              :title="expandedModels.has(index) ? 'Collapse' : 'Expand'"
            >
              <ChevronDown 
                :size="16" 
                class="transition-transform"
                :class="{ 'rotate-180': expandedModels.has(index) }"
              />
            </button>
            
            <!-- Delete -->
            <button
              type="button"
              @click="removeModel(index)"
              class="p-1 hover:bg-red-500/10 text-red-600 rounded transition-colors"
              title="Remove model"
            >
              <Trash2 :size="16" />
            </button>
          </div>
        </div>

        <!-- Model Details (Expandable) -->
        <div v-if="expandedModels.has(index)" class="px-4 pb-4 space-y-4">
          <!-- Basic Info -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">
                Model ID <span class="text-red-500">*</span>
              </label>
              <input
                v-model="model.id"
                type="text"
                placeholder="gpt-4, claude-3-sonnet, etc."
                class="w-full px-3 py-2 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                required
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">Display Name</label>
              <input
                v-model="model.displayName"
                type="text"
                placeholder="e.g., GPT-4 Turbo"
                class="w-full px-3 py-2 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              >
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium mb-1">Description</label>
            <textarea
              v-model="model.description"
              rows="2"
              placeholder="Brief description of the model's capabilities"
              class="w-full px-3 py-2 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-none"
            />
          </div>

          <!-- Context Length and Max Tokens -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">
                Context Length <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  v-model.number="model.contextLength"
                  type="number"
                  min="1000"
                  max="2000000"
                  step="1000"
                  placeholder="8192"
                  class="w-full px-3 py-2 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  required
                >
                <div class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  tokens
                </div>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">Max Output Tokens</label>
              <div class="relative">
                <input
                  v-model.number="model.maxTokens"
                  type="number"
                  min="1"
                  max="100000"
                  step="100"
                  placeholder="4096"
                  class="w-full px-3 py-2 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                >
                <div class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  tokens
                </div>
              </div>
            </div>
          </div>

          <!-- Pricing (Optional) -->
          <details class="group">
            <summary class="cursor-pointer list-none flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight :size="14" class="transition-transform group-open:rotate-90" />
              <span>Pricing Information (Optional)</span>
            </summary>
            
            <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Input Cost (per 1K tokens)</label>
                <div class="relative">
                  <input
                    v-model.number="model.inputCostPer1k"
                    type="number"
                    min="0"
                    step="0.0001"
                    placeholder="0.0100"
                    class="w-full px-3 py-2 pl-6 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  >
                  <div class="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    $
                  </div>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-1">Output Cost (per 1K tokens)</label>
                <div class="relative">
                  <input
                    v-model.number="model.outputCostPer1k"
                    type="number"
                    min="0"
                    step="0.0001"
                    placeholder="0.0300"
                    class="w-full px-3 py-2 pl-6 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  >
                  <div class="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    $
                  </div>
                </div>
              </div>
            </div>
          </details>

          <!-- Model Capabilities -->
          <div class="space-y-3">
            <h5 class="text-sm font-medium">Model Capabilities</h5>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <label
                v-for="(capability, key) in modelCapabilities"
                :key="key"
                class="flex items-center gap-2 p-2 bg-background rounded-lg cursor-pointer hover:bg-accent/30 transition-colors text-sm"
              >
                <input
                  v-model="model.capabilities[key]"
                  type="checkbox"
                  class="w-4 h-4 text-primary bg-background border-muted rounded focus:ring-primary/20"
                >
                <span class="truncate">{{ capability.label }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Collapsed Summary -->
        <div v-else class="px-4 pb-3">
          <div class="flex items-center gap-4 text-sm text-muted-foreground">
            <span v-if="model.id">ID: {{ model.id }}</span>
            <span v-if="model.contextLength">{{ formatContextLength(model.contextLength) }} context</span>
            <span>{{ Object.values(model.capabilities || {}).filter(Boolean).length }} capabilities</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8 bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20">
      <Bot :size="32" class="mx-auto mb-3 text-muted-foreground" />
      <p class="text-muted-foreground mb-3">No models configured</p>
      <button
        type="button"
        @click="addModel"
        class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
      >
        Add Your First Model
      </button>
    </div>

    <!-- Quick Templates -->
    <div v-if="providerType && providerTemplates[providerType]" class="pt-4 border-t border-muted-foreground/10">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-medium text-muted-foreground">Quick Templates</h4>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="template in providerTemplates[providerType]"
          :key="template.id"
          type="button"
          @click="addModelFromTemplate(template)"
          class="flex items-center gap-2 px-3 py-1.5 bg-muted/50 hover:bg-muted/70 rounded-lg transition-colors text-xs"
        >
          <Plus :size="12" />
          <span>{{ template.displayName }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, Bot, ChevronDown, ChevronRight, Trash2 } from 'lucide-vue-next'
import type { LLMModel, ModelCapabilities } from '@renderer/src/types/api'

interface Props {
  modelValue: LLMModel[]
  providerType?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  providerType: 'custom'
})

const emit = defineEmits<{
  'update:modelValue': [models: LLMModel[]]
}>()

// State
const models = ref<LLMModel[]>([...props.modelValue])
const expandedModels = ref<Set<number>>(new Set([0])) // First model expanded by default

// Model capability definitions
const modelCapabilities = {
  chat: { label: 'Chat Completion' },
  streaming: { label: 'Streaming' },
  toolCalling: { label: 'Function Calling' },
  imageInput: { label: 'Image Input' },
  imageOutput: { label: 'Image Generation' },
  audioInput: { label: 'Audio Input' },
  audioOutput: { label: 'Audio Output' },
  videoInput: { label: 'Video Input' },
  systemMessages: { label: 'System Messages' },
  temperature: { label: 'Temperature Control' },
  topP: { label: 'Top-P Sampling' },
  topK: { label: 'Top-K Sampling' },
  presencePenalty: { label: 'Presence Penalty' },
  frequencyPenalty: { label: 'Frequency Penalty' }
}

// Quick templates for different provider types
const providerTemplates = {
  openai: [
    {
      id: 'gpt-4-turbo',
      name: 'gpt-4-turbo',
      displayName: 'GPT-4 Turbo',
      contextLength: 128000,
      maxTokens: 4096,
      inputCostPer1k: 0.01,
      outputCostPer1k: 0.03,
      capabilities: {
        chat: true,
        streaming: true,
        toolCalling: true,
        imageInput: true,
        systemMessages: true,
        temperature: true,
        topP: true,
        presencePenalty: true,
        frequencyPenalty: true
      }
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'gpt-3.5-turbo',
      displayName: 'GPT-3.5 Turbo',
      contextLength: 16385,
      maxTokens: 4096,
      inputCostPer1k: 0.0015,
      outputCostPer1k: 0.002,
      capabilities: {
        chat: true,
        streaming: true,
        toolCalling: true,
        systemMessages: true,
        temperature: true,
        topP: true,
        presencePenalty: true,
        frequencyPenalty: true
      }
    }
  ],
  anthropic: [
    {
      id: 'claude-3-sonnet-20240229',
      name: 'claude-3-sonnet-20240229',
      displayName: 'Claude 3 Sonnet',
      contextLength: 200000,
      maxTokens: 4096,
      capabilities: {
        chat: true,
        streaming: true,
        toolCalling: true,
        imageInput: true,
        systemMessages: true,
        temperature: true,
        topP: true,
        topK: true
      }
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'claude-3-opus-20240229',
      displayName: 'Claude 3 Opus',
      contextLength: 200000,
      maxTokens: 4096,
      capabilities: {
        chat: true,
        streaming: true,
        toolCalling: true,
        imageInput: true,
        systemMessages: true,
        temperature: true,
        topP: true,
        topK: true
      }
    }
  ]
}

// Methods
const addModel = () => {
  const newModel: LLMModel = {
    id: '',
    name: '',
    displayName: '',
    contextLength: 8192,
    capabilities: {
      chat: true,
      streaming: true,
      toolCalling: false,
      imageInput: false,
      imageOutput: false,
      audioInput: false,
      audioOutput: false,
      videoInput: false,
      systemMessages: true,
      temperature: true,
      topP: true,
      topK: false,
      presencePenalty: false,
      frequencyPenalty: false
    } as ModelCapabilities
  }
  
  models.value.push(newModel)
  expandedModels.value.add(models.value.length - 1)
}

const removeModel = (index: number) => {
  models.value.splice(index, 1)
  expandedModels.value.delete(index)
  
  // Adjust expanded indices
  const newExpanded = new Set<number>()
  expandedModels.value.forEach(i => {
    if (i < index) {
      newExpanded.add(i)
    } else if (i > index) {
      newExpanded.add(i - 1)
    }
  })
  expandedModels.value = newExpanded
}

const toggleModelExpanded = (index: number) => {
  if (expandedModels.value.has(index)) {
    expandedModels.value.delete(index)
  } else {
    expandedModels.value.add(index)
  }
}

const addModelFromTemplate = (template: any) => {
  const newModel: LLMModel = {
    ...template,
    capabilities: { ...template.capabilities }
  }
  
  models.value.push(newModel)
  expandedModels.value.add(models.value.length - 1)
}

const formatContextLength = (length: number): string => {
  if (length >= 1000000) {
    return `${(length / 1000000).toFixed(1)}M`
  } else if (length >= 1000) {
    return `${(length / 1000).toFixed(0)}K`
  }
  return length.toString()
}

// Watch for changes and emit
watch(() => models.value, (newModels) => {
  emit('update:modelValue', newModels)
}, { deep: true })

// Watch for prop changes
watch(() => props.modelValue, (newValue) => {
  models.value = [...newValue]
  
  // Expand first model if none are expanded and models exist
  if (models.value.length > 0 && expandedModels.value.size === 0) {
    expandedModels.value.add(0)
  }
}, { deep: true })
</script>

<style scoped>
.model-item {
  transition: all 0.2s ease;
}

.model-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.1);
}

/* Form input focus states */
input:focus, textarea:focus {
  outline: none;
}

/* Custom checkbox styling */
input[type="checkbox"]:checked {
  background-color: rgb(var(--primary-rgb));
  border-color: rgb(var(--primary-rgb));
}

/* Details/summary styling */
details[open] summary {
  margin-bottom: 0.75rem;
}

/* Smooth transitions for expand/collapse */
.model-item > div {
  transition: all 0.2s ease;
}

/* Responsive grid adjustments */
@media (max-width: 640px) {
  .grid.sm\\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
  
  .grid.sm\\:grid-cols-3 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .flex.gap-2 {
    flex-wrap: wrap;
  }
}

/* Focus improvements for accessibility */
button:focus-visible,
input:focus-visible,
textarea:focus-visible {
  outline: 2px solid rgba(var(--primary-rgb), 0.6);
  outline-offset: 2px;
}

/* Improved visual hierarchy */
.model-item h4 {
  font-weight: 600;
}

.model-item h5 {
  color: rgb(var(--foreground-rgb));
  font-weight: 500;
}

/* Animation for adding/removing models */
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.model-item {
  animation: slide-in 0.3s ease-out;
}

/* Template buttons styling */
.flex.flex-wrap button {
  transition: all 0.2s ease;
}

.flex.flex-wrap button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(var(--primary-rgb), 0.15);
}
</style>