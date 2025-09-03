<template>
  <div class="debug-panel h-full flex flex-col">
    <!-- 面板头部 -->
    <div class="panel-header flex items-center justify-between mb-6 flex-shrink-0">
      <div class="flex items-center">
        <div class="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code text-white" aria-hidden="true">
            <path d="m16 18 6-6-6-6"></path>
            <path d="m8 6-6 6 6 6"></path>
          </svg>
        </div>
        <h5 class="semi-typography mb-0 semi-typography-primary semi-typography-normal semi-typography-h5">调试信息</h5>
      </div>
      <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <!-- 标签页 -->
    <div class="tabs flex-shrink-0 mb-4">
      <div class="flex border-b border-gray-200">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="[
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === tab.key
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          ]"
        >
          <div class="flex items-center gap-2">
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
          </div>
        </button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-area flex-1 overflow-hidden">
      <!-- 预览请求体 -->
      <div v-if="activeTab === 'preview'" class="tab-content h-full">
        <div class="json-viewer h-full bg-gray-900 text-gray-100 rounded-lg overflow-hidden">
          <div class="viewer-header flex items-center justify-between p-3 bg-gray-800">
            <span class="text-sm font-medium">预览请求体</span>
            <button @click="copyContent(requestPreview)" class="text-gray-400 hover:text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
              </svg>
            </button>
          </div>
          <pre class="json-content p-4 text-xs overflow-auto h-full leading-relaxed"><code>{{ formatJson(requestPreview) }}</code></pre>
        </div>
      </div>

      <!-- 实际请求体 -->
      <div v-else-if="activeTab === 'request'" class="tab-content h-full">
        <div v-if="actualRequest" class="json-viewer h-full bg-gray-900 text-gray-100 rounded-lg overflow-hidden">
          <div class="viewer-header flex items-center justify-between p-3 bg-gray-800">
            <span class="text-sm font-medium">实际请求体</span>
            <button @click="copyContent(actualRequest)" class="text-gray-400 hover:text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
              </svg>
            </button>
          </div>
          <pre class="json-content p-4 text-xs overflow-auto h-full leading-relaxed"><code>{{ formatJson(actualRequest) }}</code></pre>
        </div>
        <div v-else class="empty-state flex items-center justify-center h-full text-gray-500">
          <div class="text-center">
            <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p class="text-sm">暂无请求数据</p>
          </div>
        </div>
      </div>

      <!-- 响应 -->
      <div v-else-if="activeTab === 'response'" class="tab-content h-full">
        <div v-if="response" class="json-viewer h-full bg-gray-900 text-gray-100 rounded-lg overflow-hidden">
          <div class="viewer-header flex items-center justify-between p-3 bg-gray-800">
            <span class="text-sm font-medium">响应数据</span>
            <button @click="copyContent(response)" class="text-gray-400 hover:text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
              </svg>
            </button>
          </div>
          <pre class="json-content p-4 text-xs overflow-auto h-full leading-relaxed"><code>{{ formatJson(response) }}</code></pre>
        </div>
        <div v-else class="empty-state flex items-center justify-center h-full text-gray-500">
          <div class="text-center">
            <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            <p class="text-sm">暂无响应数据</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="panel-footer flex items-center justify-between text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
      <span>预览更新: {{ lastUpdate }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Props {
  requestPreview: string
  actualRequest: string
  response: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const activeTab = ref('preview')
const lastUpdate = ref(new Date().toLocaleString('zh-CN'))

// 标签页配置
const tabs = [
  {
    key: 'preview',
    label: '预览请求体',
    icon: 'EyeIcon'
  },
  {
    key: 'request',
    label: '实际请求体',
    icon: 'SendIcon'
  },
  {
    key: 'response',
    label: '响应',
    icon: 'ZapIcon'
  }
]

// 图标组件
const EyeIcon = {
  template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>'
}

const SendIcon = {
  template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path></svg>'
}

const ZapIcon = {
  template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>'
}

// 格式化JSON
const formatJson = (jsonString: string): string => {
  if (!jsonString) return ''

  try {
    const parsed = JSON.parse(jsonString)
    return JSON.stringify(parsed, null, 2)
  } catch (error) {
    return jsonString
  }
}

// 复制内容
const copyContent = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    // 这里可以添加一个临时的成功提示
    console.log('内容已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 监听属性变化更新时间
const updateLastUpdate = () => {
  lastUpdate.value = new Date().toLocaleString('zh-CN')
}

// 监听props变化
import { watch } from 'vue'
watch(() => [props.requestPreview, props.actualRequest, props.response], updateLastUpdate, { deep: true })
</script>

<style scoped>
.debug-panel {
  padding: 24px;
  background: white;
}

.panel-header {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 16px;
}

.tabs {
  /* 标签页样式 */
}

.tab-content {
  /* 标签内容样式 */
}

.json-viewer {
  border: 1px solid #374151;
  border-radius: 8px;
}

.viewer-header {
  border-bottom: 1px solid #4b5563;
}

.json-content {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.empty-state {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.panel-footer {
  /* 底部样式 */
}

/* JSON语法高亮 */
.json-content .token {
  /* 可以在这里添加更多的语法高亮样式 */
}

/* 字符串 */
.json-content .string {
  color: #10b981;
}

/* 数字 */
.json-content .number {
  color: #f59e0b;
}

/* 布尔值 */
.json-content .boolean {
  color: #8b5cf6;
}

/* null */
.json-content .null {
  color: #ef4444;
}

/* 键名 */
.json-content .key {
  color: #3b82f6;
}
</style>
