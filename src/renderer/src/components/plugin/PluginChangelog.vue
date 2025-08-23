<template>
  <div class="plugin-changelog">
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <p>正在加载更新日志...</p>
    </div>

    <div v-else-if="changelog.length === 0" class="empty-state">
      <Clock :size="48" class="empty-icon" />
      <h3>暂无更新日志</h3>
      <p>此插件还没有发布更新</p>
    </div>

    <div v-else class="changelog-container">
      <div v-for="version in changelog" :key="version.version" class="version-item">
        <div class="version-header">
          <div class="version-info">
            <h3 class="version-number">v{{ version.version }}</h3>
            <span v-if="version.isLatest" class="latest-badge"> 最新 </span>
            <span v-if="version.type" :class="['version-type', version.type]">
              {{ getVersionTypeLabel(version.type) }}
            </span>
          </div>
          <div class="version-meta">
            <span class="version-date">{{ formatDate(version.date) }}</span>
            <span v-if="version.size" class="version-size">{{ version.size }}</span>
          </div>
        </div>

        <div class="version-content">
          <div v-if="version.summary" class="version-summary">
            {{ version.summary }}
          </div>

          <div class="changes-section">
            <!-- New Features -->
            <div v-if="version.changes.features?.length" class="change-group">
              <h4 class="change-title">
                <Plus :size="16" class="change-icon features" />
                新功能
              </h4>
              <ul class="change-list">
                <li v-for="feature in version.changes.features" :key="feature">
                  {{ feature }}
                </li>
              </ul>
            </div>

            <!-- Improvements -->
            <div v-if="version.changes.improvements?.length" class="change-group">
              <h4 class="change-title">
                <ArrowUp :size="16" class="change-icon improvements" />
                改进
              </h4>
              <ul class="change-list">
                <li v-for="improvement in version.changes.improvements" :key="improvement">
                  {{ improvement }}
                </li>
              </ul>
            </div>

            <!-- Bug Fixes -->
            <div v-if="version.changes.fixes?.length" class="change-group">
              <h4 class="change-title">
                <Bug :size="16" class="change-icon fixes" />
                修复
              </h4>
              <ul class="change-list">
                <li v-for="fix in version.changes.fixes" :key="fix">
                  {{ fix }}
                </li>
              </ul>
            </div>

            <!-- Breaking Changes -->
            <div v-if="version.changes.breaking?.length" class="change-group">
              <h4 class="change-title">
                <AlertTriangle :size="16" class="change-icon breaking" />
                破坏性变更
              </h4>
              <ul class="change-list">
                <li v-for="breaking in version.changes.breaking" :key="breaking">
                  {{ breaking }}
                </li>
              </ul>
            </div>

            <!-- Security -->
            <div v-if="version.changes.security?.length" class="change-group">
              <h4 class="change-title">
                <Shield :size="16" class="change-icon security" />
                安全
              </h4>
              <ul class="change-list">
                <li v-for="security in version.changes.security" :key="security">
                  {{ security }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Version Actions -->
          <div class="version-actions">
            <button
              v-if="!version.isLatest"
              @click="installVersion(version)"
              class="action-btn secondary"
            >
              <Download :size="14" />
              安装此版本
            </button>
            <button
              v-if="version.releaseNotes"
              @click="viewReleaseNotes(version)"
              class="action-btn secondary"
            >
              <ExternalLink :size="14" />
              详细说明
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Clock,
  Plus,
  ArrowUp,
  Bug,
  AlertTriangle,
  Shield,
  Download,
  ExternalLink
} from 'lucide-vue-next'

import type { PluginMarketListing } from '../../types/plugins'

interface VersionChanges {
  features?: string[]
  improvements?: string[]
  fixes?: string[]
  breaking?: string[]
  security?: string[]
}

interface ChangelogVersion {
  version: string
  date: string
  summary?: string
  type?: 'major' | 'minor' | 'patch' | 'beta' | 'alpha'
  size?: string
  isLatest?: boolean
  changes: VersionChanges
  releaseNotes?: string
}

interface Props {
  plugin: PluginMarketListing
}

defineProps<Props>()

// State
const loading = ref(false)
const changelog = ref<ChangelogVersion[]>([
  {
    version: '2.1.0',
    date: '2024-01-15',
    summary: '大幅改进用户体验，新增多项实用功能',
    type: 'minor',
    size: '2.3 MB',
    isLatest: true,
    changes: {
      features: [
        '新增三角函数计算支持',
        '添加单位转换功能',
        '支持历史记录导出',
        '新增键盘快捷键自定义'
      ],
      improvements: [
        '优化计算精度算法',
        '改进界面响应速度',
        '提升内存使用效率',
        '优化错误提示信息'
      ],
      fixes: [
        '修复小数点精度问题',
        '修复特殊字符输入错误',
        '修复界面在小屏幕下的显示问题',
        '修复快捷键冲突'
      ]
    },
    releaseNotes: 'https://example.com/release-notes/2.1.0'
  },
  {
    version: '2.0.5',
    date: '2024-01-01',
    summary: '修复重要bug，提升稳定性',
    type: 'patch',
    size: '2.1 MB',
    changes: {
      fixes: ['修复计算结果显示错误', '修复插件崩溃问题', '修复设置无法保存'],
      improvements: ['优化启动速度', '减少内存占用'],
      security: ['修复潜在的安全漏洞', '更新依赖库版本']
    }
  },
  {
    version: '2.0.0',
    date: '2023-12-20',
    summary: '全新设计，重构核心功能',
    type: 'major',
    size: '2.5 MB',
    changes: {
      features: ['全新的用户界面设计', '支持科学计数法', '添加历史记录功能', '支持多种主题切换'],
      improvements: ['重构计算引擎', '提升计算精度', '优化性能表现'],
      breaking: ['API 接口变更，不兼容 1.x 版本', '配置文件格式更新，需要重新设置']
    }
  }
])

// Methods
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getVersionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    major: '主版本',
    minor: '次版本',
    patch: '补丁',
    beta: 'Beta',
    alpha: 'Alpha'
  }
  return labels[type] || type
}

const installVersion = (version: ChangelogVersion) => {
  console.log('Install version:', version.version)
  // Implement version-specific installation
}

const viewReleaseNotes = (version: ChangelogVersion) => {
  if (version.releaseNotes) {
    window.open(version.releaseNotes, '_blank')
  }
}

// Initialize
onMounted(() => {
  // Load changelog from API
})
</script>

<style scoped>
.plugin-changelog {
  @apply space-y-6;
}

/* Loading & Empty States */
.loading-state {
  @apply flex flex-col items-center justify-center py-8;
}

.loading-spinner {
  @apply w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin mb-2;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.empty-icon {
  @apply text-muted-foreground mb-4;
}

.empty-state h3 {
  @apply text-lg font-semibold mb-2;
}

.empty-state p {
  @apply text-muted-foreground;
}

/* Changelog Container */
.changelog-container {
  @apply space-y-6;
}

/* Version Item */
.version-item {
  @apply border border-border rounded-lg overflow-hidden;
}

.version-header {
  @apply flex items-start justify-between p-4 bg-muted/30 border-b border-border;
}

.version-info {
  @apply flex items-center gap-3;
}

.version-number {
  @apply text-lg font-semibold;
}

.latest-badge {
  @apply px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium;
}

.version-type {
  @apply px-2 py-1 text-xs rounded-full font-medium;
}

.version-type.major {
  @apply bg-red-100 text-red-700;
}

.version-type.minor {
  @apply bg-blue-100 text-blue-700;
}

.version-type.patch {
  @apply bg-gray-100 text-gray-700;
}

.version-type.beta {
  @apply bg-yellow-100 text-yellow-700;
}

.version-type.alpha {
  @apply bg-purple-100 text-purple-700;
}

.version-meta {
  @apply flex items-center gap-3 text-sm text-muted-foreground;
}

.version-content {
  @apply p-4 space-y-4;
}

.version-summary {
  @apply text-sm text-muted-foreground italic border-l-4 border-primary pl-4;
}

/* Changes Section */
.changes-section {
  @apply space-y-4;
}

.change-group {
  @apply space-y-2;
}

.change-title {
  @apply flex items-center gap-2 text-sm font-medium;
}

.change-icon {
  @apply flex-shrink-0;
}

.change-icon.features {
  @apply text-green-600;
}

.change-icon.improvements {
  @apply text-blue-600;
}

.change-icon.fixes {
  @apply text-orange-600;
}

.change-icon.breaking {
  @apply text-red-600;
}

.change-icon.security {
  @apply text-purple-600;
}

.change-list {
  @apply ml-6 space-y-1 text-sm;
}

.change-list li {
  @apply relative;
}

.change-list li:before {
  @apply content-["•"] absolute -left-4 text-muted-foreground;
}

/* Version Actions */
.version-actions {
  @apply flex items-center gap-2 pt-4 border-t border-border;
}

.action-btn {
  @apply inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors;
}

.action-btn.secondary {
  @apply border border-border hover:bg-accent;
}

/* Dark mode adjustments */
.dark .latest-badge {
  @apply bg-green-900/50 text-green-400;
}

.dark .version-type.major {
  @apply bg-red-900/50 text-red-400;
}

.dark .version-type.minor {
  @apply bg-blue-900/50 text-blue-400;
}

.dark .version-type.patch {
  @apply bg-gray-800 text-gray-300;
}

.dark .version-type.beta {
  @apply bg-yellow-900/50 text-yellow-400;
}

.dark .version-type.alpha {
  @apply bg-purple-900/50 text-purple-400;
}
</style>
