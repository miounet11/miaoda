<template>
  <div class="chatbox-settings-view flex flex-col h-screen" style="background: rgb(16, 16, 20)">
    <!-- Header with exact ChatBox styling -->
    <div
      class="chatbox-header flex items-center justify-between border-b"
      style="border-color: var(--mantine-color-chatbox-border-primary-outline)"
    >
      <div class="flex items-center gap-3">
        <button
          @click="goBack"
          class="chatbox-header-button"
          style="color: var(--mantine-color-chatbox-secondary-text)"
          @mouseover="
            $event.target.style.backgroundColor = 'var(--mantine-color-chatbox-brand-outline-hover)'
          "
          @mouseleave="$event.target.style.backgroundColor = 'transparent'"
        >
          <ChevronLeft :size="20" />
        </button>
        <h1 class="chatbox-header-title" style="color: var(--mantine-color-chatbox-primary-text)">
          设置
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <!-- Window controls -->
        <div class="flex gap-2 chatbox-window-controls">
          <div class="chatbox-window-control chatbox-window-control-close"></div>
          <div class="chatbox-window-control chatbox-window-control-minimize"></div>
          <div class="chatbox-window-control chatbox-window-control-maximize"></div>
        </div>
      </div>
    </div>

    <!-- Main content with exact layout -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar with exact styling -->
      <SettingsSidebar
        :active-section="activeSection"
        @section-change="handleSectionChange"
        class="chatbox-sidebar flex-shrink-0"
      />

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto" style="flex: 1 1 80%">
        <SettingsContent>
          <!-- General Settings Panel -->
          <GeneralSettingsPanel v-if="activeSection === 'general'" />

          <!-- Model Provider Settings Panel -->
          <ModelProviderPanel v-else-if="activeSection === 'models'" />

          <!-- Chat Settings Panel -->
          <ChatSettingsPanel v-else-if="activeSection === 'chat'" />

          <!-- Appearance Settings Panel -->
          <AppearancePanel v-else-if="activeSection === 'appearance'" />

          <!-- Web Search Settings Panel -->
          <WebSearchPanel v-else-if="activeSection === 'websearch'" />

          <!-- Keyboard Shortcuts Panel -->
          <KeyboardShortcutsPanel v-else-if="activeSection === 'shortcuts'" />

          <!-- Voice Settings Panel -->
          <VoiceSettingsPanel v-else-if="activeSection === 'voice'" />

          <!-- Privacy Settings Panel -->
          <PrivacyPanel v-else-if="activeSection === 'privacy'" />

          <!-- Plugins Settings Panel -->
          <PluginsPanel v-else-if="activeSection === 'plugins'" />

          <!-- Advanced Settings Panel -->
          <AdvancedPanel v-else-if="activeSection === 'advanced'" />

          <!-- About Panel -->
          <AboutPanel v-else-if="activeSection === 'about'" />

          <!-- Fallback for unknown sections -->
          <div
            v-else
            class="p-6 text-center"
            style="color: var(--mantine-color-chatbox-secondary-text)"
          >
            {{ `${activeSection} 设置面板开发中...` }}
          </div>
        </SettingsContent>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'

import SettingsSidebar from '@/components/settings/SettingsSidebar.vue'
import SettingsContent from '@/components/settings/SettingsContent.vue'
import GeneralSettingsPanel from '@/components/settings/GeneralSettingsPanel.vue'
import ModelProviderPanel from '@/components/settings/ModelProviderPanel.vue'
import ChatSettingsPanel from '@/components/settings/ChatSettingsPanel.vue'
import AppearancePanel from '@/components/settings/AppearancePanel.vue'
import WebSearchPanel from '@/components/settings/WebSearchPanel.vue'
import KeyboardShortcutsPanel from '@/components/settings/KeyboardShortcutsPanel.vue'
import VoiceSettingsPanel from '@/components/settings/VoiceSettingsPanel.vue'
import PrivacyPanel from '@/components/settings/PrivacyPanel.vue'
import PluginsPanel from '@/components/settings/PluginsPanel.vue'
import AdvancedPanel from '@/components/settings/AdvancedPanel.vue'
import AboutPanel from '@/components/settings/AboutPanel.vue'

const router = useRouter()
const activeSection = ref('general')

const goBack = () => {
  router.push('/')
}

const handleSectionChange = (section: string) => {
  activeSection.value = section
}
</script>

<style scoped>
/* ChatBox Settings View - Exact Styling */
.chatbox-settings-view {
  --header-height: 3rem; /* 48px */
  background: rgb(16, 16, 20);
  color: var(--mantine-color-chatbox-primary-text);
}

.chatbox-header {
  height: calc(3rem * var(--mantine-scale));
  background: rgb(16, 16, 20);
  border-bottom: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  padding: 0 var(--mantine-spacing-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chatbox-header-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(2.25rem * var(--mantine-scale));
  height: calc(2.25rem * var(--mantine-scale));
  padding: 0.5rem;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chatbox-header-title {
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.5;
  margin: 0;
}

.chatbox-window-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.chatbox-window-control {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chatbox-window-control-close {
  background: #ef4444;
}

.chatbox-window-control-minimize {
  background: #f59e0b;
}

.chatbox-window-control-maximize {
  background: #22c55e;
}

.chatbox-window-control:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.chatbox-sidebar {
  background: rgb(16, 16, 20);
  width: 16rem;
  border-right: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  padding: var(--mantine-spacing-xs);
}

/* Custom scrollbar matching ChatBox design */
.chatbox-settings-view ::-webkit-scrollbar {
  width: 6px;
}

.chatbox-settings-view ::-webkit-scrollbar-track {
  background: transparent;
}

.chatbox-settings-view ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.chatbox-settings-view ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Smooth transitions for all interactive elements */
.chatbox-settings-view button {
  transition: all 0.15s ease;
}

/* Focus styles for accessibility */
.chatbox-settings-view button:focus-visible {
  outline: 2px solid var(--mantine-color-chatbox-brand-filled);
  outline-offset: 2px;
}
</style>
