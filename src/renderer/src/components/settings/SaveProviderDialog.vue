<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop -->
        <div 
          class="fixed inset-0 bg-black/50 backdrop-blur-sm"
          @click="handleCancel"
        />
        
        <!-- Dialog -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div 
            class="relative bg-background rounded-lg shadow-xl w-full max-w-md transform transition-all"
            @click.stop
          >
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b">
              <div>
                <h3 class="text-lg font-semibold">Save Configuration</h3>
                <p class="text-sm text-muted-foreground mt-1">
                  Save your current settings as a reusable configuration
                </p>
              </div>
              <button
                @click="handleCancel"
                class="p-2 hover:bg-accent/50 rounded-lg transition-colors"
              >
                <X :size="18" />
              </button>
            </div>
            
            <!-- Body -->
            <div class="p-6 space-y-4">
              <!-- Provider Name -->
              <div>
                <label class="block text-sm font-medium mb-2">
                  Configuration Name
                  <span class="text-red-500 ml-1">*</span>
                </label>
                <input
                  v-model="formData.name"
                  type="text"
                  placeholder="e.g., My OpenAI Config"
                  class="w-full px-3 py-2 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autofocus
                  @keyup.enter="handleSave"
                >
              </div>
              
              <!-- Description -->
              <div>
                <label class="block text-sm font-medium mb-2">
                  Description
                  <span class="text-xs text-muted-foreground ml-1">(optional)</span>
                </label>
                <textarea
                  v-model="formData.description"
                  placeholder="Brief description of this configuration"
                  rows="2"
                  class="w-full px-3 py-2 bg-muted/50 border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
              
              <!-- Icon Selection -->
              <div>
                <label class="block text-sm font-medium mb-2">
                  Icon
                </label>
                <div class="grid grid-cols-8 gap-2">
                  <button
                    v-for="icon in availableIcons"
                    :key="icon"
                    @click="formData.icon = icon"
                    :class="[
                      'p-2 rounded-lg border-2 transition-all text-xl',
                      formData.icon === icon
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-muted-foreground/50 hover:bg-muted/50'
                    ]"
                  >
                    {{ icon }}
                  </button>
                </div>
              </div>
              
              <!-- Configuration Summary -->
              <div class="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
                <div class="font-medium text-muted-foreground mb-2">Configuration Summary:</div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Provider:</span>
                  <span class="font-mono">{{ config.provider }}</span>
                </div>
                <div v-if="config.baseURL" class="flex justify-between">
                  <span class="text-muted-foreground">Base URL:</span>
                  <span class="font-mono text-xs truncate max-w-[200px]">{{ config.baseURL }}</span>
                </div>
                <div v-if="config.model" class="flex justify-between">
                  <span class="text-muted-foreground">Model:</span>
                  <span class="font-mono">{{ config.model }}</span>
                </div>
              </div>
              
              <!-- Save Options -->
              <div class="space-y-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="formData.setAsActive"
                    type="checkbox"
                    class="w-4 h-4 text-primary bg-background border-muted rounded focus:ring-primary/20"
                  >
                  <span class="text-sm">Set as active configuration after saving</span>
                </label>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="flex gap-3 p-6 border-t">
              <button
                @click="handleCancel"
                class="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                @click="handleSave"
                :disabled="!formData.name"
                class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { X } from 'lucide-vue-next'
import type { LLMProvider } from '../../types/api'

interface Props {
  isOpen: boolean
  config: {
    provider: string
    apiKey: string
    baseURL: string
    model: string
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [data: {
    name: string
    description: string
    icon: string
    setAsActive: boolean
  }]
}>()

const availableIcons = [
  '🤖', '🧠', '⚡', '🚀', '💡', '🔧', '⚙️', '🎯',
  '🌟', '✨', '🔮', '🎨', '🔬', '🔭', '🎪', '🎭'
]

const formData = reactive({
  name: '',
  description: '',
  icon: '🔧',
  setAsActive: true
})

const handleCancel = () => {
  emit('close')
}

const handleSave = () => {
  if (!formData.name) return
  
  emit('save', {
    name: formData.name,
    description: formData.description,
    icon: formData.icon,
    setAsActive: formData.setAsActive
  })
  
  // Reset form
  formData.name = ''
  formData.description = ''
  formData.icon = '🔧'
  formData.setAsActive = true
}

// Reset form when dialog opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    formData.name = ''
    formData.description = ''
    formData.icon = '🔧'
    formData.setAsActive = true
  }
})
</script>

<style scoped>
/* Modal transition */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative {
  transform: scale(0.95) translateY(-10px);
}

.modal-leave-to .relative {
  transform: scale(0.95) translateY(10px);
}
</style>