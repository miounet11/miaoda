<template>
  <div
    :class="[
      'plugin-card',
      viewMode === 'list' ? 'list-card' : 'grid-card',
      { 'installing': plugin.status === 'updating' }
    ]"
    @click="$emit('click')"
  >
    <!-- Grid View -->
    <template v-if="viewMode === 'grid'">
      <!-- Plugin Header -->
      <div class="card-header">
        <div class="plugin-icon-container">
          <img
            v-if="plugin.icon"
            :src="plugin.icon"
            :alt="plugin.name"
            class="plugin-icon"
          />
          <Package v-else :size="32" class="plugin-icon-default" />
        </div>
        
        <div class="plugin-badges">
          <span v-if="plugin.verified" class="badge verified" title="认证插件">
            <Shield :size="12" />
          </span>
          <span v-if="plugin.featured" class="badge featured" title="推荐插件">
            <Sparkles :size="12" />
          </span>
          <span v-if="plugin.pricing === 'paid'" class="badge paid" title="付费插件">
            <DollarSign :size="12" />
          </span>
        </div>
      </div>

      <!-- Plugin Info -->
      <div class="card-content">
        <h3 class="plugin-name" :title="plugin.name">{{ plugin.name }}</h3>
        <p class="plugin-author">by {{ plugin.author }}</p>
        <p class="plugin-description">{{ plugin.shortDescription || plugin.description }}</p>
        
        <!-- Stats -->
        <div class="plugin-stats">
          <div class="stat-item">
            <Star :size="14" class="star-icon" />
            <span class="stat-value">{{ plugin.rating.toFixed(1) }}</span>
            <span class="stat-label">({{ formatNumber(plugin.reviewCount) }})</span>
          </div>
          <div class="stat-item">
            <Download :size="14" />
            <span class="stat-value">{{ formatNumber(plugin.downloads) }}</span>
          </div>
        </div>

        <!-- Tags -->
        <div class="plugin-tags">
          <span
            v-for="tag in plugin.tags.slice(0, 3)"
            :key="tag"
            class="tag"
          >
            {{ tag }}
          </span>
          <span v-if="plugin.tags.length > 3" class="tag-more">
            +{{ plugin.tags.length - 3 }}
          </span>
        </div>
      </div>

      <!-- Card Actions -->
      <div class="card-actions">
        <template v-if="plugin.status === 'installed'">
          <button @click.stop="$emit('uninstall', plugin)" class="action-btn uninstall">
            <Trash2 :size="16" />
            卸载
          </button>
        </template>
        <template v-else-if="plugin.status === 'updating'">
          <button class="action-btn updating" disabled>
            <Loader2 :size="16" class="animate-spin" />
            安装中...
          </button>
        </template>
        <template v-else>
          <button @click.stop="$emit('install', plugin)" class="action-btn install">
            <Download :size="16" />
            安装
          </button>
        </template>
        
        <button @click.stop="$emit('rate', plugin)" class="action-btn-secondary rate">
          <Star :size="16" />
        </button>
      </div>
    </template>

    <!-- List View -->
    <template v-else>
      <div class="list-content">
        <!-- Left Side -->
        <div class="list-left">
          <div class="plugin-icon-container">
            <img
              v-if="plugin.icon"
              :src="plugin.icon"
              :alt="plugin.name"
              class="plugin-icon"
            />
            <Package v-else :size="40" class="plugin-icon-default" />
          </div>
          
          <div class="plugin-info">
            <div class="info-header">
              <h3 class="plugin-name">{{ plugin.name }}</h3>
              <div class="plugin-badges">
                <span v-if="plugin.verified" class="badge verified">
                  <Shield :size="12" />
                </span>
                <span v-if="plugin.featured" class="badge featured">
                  <Sparkles :size="12" />
                </span>
                <span v-if="plugin.pricing === 'paid'" class="badge paid">
                  <DollarSign :size="12" />
                </span>
              </div>
            </div>
            
            <p class="plugin-author">by {{ plugin.author }}</p>
            <p class="plugin-description">{{ plugin.description }}</p>
            
            <div class="plugin-meta">
              <span class="version">v{{ plugin.version }}</span>
              <span class="separator">•</span>
              <span class="category">{{ plugin.category.name }}</span>
              <span class="separator">•</span>
              <span class="updated">{{ formatDate(plugin.lastUpdated) }}</span>
            </div>
          </div>
        </div>

        <!-- Right Side -->
        <div class="list-right">
          <div class="plugin-stats-horizontal">
            <div class="stat-item">
              <Star :size="16" class="star-icon" />
              <span class="stat-value">{{ plugin.rating.toFixed(1) }}</span>
              <span class="stat-label">({{ formatNumber(plugin.reviewCount) }})</span>
            </div>
            <div class="stat-item">
              <Download :size="16" />
              <span class="stat-value">{{ formatNumber(plugin.downloads) }}</span>
            </div>
          </div>
          
          <div class="list-actions">
            <template v-if="plugin.status === 'installed'">
              <button @click.stop="$emit('uninstall', plugin)" class="action-btn uninstall">
                <Trash2 :size="16" />
                卸载
              </button>
            </template>
            <template v-else-if="plugin.status === 'updating'">
              <button class="action-btn updating" disabled>
                <Loader2 :size="16" class="animate-spin" />
                安装中...
              </button>
            </template>
            <template v-else>
              <button @click.stop="$emit('install', plugin)" class="action-btn install">
                <Download :size="16" />
                安装
              </button>
            </template>
            
            <button @click.stop="$emit('rate', plugin)" class="action-btn-secondary rate">
              <Star :size="16" />
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Installing Overlay -->
    <div v-if="plugin.status === 'updating'" class="installing-overlay">
      <div class="installing-content">
        <Loader2 :size="24" class="animate-spin" />
        <span>正在安装...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Package, Shield, Sparkles, DollarSign, Star, Download,
  Trash2, Loader2
} from 'lucide-vue-next'

import type { PluginMarketListing } from '../../types/plugins'

interface Props {
  plugin: PluginMarketListing
  viewMode: 'grid' | 'list'
}

defineProps<Props>()

defineEmits<{
  click: []
  install: [plugin: PluginMarketListing]
  uninstall: [plugin: PluginMarketListing]
  rate: [plugin: PluginMarketListing]
}>()

// Utility functions
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`
  return `${Math.floor(diffDays / 365)}年前`
}
</script>

<style scoped>
.plugin-card {
  @apply relative bg-card border border-border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary;
}

.plugin-card.installing {
  @apply pointer-events-none;
}

/* Grid View Styles */
.grid-card {
  @apply flex flex-col;
}

.card-header {
  @apply flex items-start justify-between p-4 pb-2;
}

.plugin-icon-container {
  @apply w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden;
}

.plugin-icon {
  @apply w-full h-full object-cover;
}

.plugin-icon-default {
  @apply text-muted-foreground;
}

.plugin-badges {
  @apply flex gap-1;
}

.badge {
  @apply inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium;
}

.badge.verified {
  @apply bg-green-100 text-green-700;
}

.badge.featured {
  @apply bg-yellow-100 text-yellow-700;
}

.badge.paid {
  @apply bg-blue-100 text-blue-700;
}

.card-content {
  @apply flex-1 px-4 pb-4;
}

.plugin-name {
  @apply font-semibold text-foreground mb-1 truncate;
}

.plugin-author {
  @apply text-sm text-muted-foreground mb-2;
}

.plugin-description {
  @apply text-sm text-muted-foreground mb-3 line-clamp-2;
}

.plugin-stats {
  @apply flex items-center gap-4 mb-3 text-sm;
}

.stat-item {
  @apply flex items-center gap-1 text-muted-foreground;
}

.star-icon {
  @apply text-yellow-500;
}

.stat-value {
  @apply font-medium text-foreground;
}

.stat-label {
  @apply text-muted-foreground;
}

.plugin-tags {
  @apply flex flex-wrap gap-1 mb-3;
}

.tag {
  @apply px-2 py-1 bg-muted text-xs rounded;
}

.tag-more {
  @apply px-2 py-1 bg-muted/50 text-xs rounded text-muted-foreground;
}

.card-actions {
  @apply flex gap-2 p-4 pt-0;
}

.action-btn {
  @apply flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors;
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

.action-btn-secondary {
  @apply inline-flex items-center justify-center px-2 py-2 border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors;
}

/* List View Styles */
.list-card {
  @apply p-4;
}

.list-content {
  @apply flex items-center justify-between gap-4;
}

.list-left {
  @apply flex items-center gap-4 flex-1 min-w-0;
}

.list-left .plugin-icon-container {
  @apply w-16 h-16;
}

.plugin-info {
  @apply flex-1 min-w-0;
}

.info-header {
  @apply flex items-center gap-2 mb-1;
}

.list-left .plugin-name {
  @apply text-lg;
}

.plugin-meta {
  @apply flex items-center gap-2 text-sm text-muted-foreground mt-2;
}

.separator {
  @apply text-muted-foreground/50;
}

.list-right {
  @apply flex items-center gap-4;
}

.plugin-stats-horizontal {
  @apply flex items-center gap-4;
}

.list-actions {
  @apply flex gap-2;
}

.list-actions .action-btn {
  @apply flex-none px-4;
}

/* Installing Overlay */
.installing-overlay {
  @apply absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center;
}

.installing-content {
  @apply flex items-center gap-2 text-sm font-medium;
}

/* Dark mode adjustments */
.dark .badge.verified {
  @apply bg-green-900/50 text-green-400;
}

.dark .badge.featured {
  @apply bg-yellow-900/50 text-yellow-400;
}

.dark .badge.paid {
  @apply bg-blue-900/50 text-blue-400;
}
</style>