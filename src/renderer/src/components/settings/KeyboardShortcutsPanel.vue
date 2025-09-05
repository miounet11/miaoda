<template>
  <div class="chatbox-keyboard-shortcuts-panel">
    <h1
      style="
        color: var(--mantine-color-chatbox-primary-text);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
      "
    >
      键盘快捷键
    </h1>

    <div class="settings-group">
      <!-- Global Shortcuts -->
      <div class="settings-section">
        <h2>全局快捷键</h2>

        <div class="shortcuts-list">
          <div v-for="(shortcut, key) in globalShortcuts" :key="key" class="shortcut-item">
            <div class="shortcut-info">
              <div class="shortcut-name">{{ shortcut.name }}</div>
              <div class="shortcut-description">{{ shortcut.description }}</div>
            </div>
            <div class="shortcut-input-wrapper">
              <input
                :value="
                  displayShortcut(
                    settingsStore.keyboardShortcuts[
                      key as keyof typeof settingsStore.keyboardShortcuts
                    ]
                  )
                "
                @click="startRecording(key)"
                @keydown="recordShortcut($event, key)"
                class="shortcut-input"
                :class="{ recording: recordingKey === key }"
                :placeholder="recordingKey === key ? '按下快捷键...' : '点击设置'"
                readonly
              />
              <button
                v-if="
                  settingsStore.keyboardShortcuts[
                    key as keyof typeof settingsStore.keyboardShortcuts
                  ] !== shortcut.default
                "
                @click="resetShortcut(key)"
                class="shortcut-reset"
                title="重置为默认"
              >
                <RotateCcw :size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Shortcuts -->
      <div class="settings-section">
        <h2>聊天快捷键</h2>

        <div class="shortcuts-list">
          <div v-for="(shortcut, key) in chatShortcuts" :key="key" class="shortcut-item">
            <div class="shortcut-info">
              <div class="shortcut-name">{{ shortcut.name }}</div>
              <div class="shortcut-description">{{ shortcut.description }}</div>
            </div>
            <div class="shortcut-input-wrapper">
              <input
                :value="
                  displayShortcut(
                    settingsStore.keyboardShortcuts[
                      key as keyof typeof settingsStore.keyboardShortcuts
                    ]
                  )
                "
                @click="startRecording(key)"
                @keydown="recordShortcut($event, key)"
                class="shortcut-input"
                :class="{ recording: recordingKey === key }"
                :placeholder="recordingKey === key ? '按下快捷键...' : '点击设置'"
                readonly
              />
              <button
                v-if="
                  settingsStore.keyboardShortcuts[
                    key as keyof typeof settingsStore.keyboardShortcuts
                  ] !== shortcut.default
                "
                @click="resetShortcut(key)"
                class="shortcut-reset"
                title="重置为默认"
              >
                <RotateCcw :size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Shortcut Settings -->
      <div class="settings-section">
        <h2>快捷键设置</h2>

        <div class="chatbox-settings-grid">
          <!-- Enable Shortcuts -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="shortcutSettings.enabled"
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
                <span class="chatbox-checkbox-label cursor-pointer"> 启用键盘快捷键 </span>
                <p class="chatbox-description mt-1">禁用后所有快捷键将不会生效</p>
              </div>
            </label>
          </div>

          <!-- Show Shortcuts in Tooltip -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="shortcutSettings.showInTooltips"
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
                <span class="chatbox-checkbox-label cursor-pointer"> 在提示中显示快捷键 </span>
                <p class="chatbox-description mt-1">在按钮的工具提示中显示对应的快捷键</p>
              </div>
            </label>
          </div>

          <!-- Global Shortcuts -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="shortcutSettings.globalShortcuts"
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
                <span class="chatbox-checkbox-label cursor-pointer"> 启用全局快捷键 </span>
                <p class="chatbox-description mt-1">即使应用不在前台时也响应快捷键</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="settings-section">
        <h2>快速操作</h2>

        <div class="quick-actions-grid">
          <button @click="resetAllShortcuts" class="chatbox-button-outline">
            <RotateCcw :size="16" />
            重置所有快捷键
          </button>

          <button @click="exportShortcuts" class="chatbox-button-outline">
            <Download :size="16" />
            导出快捷键配置
          </button>

          <button @click="importShortcuts" class="chatbox-button-outline">
            <Upload :size="16" />
            导入快捷键配置
          </button>
        </div>
      </div>

      <!-- Shortcut Conflicts -->
      <div v-if="conflicts.length > 0" class="settings-section">
        <h2>快捷键冲突</h2>

        <div class="conflicts-list">
          <div
            v-for="conflict in conflicts"
            :key="`${conflict.key1}-${conflict.key2}`"
            class="conflict-item"
          >
            <div class="conflict-icon">
              <AlertTriangle :size="16" />
            </div>
            <div class="conflict-info">
              <div class="conflict-shortcuts">
                <span class="conflict-shortcut">{{ conflict.name1 }}</span>
                <span class="conflict-separator">和</span>
                <span class="conflict-shortcut">{{ conflict.name2 }}</span>
              </div>
              <div class="conflict-description">
                都使用了相同的快捷键: <kbd>{{ displayShortcut(conflict.shortcut) }}</kbd>
              </div>
            </div>
            <button @click="resolveConflict(conflict)" class="conflict-resolve">解决</button>
          </div>
        </div>
      </div>

      <!-- Keyboard Layout -->
      <div class="settings-section">
        <h2>键盘布局参考</h2>

        <div class="keyboard-reference">
          <div class="keyboard-row">
            <div class="key-group modifier-keys">
              <div class="key">Ctrl</div>
              <div class="key">Alt</div>
              <div class="key">Shift</div>
              <div class="key mac-only">Cmd</div>
            </div>
          </div>
          <div class="keyboard-row">
            <div class="key-group function-keys">
              <div class="key" v-for="i in 12" :key="i">F{{ i }}</div>
            </div>
          </div>
          <div class="keyboard-info">
            <p class="chatbox-description">• 修饰键可以组合使用（如: Ctrl+Shift+N）</p>
            <p class="chatbox-description">• Mac 用户请使用 Cmd 键代替 Ctrl 键</p>
            <p class="chatbox-description">• 避免与系统快捷键冲突</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden file input for import -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      @change="handleFileImport"
      style="display: none"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToastStore } from '@/stores/toast'
import { RotateCcw, Download, Upload, AlertTriangle } from 'lucide-vue-next'

const settingsStore = useSettingsStore()
const toastStore = useToastStore()

// Refs
const fileInput = ref<HTMLInputElement>()
const recordingKey = ref<string | null>(null)

// Local settings
const shortcutSettings = ref({
  enabled: true,
  showInTooltips: true,
  globalShortcuts: false
})

// Shortcut definitions
const globalShortcuts = {
  newChat: {
    name: '新建聊天',
    description: '创建新的聊天会话',
    default: 'cmd+n'
  },
  openSettings: {
    name: '打开设置',
    description: '打开设置页面',
    default: 'cmd+,'
  },
  toggleSidebar: {
    name: '切换侧边栏',
    description: '显示或隐藏左侧边栏',
    default: 'cmd+/'
  },
  searchChats: {
    name: '搜索聊天',
    description: '打开聊天搜索功能',
    default: 'cmd+f'
  }
}

const chatShortcuts = {
  focusInput: {
    name: '焦点到输入框',
    description: '将光标移到消息输入框',
    default: 'cmd+k'
  },
  sendMessage: {
    name: '发送消息',
    description: '发送当前输入的消息',
    default: 'cmd+enter'
  },
  nextChat: {
    name: '下一个聊天',
    description: '切换到下一个聊天',
    default: 'cmd+down'
  },
  prevChat: {
    name: '上一个聊天',
    description: '切换到上一个聊天',
    default: 'cmd+up'
  },
  clearChat: {
    name: '清空聊天',
    description: '清空当前聊天的所有消息',
    default: 'cmd+shift+c'
  },
  exportChat: {
    name: '导出聊天',
    description: '导出当前聊天记录',
    default: 'cmd+e'
  }
}

// Computed
const conflicts = computed(() => {
  const shortcuts = settingsStore.keyboardShortcuts
  const conflicts: Array<{
    key1: string
    key2: string
    name1: string
    name2: string
    shortcut: string
  }> = []

  const allShortcuts = { ...globalShortcuts, ...chatShortcuts }
  const keys = Object.keys(shortcuts)

  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const key1 = keys[i] as keyof typeof shortcuts
      const key2 = keys[j] as keyof typeof shortcuts

      if (shortcuts[key1] === shortcuts[key2] && shortcuts[key1].trim() !== '') {
        conflicts.push({
          key1,
          key2,
          name1: allShortcuts[key1 as keyof typeof allShortcuts]?.name || key1,
          name2: allShortcuts[key2 as keyof typeof allShortcuts]?.name || key2,
          shortcut: shortcuts[key1]
        })
      }
    }
  }

  return conflicts
})

// Methods
const displayShortcut = (shortcut: string) => {
  if (!shortcut) return ''

  return shortcut
    .split('+')
    .map(key => key.charAt(0).toUpperCase() + key.slice(1))
    .join(' + ')
}

const startRecording = (key: string) => {
  recordingKey.value = key
}

const recordShortcut = (event: KeyboardEvent, key: string) => {
  if (recordingKey.value !== key) return

  event.preventDefault()

  const keys: string[] = []

  if (event.ctrlKey || event.metaKey) {
    keys.push(navigator.platform.indexOf('Mac') > -1 ? 'cmd' : 'ctrl')
  }
  if (event.altKey) keys.push('alt')
  if (event.shiftKey) keys.push('shift')

  if (event.code) {
    let mainKey = event.code
      .replace('Key', '')
      .replace('Digit', '')
      .replace('Arrow', '')
      .toLowerCase()

    // Handle special keys
    const specialKeys: Record<string, string> = {
      space: 'space',
      enter: 'enter',
      escape: 'esc',
      tab: 'tab',
      backspace: 'backspace',
      delete: 'del',
      up: 'up',
      down: 'down',
      left: 'left',
      right: 'right'
    }

    if (specialKeys[mainKey]) {
      mainKey = specialKeys[mainKey]
    }

    if (mainKey !== 'control' && mainKey !== 'alt' && mainKey !== 'shift' && mainKey !== 'meta') {
      keys.push(mainKey)
    }
  }

  if (keys.length > 1) {
    const shortcut = keys.join('+')
    settingsStore.updateKeyboardShortcut(
      key as keyof typeof settingsStore.keyboardShortcuts,
      shortcut
    )
    toastStore.showSuccess(`快捷键已设置为: ${displayShortcut(shortcut)}`)
  }

  recordingKey.value = null
}

const resetShortcut = (key: string) => {
  const allShortcuts = { ...globalShortcuts, ...chatShortcuts }
  const defaultShortcut = allShortcuts[key as keyof typeof allShortcuts]?.default

  if (defaultShortcut) {
    settingsStore.updateKeyboardShortcut(
      key as keyof typeof settingsStore.keyboardShortcuts,
      defaultShortcut
    )
    toastStore.showSuccess('快捷键已重置为默认值')
  }
}

const resetAllShortcuts = () => {
  if (confirm('确定要重置所有快捷键为默认值吗？')) {
    settingsStore.resetKeyboardShortcuts()
    toastStore.showSuccess('所有快捷键已重置为默认值')
  }
}

const exportShortcuts = () => {
  const data = {
    shortcuts: settingsStore.keyboardShortcuts,
    settings: shortcutSettings.value,
    exported: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `miaoda-shortcuts-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  toastStore.showSuccess('快捷键配置已导出')
}

const importShortcuts = () => {
  fileInput.value?.click()
}

const handleFileImport = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  try {
    const text = await file.text()
    const data = JSON.parse(text)

    if (data.shortcuts) {
      // Validate shortcuts before importing
      const validShortcuts = { ...settingsStore.keyboardShortcuts }

      for (const [key, value] of Object.entries(data.shortcuts)) {
        if (key in validShortcuts && typeof value === 'string') {
          validShortcuts[key as keyof typeof validShortcuts] = value
        }
      }

      // Update shortcuts
      Object.entries(validShortcuts).forEach(([key, value]) => {
        settingsStore.updateKeyboardShortcut(
          key as keyof typeof settingsStore.keyboardShortcuts,
          value
        )
      })

      if (data.settings) {
        shortcutSettings.value = { ...shortcutSettings.value, ...data.settings }
      }

      toastStore.showSuccess('快捷键配置已导入')
    } else {
      toastStore.showError('无效的配置文件格式')
    }
  } catch (error) {
    toastStore.showError('导入失败，文件格式错误')
  }

  // Reset file input
  target.value = ''
}

const resolveConflict = (conflict: any) => {
  // Simple conflict resolution: reset one of the shortcuts
  resetShortcut(conflict.key1)
}

// Event handlers
const handleGlobalKeydown = (event: KeyboardEvent) => {
  if (recordingKey.value) return

  // Handle ESC to cancel recording
  if (event.key === 'Escape' && recordingKey.value) {
    recordingKey.value = null
    event.preventDefault()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)

  // Load shortcut settings
  const saved = localStorage.getItem('shortcutSettings')
  if (saved) {
    try {
      const settings = JSON.parse(saved)
      shortcutSettings.value = { ...shortcutSettings.value, ...settings }
    } catch (error) {
      console.error('Error loading shortcut settings:', error)
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})

// Watch for shortcut settings changes
watch(
  shortcutSettings,
  () => {
    localStorage.setItem('shortcutSettings', JSON.stringify(shortcutSettings.value))
  },
  { deep: true }
)
</script>

<style scoped>
@import './chatbox-base.css';

.chatbox-keyboard-shortcuts-panel {
  padding: var(--mantine-spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--mantine-spacing-xl);
}

/* Shortcuts list */
.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.5rem;
  transition: all 0.15s ease;
}

.shortcut-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.shortcut-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.shortcut-name {
  font-weight: 500;
  color: var(--mantine-color-chatbox-primary-text);
}

.shortcut-description {
  font-size: var(--mantine-font-size-sm);
  color: var(--mantine-color-chatbox-secondary-text);
}

.shortcut-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.shortcut-input {
  width: 150px;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.375rem;
  font-size: var(--mantine-font-size-sm);
  color: var(--mantine-color-chatbox-primary-text);
  text-align: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.shortcut-input:hover {
  border-color: var(--mantine-color-chatbox-brand-outline-hover);
}

.shortcut-input.recording {
  border-color: var(--mantine-color-chatbox-brand-filled);
  box-shadow: 0 0 0 2px var(--mantine-color-chatbox-brand-outline-hover);
  animation: pulse 1s infinite;
}

.shortcut-reset {
  padding: 0.25rem;
  background: transparent;
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.25rem;
  color: var(--mantine-color-chatbox-secondary-text);
  cursor: pointer;
  transition: all 0.15s ease;
}

.shortcut-reset:hover {
  background: var(--mantine-color-chatbox-brand-outline-hover);
  color: var(--mantine-color-chatbox-primary-text);
}

/* Quick actions */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

/* Button styles are now defined in chatbox-base.css */

/* Conflicts */
.conflicts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.conflict-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.5rem;
}

.conflict-icon {
  color: #ef4444;
  flex-shrink: 0;
}

.conflict-info {
  flex: 1;
}

.conflict-shortcuts {
  font-weight: 500;
  color: var(--mantine-color-chatbox-primary-text);
  margin-bottom: 0.25rem;
}

.conflict-shortcut {
  color: #ef4444;
}

.conflict-separator {
  color: var(--mantine-color-chatbox-secondary-text);
  margin: 0 0.5rem;
}

.conflict-description {
  font-size: var(--mantine-font-size-sm);
  color: var(--mantine-color-chatbox-secondary-text);
}

.conflict-resolve {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: var(--mantine-font-size-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.conflict-resolve:hover {
  background: #dc2626;
}

/* Keyboard reference */
.keyboard-reference {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.keyboard-row {
  display: flex;
  justify-content: center;
}

.key-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.key {
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.25rem;
  font-size: var(--mantine-font-size-sm);
  font-family: monospace;
  color: var(--mantine-color-chatbox-secondary-text);
  min-width: 2rem;
  text-align: center;
}

.modifier-keys .key {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: #3b82f6;
}

.function-keys .key {
  font-size: var(--mantine-font-size-xs);
  min-width: 1.5rem;
  padding: 0.25rem;
}

.mac-only {
  display: none;
}

.keyboard-info {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0.5rem;
}

/* Mac detection */
@media screen and (max-width: 0) {
  .mac-only {
    display: block;
  }
}

/* Animations */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Kbd styling */
kbd {
  padding: 0.125rem 0.25rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.25rem;
  font-size: var(--mantine-font-size-xs);
  font-family: monospace;
  color: var(--mantine-color-chatbox-primary-text);
}

/* Responsive */
@media (max-width: 768px) {
  .shortcut-item {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .shortcut-input-wrapper {
    justify-content: center;
  }

  .shortcut-input {
    flex: 1;
    max-width: none;
  }

  .quick-actions-grid {
    grid-template-columns: 1fr;
  }

  .key-group {
    gap: 0.25rem;
  }

  .key {
    font-size: var(--mantine-font-size-xs);
    padding: 0.125rem 0.25rem;
    min-width: 1.5rem;
  }
}
</style>
