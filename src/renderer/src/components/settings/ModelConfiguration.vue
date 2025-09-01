<template>
  <div class="model-configuration space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="font-medium text-lg">Models</h3>
      <button
        type="button"
        @click="addModel"
        class="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm"
       aria-label="按钮">
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
              <h4 class="font-medium">
                {{ model.displayName || model.name || `Model ${index + 1}` }}
              </h4>
            </div>
            <div
              v-if="model.contextLength"
              class="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded"
            >
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
             aria-label="按钮">
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
             aria-label="按钮">
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
              <input id="input-yxhpdwpyc"
                v-model="model.id"
                type="text"
                placeholder="gpt-4, claude-3-sonnet, etc."
                class="w-full px-3 py-2 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                required
               aria-label="输入框">
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Display Name</label>
              <input id="input-phjilo236"
                v-model="model.displayName"
                type="text"
                placeholder="e.g., GPT-4 Turbo"
                class="w-full px-3 py-2 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
               aria-label="输入框">
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
                <input id="input-ju96spfu0"
                  v-model.number="model.contextLength"
                  type="number"
                  min="1000"
                  max="2000000"
                  step="1000"
                  placeholder="8192"
                  class="w-full px-3 py-2 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  required
                 aria-label="输入框">
                <div
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
                >
                  tokens
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Max Output Tokens</label>
              <div class="relative">
                <input id="input-cn8kidy44"
                  v-model.number="model.maxTokens"
                  type="number"
                  min="1"
                  max="100000"
                  step="100"
                  placeholder="4096"
                  class="w-full px-3 py-2 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                 aria-label="输入框">
                <div
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
                >
                  tokens
                </div>
              </div>
            </div>
          </div>

          <!-- Pricing (Optional) -->
          <details class="group">
            <summary
              class="cursor-pointer list-none flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight :size="14" class="transition-transform group-open:rotate-90" />
              <span>Pricing Information (Optional)</span>
            </summary>

            <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Input Cost (per 1K tokens)</label>
                <div class="relative">
                  <input id="input-rc92br1wb"
                    v-model.number="model.inputCostPer1k"
                    type="number"
                    min="0"
                    step="0.0001"
                    placeholder="0.0100"
                    class="w-full px-3 py-2 pl-6 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                   aria-label="输入框">
                  <div
                    class="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
                  >
                    $
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Output Cost (per 1K tokens)</label>
                <div class="relative">
                  <input id="input-c4hre8jh3"
                    v-model.number="model.outputCostPer1k"
                    type="number"
                    min="0"
                    step="0.0001"
                    placeholder="0.0300"
                    class="w-full px-3 py-2 pl-6 bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                   aria-label="输入框">
                  <div
                    class="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
                  >
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
                <input id="input-13vcsnjge"
                  v-model="model.capabilities[key]"
                  type="checkbox"
                  class="w-4 h-4 text-primary bg-background border-muted rounded focus:ring-primary/20"
                 aria-label="输入框">
                <span class="truncate">{{ capability.label }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Collapsed Summary -->
        <div v-else class="px-4 pb-3">
          <div class="flex items-center gap-4 text-sm text-muted-foreground">
            <span v-if="model.id">ID: {{ model.id }}</span>
            <span v-if="model.contextLength"
              >{{ formatContextLength(model.contextLength) }} context</span
            >
            <span
              >{{
                Object.values(model.capabilities || {}).filter(Boolean).length
              }}
              capabilities</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="text-center py-8 bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20"
    >
      <Bot :size="32" class="mx-auto mb-3 text-muted-foreground" />
      <p class="text-muted-foreground mb-3">No models configured</p>
      <button
        type="button"
        @click="addModel"
        class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
       aria-label="按钮">
        Add Your First Model
      </button>
    </div>

    <!-- Quick Templates -->
    <div
      v-if="providerType && providerTemplates[providerType]"
      class="pt-4 border-t border-muted-foreground/10"
    >
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
         aria-label="按钮">
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
watch(
  () => models.value,
  newModels => {
    emit('update:modelValue', newModels)
  },
  { deep: true }
)

// Watch for prop changes
watch(
  () => props.modelValue,
  newValue => {
    models.value = [...newValue]

    // Expand first model if none are expanded and models exist
    if (models.value.length > 0 && expandedModels.value.size === 0) {
      expandedModels.value.add(0)
    }
  },
  { deep: true }
)
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
.model-item {
  transition: all 0.2s ease;
}

.model-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.1);
}

/* Form input focus states */
input:focus,
textarea:focus {
  outline: none;
}

/* Custom checkbox styling */
input[type='checkbox']:checked {
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
