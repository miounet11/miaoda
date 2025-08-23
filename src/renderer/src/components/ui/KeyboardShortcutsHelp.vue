<template>
  <div class="keyboard-shortcuts-help">
    <!-- Trigger Button -->
    <button
      @click="isOpen = true"
      class="shortcuts-trigger"
      :class="triggerClass"
      :title="triggerTitle"
    >
      <Keyboard :size="iconSize" />
      <span v-if="showLabel" class="ml-2">快捷键</span>
    </button>

    <!-- Modal -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        class="shortcuts-modal-backdrop fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        @click="isOpen = false"
      >
        <div
          class="shortcuts-modal fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 bg-background border border-border rounded-lg shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden"
          @click.stop
        >
          <!-- Header -->
          <div class="modal-header flex items-center justify-between p-4 border-b border-border">
            <div class="flex items-center gap-3">
              <Keyboard :size="20" class="text-primary" />
              <h2 class="text-lg font-semibold">键盘快捷键</h2>
            </div>
            <button
              @click="isOpen = false"
              class="close-button p-2 hover:bg-muted rounded-md transition-colors"
            >
              <X :size="18" />
            </button>
          </div>

          <!-- Content -->
          <div class="modal-content p-4 overflow-y-auto">
            <div class="shortcuts-grid grid gap-6 md:grid-cols-2">
              <!-- Chat Management -->
              <div class="shortcut-section">
                <h3 class="section-title flex items-center gap-2 mb-3">
                  <MessageSquare :size="16" class="text-blue-500" />
                  聊天管理
                </h3>
                <div class="shortcuts-list space-y-2">
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + N</kbd>
                    <span class="shortcut-desc">新建聊天</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + Tab</kbd>
                    <span class="shortcut-desc">下一个聊天</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + Shift + Tab</kbd>
                    <span class="shortcut-desc">上一个聊天</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + 1-5</kbd>
                    <span class="shortcut-desc">选择聊天 1-5</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + /</kbd>
                    <span class="shortcut-desc">搜索聊天</span>
                  </div>
                </div>
              </div>

              <!-- Message Actions -->
              <div class="shortcut-section">
                <h3 class="section-title flex items-center gap-2 mb-3">
                  <Send :size="16" class="text-green-500" />
                  消息操作
                </h3>
                <div class="shortcuts-list space-y-2">
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + Enter</kbd>
                    <span class="shortcut-desc">发送消息</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + Shift + R</kbd>
                    <span class="shortcut-desc">重新生成回复</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + D</kbd>
                    <span class="shortcut-desc">复制消息</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + E</kbd>
                    <span class="shortcut-desc">编辑消息</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Delete</kbd>
                    <span class="shortcut-desc">删除消息</span>
                  </div>
                </div>
              </div>

              <!-- Navigation -->
              <div class="shortcut-section">
                <h3 class="section-title flex items-center gap-2 mb-3">
                  <Navigation :size="16" class="text-purple-500" />
                  导航
                </h3>
                <div class="shortcuts-list space-y-2">
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Alt + 1</kbd>
                    <span class="shortcut-desc">聚焦主内容</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Alt + 2</kbd>
                    <span class="shortcut-desc">聚焦侧边栏</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Alt + 3</kbd>
                    <span class="shortcut-desc">聚焦输入框</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Tab</kbd>
                    <span class="shortcut-desc">下一个元素</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Shift + Tab</kbd>
                    <span class="shortcut-desc">上一个元素</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">↑ ↓ ← →</kbd>
                    <span class="shortcut-desc">箭头导航</span>
                  </div>
                </div>
              </div>

              <!-- Interface -->
              <div class="shortcut-section">
                <h3 class="section-title flex items-center gap-2 mb-3">
                  <Settings :size="16" class="text-orange-500" />
                  界面控制
                </h3>
                <div class="shortcuts-list space-y-2">
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + B</kbd>
                    <span class="shortcut-desc">切换侧边栏</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + ,</kbd>
                    <span class="shortcut-desc">打开设置</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + K</kbd>
                    <span class="shortcut-desc">命令面板</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + Shift + D</kbd>
                    <span class="shortcut-desc">切换深色模式</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">F11</kbd>
                    <span class="shortcut-desc">全屏模式</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Esc</kbd>
                    <span class="shortcut-desc">关闭弹窗/取消</span>
                  </div>
                </div>
              </div>

              <!-- Media -->
              <div class="shortcut-section">
                <h3 class="section-title flex items-center gap-2 mb-3">
                  <Mic :size="16" class="text-red-500" />
                  媒体操作
                </h3>
                <div class="shortcuts-list space-y-2">
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + Shift + V</kbd>
                    <span class="shortcut-desc">语音录制</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + Shift + I</kbd>
                    <span class="shortcut-desc">上传图片</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + Shift + F</kbd>
                    <span class="shortcut-desc">上传文件</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Space</kbd>
                    <span class="shortcut-desc">播放/暂停</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + V</kbd>
                    <span class="shortcut-desc">粘贴图片</span>
                  </div>
                </div>
              </div>

              <!-- Accessibility -->
              <div class="shortcut-section">
                <h3 class="section-title flex items-center gap-2 mb-3">
                  <Eye :size="16" class="text-indigo-500" />
                  无障碍访问
                </h3>
                <div class="shortcuts-list space-y-2">
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + =</kbd>
                    <span class="shortcut-desc">放大字体</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + -</kbd>
                    <span class="shortcut-desc">缩小字体</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + 0</kbd>
                    <span class="shortcut-desc">重置字体大小</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + Shift + H</kbd>
                    <span class="shortcut-desc">高对比度模式</span>
                  </div>
                  <div class="shortcut-item">
                    <kbd class="shortcut-key">Ctrl + Shift + ?</kbd>
                    <span class="shortcut-desc">显示此帮助</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tips -->
            <div class="tips-section mt-6 p-4 bg-muted/20 rounded-lg">
              <h4 class="tips-title flex items-center gap-2 mb-2">
                <Info :size="16" class="text-blue-500" />
                提示
              </h4>
              <ul class="tips-list text-sm text-muted-foreground space-y-1">
                <li>• 大部分快捷键在输入框获得焦点时也可以使用</li>
                <li>• 使用 Tab 键可以在界面元素间快速导航</li>
                <li>• 按住 Shift 键并使用箭头键可以选择文本</li>
                <li>• 在模态对话框中，Tab 键会在对话框内循环</li>
                <li>• 可以在设置中自定义部分快捷键</li>
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="modal-footer flex items-center justify-between p-4 border-t border-border bg-muted/20"
          >
            <div class="footer-info text-sm text-muted-foreground">
              按 <kbd class="inline-kbd">Ctrl + Shift + ?</kbd> 随时打开此帮助
            </div>
            <button
              @click="isOpen = false"
              class="close-footer-button px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Keyboard,
  X,
  MessageSquare,
  Send,
  Navigation,
  Settings,
  Mic,
  Eye,
  Info
} from 'lucide-vue-next'

interface Props {
  triggerClass?: string
  triggerTitle?: string
  showLabel?: boolean
  iconSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  triggerClass:
    'p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground',
  triggerTitle: '键盘快捷键 (Ctrl + Shift + ?)',
  showLabel: false,
  iconSize: 16
})

const isOpen = ref(false)

// Global shortcut to open help
const handleGlobalShortcut = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.shiftKey && event.key === '?') {
    event.preventDefault()
    isOpen.value = true
  }

  // Close on Escape
  if (event.key === 'Escape' && isOpen.value) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleGlobalShortcut)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalShortcut)
})
</script>

<style scoped>
.shortcuts-modal-backdrop {
  animation: backdrop-fade-in 0.3s ease-out;
}

.shortcuts-modal {
  animation: modal-slide-in 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}

@keyframes backdrop-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modal-slide-in {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1) translateY(0);
  }
}

/* Shortcut sections */
.shortcut-section {
  @apply space-y-3;
}

.section-title {
  @apply text-sm font-semibold text-foreground;
}

.shortcut-item {
  @apply flex items-center justify-between gap-3;
}

.shortcut-key {
  @apply inline-flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-mono min-w-fit;
  border: 1px solid rgba(var(--border), 0.5);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.shortcut-desc {
  @apply text-sm text-foreground flex-1;
}

/* Inline kbd styling */
.inline-kbd {
  @apply inline-flex items-center px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-xs font-mono;
  border: 1px solid rgba(var(--border), 0.5);
}

/* Tips section */
.tips-section {
  border: 1px solid rgba(var(--border), 0.3);
}

.tips-title {
  @apply text-sm font-medium text-foreground;
}

.tips-list li {
  @apply leading-relaxed;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .shortcuts-grid {
    @apply grid-cols-1;
  }

  .shortcuts-modal {
    @apply inset-2 transform-none;
    position: fixed !important;
    top: 1rem !important;
    left: 1rem !important;
    right: 1rem !important;
    bottom: 1rem !important;
    transform: none !important;
  }

  .shortcut-item {
    @apply flex-col items-start gap-1;
  }

  .shortcut-key {
    @apply self-start;
  }
}

/* Focus management */
.shortcuts-trigger:focus-visible {
  @apply outline-none ring-2 ring-primary ring-offset-2;
}

.close-button:focus-visible,
.close-footer-button:focus-visible {
  @apply outline-none ring-2 ring-primary ring-offset-2;
}

/* Dark mode enhancements */
@media (prefers-color-scheme: dark) {
  .shortcut-key {
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .inline-kbd {
    border-color: rgba(255, 255, 255, 0.1);
  }
}

/* Animation for better UX */
.shortcuts-list {
  animation: stagger-fade-in 0.6s ease-out;
}

@keyframes stagger-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Hover effects */
.shortcut-item:hover {
  @apply bg-muted/10 rounded px-2 py-1 -mx-2 -my-1 transition-colors;
}
</style>
