<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="modal-overlay"
      @click.self="$emit('close')"
    >
      <div class="modal-container">
        <!-- Modal Header -->
        <div class="modal-header">
          <div class="header-left">
            <div class="plugin-icon-large">
              <img
                v-if="plugin.icon"
                :src="plugin.icon"
                :alt="plugin.name"
                class="icon-image"
              />
              <Package v-else :size="48" class="icon-default" />
            </div>
            
            <div class="plugin-title-info">
              <div class="title-row">
                <h1 class="plugin-title">{{ plugin.name }}</h1>
                <div class="plugin-badges">
                  <span v-if="plugin.verified" class="badge verified">
                    <Shield :size="14" />
                    认证
                  </span>
                  <span v-if="plugin.featured" class="badge featured">
                    <Sparkles :size="14" />
                    推荐
                  </span>
                </div>
              </div>
              
              <div class="plugin-meta">
                <span class="author">by {{ plugin.author }}</span>
                <span class="separator">•</span>
                <span class="version">v{{ plugin.version }}</span>
                <span class="separator">•</span>
                <span class="category">{{ plugin.category.name }}</span>
              </div>
              
              <div class="plugin-stats">
                <div class="stat-item">
                  <Star :size="16" class="star-icon" />
                  <span class="rating">{{ plugin.rating.toFixed(1) }}</span>
                  <span class="reviews">({{ formatNumber(plugin.reviewCount) }} 评价)</span>
                </div>
                <div class="stat-item">
                  <Download :size="16" />
                  <span>{{ formatNumber(plugin.downloads) }} 下载</span>
                </div>
                <div class="stat-item">
                  <Calendar :size="16" />
                  <span>更新于 {{ formatDate(plugin.lastUpdated) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="header-actions">
            <button @click="$emit('close')" class="close-btn">
              <X :size="24" />
            </button>
          </div>
        </div>

        <!-- Modal Content -->
        <div class="modal-content">
          <!-- Main Actions -->
          <div class="action-section">
            <template v-if="plugin.status === 'installed'">
              <button @click="$emit('uninstall', plugin)" class="action-btn uninstall">
                <Trash2 :size="20" />
                卸载插件
              </button>
              <button class="action-btn secondary">
                <Settings :size="20" />
                设置
              </button>
            </template>
            <template v-else-if="plugin.status === 'updating'">
              <button class="action-btn updating" disabled>
                <Loader2 :size="20" class="animate-spin" />
                安装中...
              </button>
            </template>
            <template v-else>
              <button @click="$emit('install', plugin)" class="action-btn install">
                <Download :size="20" />
                安装插件
              </button>
            </template>
            
            <button @click="$emit('rate', plugin)" class="action-btn secondary">
              <Star :size="20" />
              评价
            </button>
            
            <div class="pricing-info" v-if="plugin.pricing === 'paid'">
              <span class="price">${{ plugin.price }}</span>
              <span class="currency">{{ plugin.currency?.toUpperCase() }}</span>
            </div>
          </div>

          <!-- Tab Navigation -->
          <div class="tab-nav">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="['tab-btn', { active: activeTab === tab.id }]"
            >
              <component :is="tab.icon" :size="16" />
              {{ tab.label }}
            </button>
          </div>

          <!-- Tab Content -->
          <div class="tab-content">
            <!-- Overview Tab -->
            <div v-show="activeTab === 'overview'" class="tab-pane overview">
              <div class="content-grid">
                <div class="main-content">
                  <!-- Screenshots -->
                  <div v-if="plugin.screenshots?.length" class="screenshots">
                    <h3 class="section-title">截图</h3>
                    <div class="screenshot-gallery">
                      <div
                        v-for="(screenshot, index) in plugin.screenshots"
                        :key="index"
                        class="screenshot-item"
                        @click="openScreenshot(index)"
                      >
                        <img :src="screenshot" :alt="`Screenshot ${index + 1}`" />
                      </div>
                    </div>
                  </div>

                  <!-- Description -->
                  <div class="description">
                    <h3 class="section-title">插件介绍</h3>
                    <div class="description-content" v-html="formatDescription(plugin.description)"></div>
                  </div>

                  <!-- Features -->
                  <div class="features" v-if="pluginFeatures.length">
                    <h3 class="section-title">主要功能</h3>
                    <ul class="features-list">
                      <li v-for="feature in pluginFeatures" :key="feature">
                        <Check :size="16" />
                        {{ feature }}
                      </li>
                    </ul>
                  </div>

                  <!-- What's New -->
                  <div class="whats-new" v-if="changeLog.length">
                    <h3 class="section-title">版本更新</h3>
                    <div class="changelog">
                      <div
                        v-for="change in changeLog.slice(0, 3)"
                        :key="change.version"
                        class="changelog-item"
                      >
                        <div class="changelog-header">
                          <span class="version">v{{ change.version }}</span>
                          <span class="date">{{ formatDate(change.date) }}</span>
                        </div>
                        <ul class="changelog-changes">
                          <li v-for="item in change.changes" :key="item">{{ item }}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="sidebar-content">
                  <!-- Quick Info -->
                  <div class="info-card">
                    <h4 class="info-title">插件信息</h4>
                    <dl class="info-list">
                      <dt>作者</dt>
                      <dd>
                        <button class="author-link" @click="viewAuthor">
                          {{ plugin.author }}
                        </button>
                      </dd>
                      <dt>版本</dt>
                      <dd>{{ plugin.version }}</dd>
                      <dt>大小</dt>
                      <dd>2.1 MB</dd>
                      <dt>支持平台</dt>
                      <dd>
                        <div class="platforms">
                          <span
                            v-for="platform in plugin.platforms"
                            :key="platform"
                            class="platform-badge"
                          >
                            {{ getPlatformLabel(platform) }}
                          </span>
                        </div>
                      </dd>
                      <dt>权限</dt>
                      <dd>
                        <button class="permissions-link" @click="showPermissions = true">
                          查看权限
                        </button>
                      </dd>
                    </dl>
                  </div>

                  <!-- Tags -->
                  <div class="info-card">
                    <h4 class="info-title">标签</h4>
                    <div class="tags-container">
                      <span
                        v-for="tag in plugin.tags"
                        :key="tag"
                        class="tag-item"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>

                  <!-- Links -->
                  <div class="info-card" v-if="plugin.homepage || plugin.repository">
                    <h4 class="info-title">链接</h4>
                    <div class="links-list">
                      <a
                        v-if="plugin.homepage"
                        :href="plugin.homepage"
                        target="_blank"
                        class="link-item"
                      >
                        <ExternalLink :size="16" />
                        主页
                      </a>
                      <a
                        v-if="plugin.repository"
                        :href="plugin.repository"
                        target="_blank"
                        class="link-item"
                      >
                        <Github :size="16" />
                        源代码
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Reviews Tab -->
            <div v-show="activeTab === 'reviews'" class="tab-pane reviews">
              <PluginReviews :plugin="plugin" />
            </div>

            <!-- Changelog Tab -->
            <div v-show="activeTab === 'changelog'" class="tab-pane changelog">
              <PluginChangelog :plugin="plugin" />
            </div>

            <!-- Related Tab -->
            <div v-show="activeTab === 'related'" class="tab-pane related">
              <PluginRelated :plugin="plugin" />
            </div>
          </div>
        </div>

        <!-- Permissions Modal -->
        <PluginPermissionsModal
          v-if="showPermissions"
          :plugin="plugin"
          :show="showPermissions"
          @close="showPermissions = false"
        />

        <!-- Screenshot Viewer -->
        <ScreenshotViewer
          v-if="screenshotIndex !== -1"
          :screenshots="plugin.screenshots || []"
          :initial-index="screenshotIndex"
          @close="screenshotIndex = -1"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Package, Shield, Sparkles, Star, Download, Calendar, X,
  Trash2, Loader2, Settings, Check, ExternalLink, Github,
  FileText, MessageCircle, Clock, Grid
} from 'lucide-vue-next'

import PluginReviews from './PluginReviews.vue'
import PluginChangelog from './PluginChangelog.vue'
import PluginRelated from './PluginRelated.vue'
import PluginPermissionsModal from './PluginPermissionsModal.vue'
import ScreenshotViewer from './ScreenshotViewer.vue'

import type { PluginMarketListing } from '../../types/plugins'

interface Props {
  plugin: PluginMarketListing
  show: boolean
}

defineProps<Props>()

defineEmits<{
  close: []
  install: [plugin: PluginMarketListing]
  uninstall: [plugin: PluginMarketListing]
  rate: [plugin: PluginMarketListing]
}>()

// State
const activeTab = ref('overview')
const showPermissions = ref(false)
const screenshotIndex = ref(-1)

// Tabs configuration
const tabs = [
  { id: 'overview', label: '概览', icon: FileText },
  { id: 'reviews', label: '评价', icon: MessageCircle },
  { id: 'changelog', label: '更新日志', icon: Clock },
  { id: 'related', label: '相关推荐', icon: Grid }
]

// Mock data - in real implementation, this would come from API
const pluginFeatures = computed(() => [
  '支持高级数学函数计算',
  '单位转换功能',
  '历史记录保存',
  '快捷键操作',
  '自定义主题'
])

const changeLog = computed(() => [
  {
    version: '2.1.0',
    date: '2024-01-15',
    changes: [
      '新增三角函数计算',
      '优化界面响应速度',
      '修复小数点精度问题'
    ]
  },
  {
    version: '2.0.5',
    date: '2024-01-01',
    changes: [
      '支持科学计数法',
      '添加历史记录功能'
    ]
  }
])

// Methods
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatDescription = (description: string): string => {
  // Convert markdown-like formatting to HTML
  return description
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

const getPlatformLabel = (platform: string): string => {
  const labels: Record<string, string> = {
    win: 'Windows',
    mac: 'macOS',
    linux: 'Linux'
  }
  return labels[platform] || platform
}

const viewAuthor = () => {
  // Navigate to author page
  console.log('View author:', plugin.value.author)
}

const openScreenshot = (index: number) => {
  screenshotIndex.value = index
}
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50;
}

.modal-container {
  @apply bg-background border border-border rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[90vh] overflow-hidden flex flex-col;
}

.modal-header {
  @apply flex items-start justify-between p-6 border-b border-border;
}

.header-left {
  @apply flex gap-4 flex-1 min-w-0;
}

.plugin-icon-large {
  @apply w-20 h-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0;
}

.icon-image {
  @apply w-full h-full object-cover;
}

.icon-default {
  @apply text-muted-foreground;
}

.plugin-title-info {
  @apply flex-1 min-w-0;
}

.title-row {
  @apply flex items-center gap-3 mb-2;
}

.plugin-title {
  @apply text-2xl font-bold text-foreground;
}

.plugin-badges {
  @apply flex gap-2;
}

.badge {
  @apply inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium;
}

.badge.verified {
  @apply bg-green-100 text-green-700;
}

.badge.featured {
  @apply bg-yellow-100 text-yellow-700;
}

.plugin-meta {
  @apply flex items-center gap-2 text-sm text-muted-foreground mb-3;
}

.separator {
  @apply text-muted-foreground/50;
}

.plugin-stats {
  @apply flex flex-wrap items-center gap-4 text-sm text-muted-foreground;
}

.stat-item {
  @apply flex items-center gap-1;
}

.star-icon {
  @apply text-yellow-500;
}

.rating {
  @apply text-foreground font-medium;
}

.header-actions {
  @apply flex items-start;
}

.close-btn {
  @apply p-2 hover:bg-accent rounded-lg transition-colors;
}

.modal-content {
  @apply flex-1 overflow-hidden flex flex-col;
}

.action-section {
  @apply flex items-center gap-3 p-6 border-b border-border;
}

.action-btn {
  @apply inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors;
}

.action-btn.install {
  @apply bg-primary text-primary-foreground hover:bg-primary/90;
}

.action-btn.uninstall {
  @apply bg-destructive text-destructive-foreground hover:bg-destructive/90;
}

.action-btn.updating {
  @apply bg-muted text-muted-foreground cursor-not-allowed;
}

.action-btn.secondary {
  @apply border border-border hover:bg-accent;
}

.pricing-info {
  @apply ml-auto flex items-baseline gap-1;
}

.price {
  @apply text-2xl font-bold text-primary;
}

.currency {
  @apply text-sm text-muted-foreground;
}

.tab-nav {
  @apply flex border-b border-border px-6;
}

.tab-btn {
  @apply inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-muted transition-colors;
}

.tab-btn.active {
  @apply text-primary border-primary;
}

.tab-content {
  @apply flex-1 overflow-y-auto;
}

.tab-pane {
  @apply p-6;
}

.content-grid {
  @apply grid grid-cols-1 lg:grid-cols-3 gap-6;
}

.main-content {
  @apply lg:col-span-2 space-y-6;
}

.sidebar-content {
  @apply space-y-4;
}

.section-title {
  @apply text-lg font-semibold mb-3;
}

.screenshots {
  @apply mb-6;
}

.screenshot-gallery {
  @apply grid grid-cols-2 md:grid-cols-3 gap-3;
}

.screenshot-item {
  @apply aspect-video rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all;
}

.screenshot-item img {
  @apply w-full h-full object-cover;
}

.description-content {
  @apply prose prose-sm max-w-none;
}

.features-list {
  @apply space-y-2;
}

.features-list li {
  @apply flex items-center gap-2 text-sm;
}

.features-list li svg {
  @apply text-green-500 flex-shrink-0;
}

.changelog {
  @apply space-y-4;
}

.changelog-item {
  @apply border border-border rounded-lg p-4;
}

.changelog-header {
  @apply flex items-center justify-between mb-2;
}

.version {
  @apply font-semibold text-primary;
}

.date {
  @apply text-sm text-muted-foreground;
}

.changelog-changes {
  @apply space-y-1 text-sm;
}

.changelog-changes li {
  @apply list-disc list-inside text-muted-foreground;
}

.info-card {
  @apply bg-muted/50 border border-border rounded-lg p-4;
}

.info-title {
  @apply font-semibold mb-3;
}

.info-list {
  @apply space-y-2;
}

.info-list dt {
  @apply text-sm font-medium text-muted-foreground;
}

.info-list dd {
  @apply text-sm mb-2;
}

.author-link, .permissions-link {
  @apply text-primary hover:underline;
}

.platforms {
  @apply flex flex-wrap gap-1;
}

.platform-badge {
  @apply px-2 py-0.5 bg-background border border-border rounded text-xs;
}

.tags-container {
  @apply flex flex-wrap gap-1;
}

.tag-item {
  @apply px-2 py-1 bg-background border border-border rounded-md text-xs;
}

.links-list {
  @apply space-y-2;
}

.link-item {
  @apply flex items-center gap-2 text-sm text-primary hover:underline;
}

/* Dark mode adjustments */
.dark .badge.verified {
  @apply bg-green-900/50 text-green-400;
}

.dark .badge.featured {
  @apply bg-yellow-900/50 text-yellow-400;
}
</style>