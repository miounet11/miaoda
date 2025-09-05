<template>
  <div class="chatbox-chat-settings-panel">
    <h1
      style="
        color: var(--mantine-color-chatbox-primary-text);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
      "
    >
      聊天设置
    </h1>

    <div class="settings-group">
      <!-- Message Behavior -->
      <div class="settings-section">
        <h2>消息行为</h2>

        <div class="chatbox-settings-grid">
          <!-- Enter to Send -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="settingsStore.enterToSend"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 按 Enter 键发送消息 </span>
                <p class="chatbox-description mt-1">
                  启用后，按 Enter 键直接发送消息。按 Shift+Enter 换行。
                </p>
              </div>
            </label>
          </div>

          <!-- Auto Scroll -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="settingsStore.autoScroll"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 自动滚动到最新消息 </span>
                <p class="chatbox-description mt-1">收到新消息时自动滚动到聊天底部</p>
              </div>
            </label>
          </div>

          <!-- Spell Check -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="settingsStore.spellCheck"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 启用拼写检查 </span>
                <p class="chatbox-description mt-1">在输入框中显示拼写错误的单词</p>
              </div>
            </label>
          </div>

          <!-- Show Word Count -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="settingsStore.showWordCount"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 显示字数统计 </span>
                <p class="chatbox-description mt-1">在输入框中显示当前消息的字符数</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Message Display -->
      <div class="settings-section">
        <h2>消息显示</h2>

        <div class="chatbox-settings-grid">
          <!-- Show Timestamps -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="settingsStore.showTimestamps"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 显示消息时间戳 </span>
                <p class="chatbox-description mt-1">在每条消息下方显示发送时间</p>
              </div>
            </label>
          </div>

          <!-- Show Avatars -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="settingsStore.showAvatars"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 显示头像 </span>
                <p class="chatbox-description mt-1">在消息旁边显示用户和AI的头像</p>
              </div>
            </label>
          </div>

          <!-- Compact Mode -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="settingsStore.compactMode"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 紧凑模式 </span>
                <p class="chatbox-description mt-1">减少消息间距，显示更多消息</p>
              </div>
            </label>
          </div>

          <!-- Message Spacing -->
          <div class="chatbox-settings-item">
            <label for="message-spacing" class="chatbox-label">消息间距</label>
            <div class="chatbox-range-wrapper">
              <span class="chatbox-range-label">紧凑</span>
              <input
                id="message-spacing"
                v-model.number="settingsStore.messageSpacing"
                type="range"
                min="8"
                max="32"
                step="2"
                class="chatbox-range-slider"
              />
              <span class="chatbox-range-label">宽松</span>
              <span class="chatbox-range-value">{{ settingsStore.messageSpacing }}px</span>
            </div>
            <p class="chatbox-description">调整消息之间的垂直间距</p>
          </div>
        </div>
      </div>

      <!-- Auto Save -->
      <div class="settings-section">
        <h2>自动保存</h2>

        <div class="chatbox-settings-grid">
          <!-- Enable Auto Save -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input v-model="settingsStore.autoSave" type="checkbox" class="chatbox-checkbox" />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 启用自动保存 </span>
                <p class="chatbox-description mt-1">自动保存聊天记录和草稿</p>
              </div>
            </label>
          </div>

          <!-- Auto Save Interval -->
          <div v-if="settingsStore.autoSave" class="chatbox-settings-item">
            <label for="autosave-interval" class="chatbox-label">保存间隔</label>
            <div class="chatbox-select-wrapper">
              <select
                id="autosave-interval"
                v-model="settingsStore.autoSaveInterval"
                class="chatbox-select"
              >
                <option :value="10">10秒</option>
                <option :value="30">30秒</option>
                <option :value="60">1分钟</option>
                <option :value="120">2分钟</option>
                <option :value="300">5分钟</option>
              </select>
              <svg
                class="chatbox-select-chevron"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </div>
            <p class="chatbox-description">自动保存的时间间隔</p>
          </div>
        </div>
      </div>

      <!-- Message Actions -->
      <div class="settings-section">
        <h2>消息操作</h2>

        <div class="chatbox-settings-grid">
          <!-- Copy Button -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="messageActions.showCopyButton"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 显示复制按钮 </span>
                <p class="chatbox-description mt-1">在消息上显示快捷复制按钮</p>
              </div>
            </label>
          </div>

          <!-- Edit Button -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="messageActions.showEditButton"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 显示编辑按钮 </span>
                <p class="chatbox-description mt-1">允许编辑已发送的用户消息</p>
              </div>
            </label>
          </div>

          <!-- Delete Button -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="messageActions.showDeleteButton"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 显示删除按钮 </span>
                <p class="chatbox-description mt-1">允许删除单条消息</p>
              </div>
            </label>
          </div>

          <!-- Regenerate Button -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="messageActions.showRegenerateButton"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 显示重新生成按钮 </span>
                <p class="chatbox-description mt-1">允许重新生成AI回答</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Markdown and Code -->
      <div class="settings-section">
        <h2>Markdown 和代码</h2>

        <div class="chatbox-settings-grid">
          <!-- Enable Markdown -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="markdownSettings.enabled"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 启用 Markdown 渲染 </span>
                <p class="chatbox-description mt-1">将消息中的 Markdown 格式转换为富文本显示</p>
              </div>
            </label>
          </div>

          <!-- Code Syntax Highlighting -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="markdownSettings.syntaxHighlighting"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 启用代码语法高亮 </span>
                <p class="chatbox-description mt-1">为代码块提供语法高亮显示</p>
              </div>
            </label>
          </div>

          <!-- Code Copy Button -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="markdownSettings.showCodeCopyButton"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 显示代码复制按钮 </span>
                <p class="chatbox-description mt-1">在代码块上显示一键复制按钮</p>
              </div>
            </label>
          </div>

          <!-- Line Numbers -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="markdownSettings.showLineNumbers"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 显示行号 </span>
                <p class="chatbox-description mt-1">在代码块中显示行号</p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

// Local settings for extended features
const messageActions = ref({
  showCopyButton: true,
  showEditButton: true,
  showDeleteButton: true,
  showRegenerateButton: true
})

const markdownSettings = ref({
  enabled: true,
  syntaxHighlighting: true,
  showCodeCopyButton: true,
  showLineNumbers: true
})

// Watch for changes and save to localStorage
watch(
  [messageActions, markdownSettings],
  () => {
    localStorage.setItem(
      'chatSettings',
      JSON.stringify({
        messageActions: messageActions.value,
        markdownSettings: markdownSettings.value
      })
    )
  },
  { deep: true }
)

// Load saved settings
const loadChatSettings = () => {
  const saved = localStorage.getItem('chatSettings')
  if (saved) {
    try {
      const settings = JSON.parse(saved)
      if (settings.messageActions) {
        messageActions.value = { ...messageActions.value, ...settings.messageActions }
      }
      if (settings.markdownSettings) {
        markdownSettings.value = { ...markdownSettings.value, ...settings.markdownSettings }
      }
    } catch (error) {
      console.error('Error loading chat settings:', error)
    }
  }
}

// Initialize
loadChatSettings()
</script>

<style scoped>
@import './chatbox-base.css';

.chatbox-chat-settings-panel {
  padding: var(--mantine-spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--mantine-spacing-xl);
}

.chatbox-settings-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

/* Responsive design */
@media (min-width: 1024px) {
  .chatbox-settings-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
