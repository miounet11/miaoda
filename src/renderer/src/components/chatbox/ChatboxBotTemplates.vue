<template>
  <div class="bot-templates-container">
    <div class="templates-grid">
      <div 
        v-for="template in visibleTemplates"
        :key="template.id"
        class="template-item"
        @click="createChatFromTemplate(template)"
      >
        <div class="template-icon">{{ template.icon }}</div>
        <div class="template-info">
          <div class="template-name">{{ template.name }}</div>
          <div class="template-category">{{ getCategoryLabel(template.category) }}</div>
        </div>
        <button 
          v-if="template.category === 'custom'"
          class="template-action"
          @click.stop="deleteTemplate(template.id)"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M10 4L4 10M4 4l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      
      <!-- Add Custom Template Button -->
      <div 
        class="template-item add-template"
        @click="showAddTemplateDialog"
      >
        <div class="template-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="template-info">
          <div class="template-name">Create Custom</div>
        </div>
      </div>
    </div>
    
    <!-- Show More/Less Button -->
    <button 
      v-if="templates.length > 6"
      class="toggle-button"
      @click="showAll = !showAll"
    >
      <span>{{ showAll ? 'Show Less' : 'Show More' }}</span>
      <svg 
        width="12" 
        height="12" 
        viewBox="0 0 12 12" 
        fill="none"
        :style="{ transform: showAll ? 'rotate(180deg)' : 'none' }"
      >
        <path d="M3 5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBotTemplatesStore } from '../../stores/botTemplates'
import { useChatStore } from '../../stores/chat'
import { useChatboxUIStore } from '../../stores/chatboxUI'

const botTemplatesStore = useBotTemplatesStore()
const chatStore = useChatStore()
const chatboxUIStore = useChatboxUIStore()

const showAll = ref(false)
const templates = computed(() => botTemplatesStore.getAllTemplates())

const visibleTemplates = computed(() => {
  if (showAll.value) {
    return templates.value
  }
  return templates.value.slice(0, 6)
})

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    'example': 'Example',
    'official': 'Official',
    'custom': 'Custom'
  }
  return labels[category] || category
}

const createChatFromTemplate = async (template: any) => {
  // Create new chat with template
  const newChat = await chatStore.createChat({
    title: template.name,
    systemPrompt: template.systemPrompt,
    model: chatStore.currentModel || 'gpt-3.5-turbo',
    provider: chatStore.currentProvider || 'openai',
    metadata: {
      templateId: template.id,
      icon: template.icon
    }
  })
  
  // Set as current chat
  chatStore.setCurrentChat(newChat.id)
  chatboxUIStore.setCurrentSession(newChat.id)
  chatboxUIStore.setSelectedTemplate(template)
}

const deleteTemplate = (templateId: string) => {
  if (confirm('Delete this custom template?')) {
    botTemplatesStore.removeCustomTemplate(templateId)
  }
}

const showAddTemplateDialog = () => {
  // TODO: Show dialog to create custom template
  const name = prompt('Template name:')
  const icon = prompt('Template icon (emoji):') || '🤖'
  const description = prompt('Template description:')
  const systemPrompt = prompt('System prompt:')
  
  if (name && systemPrompt) {
    botTemplatesStore.addCustomTemplate({
      name,
      icon,
      description: description || '',
      systemPrompt
    })
  }
}
</script>

<style scoped>
.bot-templates-container {
  padding: 12px;
  border-top: 1px solid var(--chatbox-border);
}

.templates-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
}

.template-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--chatbox-radius-md);
  cursor: pointer;
  transition: all var(--chatbox-transition-fast);
  position: relative;
}

.template-item:hover {
  background-color: var(--chatbox-bg-hover);
}

.template-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background-color: var(--chatbox-bg-secondary);
  border-radius: var(--chatbox-radius-md);
}

.add-template .template-icon {
  background-color: transparent;
  border: 1px dashed var(--chatbox-border);
  color: var(--chatbox-text-secondary);
}

.template-info {
  flex: 1;
  min-width: 0;
}

.template-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--chatbox-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.template-category {
  font-size: 11px;
  color: var(--chatbox-text-tertiary);
  margin-top: 1px;
}

.template-action {
  position: absolute;
  right: 8px;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--chatbox-text-secondary);
  cursor: pointer;
  border-radius: var(--chatbox-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all var(--chatbox-transition-fast);
}

.template-item:hover .template-action {
  opacity: 1;
}

.template-action:hover {
  background-color: var(--chatbox-bg-hover);
  color: var(--chatbox-error);
}

.toggle-button {
  width: 100%;
  padding: 8px;
  margin-top: 8px;
  border: none;
  background: transparent;
  color: var(--chatbox-text-secondary);
  font-size: 12px;
  cursor: pointer;
  border-radius: var(--chatbox-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all var(--chatbox-transition-fast);
}

.toggle-button:hover {
  background-color: var(--chatbox-bg-hover);
}

.toggle-button svg {
  transition: transform var(--chatbox-transition-fast);
}
</style>