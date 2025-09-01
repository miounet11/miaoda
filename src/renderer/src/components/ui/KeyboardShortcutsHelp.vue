<template>
  <div class="keyboard-shortcuts-help">
    <!-- Trigger Button -->
    <button
      @click="isOpen = true"
      class="shortcuts-trigger"
      :class="triggerClass"
      :title="triggerTitle"
     aria-label="按钮">
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
             aria-label="按钮">
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
             aria-label="按钮">
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


/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
    transition-duration: 0.01ms !important;
  }
}</style>
