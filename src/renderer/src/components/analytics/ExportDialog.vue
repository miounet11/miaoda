<template>
  <div class="export-dialog-overlay" @click="handleOverlayClick">
    <div class="export-dialog" @click.stop>
      <div class="dialog-header">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Export Analytics</h3>
        <button @click="$emit('close')" class="close-btn">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="dialog-content">
        <!-- Format Selection -->
        <div class="form-group">
          <label class="form-label">Export Format</label>
          <div class="format-options">
            <div
              v-for="format in formatOptions"
              :key="format.value"
              class="format-option"
              :class="{
                selected: exportConfig.format === format.value,
                disabled: format.disabled
              }"
              @click="selectFormat(format.value)"
            >
              <div class="format-icon">
                <component :is="getFormatIcon(format.value)" class="w-6 h-6" />
              </div>
              <div class="format-info">
                <div class="format-name">{{ format.label }}</div>
                <div class="format-desc">{{ format.description }}</div>
                <div v-if="format.disabled" class="format-disabled">Coming Soon</div>
              </div>
              <div class="format-check" v-if="exportConfig.format === format.value">
                <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Time Range -->
        <div class="form-group">
          <label class="form-label">Time Range</label>
          <select v-model="exportConfig.timeRange" class="form-select">
            <option v-for="option in timeRangeOptions" :key="option.value" :value="option.value">
              {{ option.label }} - {{ option.description }}
            </option>
          </select>
        </div>

        <!-- Include Charts -->
        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="exportConfig.includeCharts"
              :disabled="!supportsCharts"
              class="checkbox"
            />
            <span class="checkbox-text">
              Include Charts
              <span v-if="!supportsCharts" class="text-xs text-gray-500">
                (Not supported for {{ exportConfig.format.toUpperCase() }})
              </span>
            </span>
          </label>
        </div>

        <!-- Sections to Include -->
        <div class="form-group">
          <label class="form-label">Sections to Include</label>
          <div class="sections-list">
            <label v-for="section in availableSections" :key="section.id" class="section-checkbox">
              <input
                type="checkbox"
                :value="section.id"
                v-model="exportConfig.sections"
                class="checkbox"
              />
              <span class="checkbox-text">
                {{ section.name }}
                <span class="text-xs text-gray-500">{{ section.description }}</span>
              </span>
            </label>
          </div>
        </div>

        <!-- Export Preview -->
        <div class="export-preview">
          <h4 class="preview-title">Export Preview</h4>
          <div class="preview-content">
            <div class="preview-item">
              <span class="preview-label">Format:</span>
              <span class="preview-value">{{ getFormatLabel(exportConfig.format) }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">Time Range:</span>
              <span class="preview-value">{{ getTimeRangeLabel(exportConfig.timeRange) }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">Sections:</span>
              <span class="preview-value">{{ exportConfig.sections.length }} selected</span>
            </div>
            <div class="preview-item" v-if="supportsCharts">
              <span class="preview-label">Charts:</span>
              <span class="preview-value">{{
                exportConfig.includeCharts ? 'Included' : 'Excluded'
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button @click="$emit('close')" class="cancel-btn">Cancel</button>
        <button @click="handleExport" :disabled="!canExport || exporting" class="export-btn">
          <svg v-if="exporting" class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {{ exporting ? 'Exporting...' : 'Export Analytics' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import type { TimeRange, AnalyticsExportConfig } from '../../types'

interface Props {
  timeRange: TimeRange
}

const props = defineProps<Props>()

const emit = defineEmits<{
  export: [config: AnalyticsExportConfig]
  close: []
}>()

// State
const exporting = ref(false)
const exportConfig = ref<AnalyticsExportConfig>({
  format: 'json',
  timeRange: props.timeRange,
  includeCharts: false,
  sections: ['overview', 'usage', 'models', 'content', 'performance']
})

// Format options
const formatOptions = [
  {
    value: 'json',
    label: 'JSON',
    description: 'Raw data in JSON format',
    disabled: false
  },
  {
    value: 'csv',
    label: 'CSV',
    description: 'Comma-separated values for spreadsheets',
    disabled: false
  },
  {
    value: 'pdf',
    label: 'PDF',
    description: 'Formatted report with charts',
    disabled: true
  },
  {
    value: 'xlsx',
    label: 'Excel',
    description: 'Excel workbook with multiple sheets',
    disabled: true
  }
]

// Time range options
const timeRangeOptions = [
  { value: '24h', label: '24 Hours', description: 'Last 24 hours' },
  { value: '7d', label: '7 Days', description: 'Last week' },
  { value: '30d', label: '30 Days', description: 'Last month' },
  { value: '90d', label: '90 Days', description: 'Last 3 months' },
  { value: '1y', label: '1 Year', description: 'Last 12 months' },
  { value: 'all', label: 'All Time', description: 'All available data' }
]

// Available sections
const availableSections = [
  {
    id: 'overview',
    name: 'Overview Stats',
    description: 'Basic chat and message statistics'
  },
  {
    id: 'usage',
    name: 'Usage Patterns',
    description: 'Daily activity and trends'
  },
  {
    id: 'models',
    name: 'Model Usage',
    description: 'AI model distribution and performance'
  },
  {
    id: 'content',
    name: 'Content Analysis',
    description: 'Keywords and message analysis'
  },
  {
    id: 'performance',
    name: 'Performance Metrics',
    description: 'Error rates and response times'
  }
]

// Computed
const supportsCharts = computed(() => {
  return ['pdf'].includes(exportConfig.value.format)
})

const canExport = computed(() => {
  return (
    exportConfig.value.sections.length > 0 &&
    !formatOptions.find(f => f.value === exportConfig.value.format)?.disabled
  )
})

// Methods
function selectFormat(format: string) {
  const option = formatOptions.find(f => f.value === format)
  if (!option?.disabled) {
    exportConfig.value.format = format as any
    if (!supportsCharts.value) {
      exportConfig.value.includeCharts = false
    }
  }
}

function getFormatIcon(format: string) {
  const icons = {
    json: () =>
      h(
        'svg',
        {
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          class: 'w-6 h-6'
        },
        [
          h('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            d: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
          })
        ]
      ),
    csv: () =>
      h(
        'svg',
        {
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          class: 'w-6 h-6'
        },
        [
          h('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            d: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z'
          }),
          h('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            d: 'M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2'
          })
        ]
      ),
    pdf: () =>
      h(
        'svg',
        {
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          class: 'w-6 h-6'
        },
        [
          h('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            d: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707L13.293 3.293A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
          })
        ]
      ),
    xlsx: () =>
      h(
        'svg',
        {
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          class: 'w-6 h-6'
        },
        [
          h('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
          })
        ]
      )
  }
  return icons[format] || icons.json
}

function getFormatLabel(format: string): string {
  return formatOptions.find(f => f.value === format)?.label || format.toUpperCase()
}

function getTimeRangeLabel(timeRange: TimeRange): string {
  return timeRangeOptions.find(t => t.value === timeRange)?.label || timeRange
}

async function handleExport() {
  exporting.value = true
  try {
    emit('export', exportConfig.value)
  } finally {
    exporting.value = false
  }
}

function handleOverlayClick() {
  emit('close')
}
</script>

<style scoped>
.export-dialog-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4;
}

.export-dialog {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto;
}

.dialog-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700;
}

.close-btn {
  @apply p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors;
}

.dialog-content {
  @apply p-6 space-y-6;
}

.form-group {
  @apply space-y-3;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-select {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.format-options {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-3;
}

.format-option {
  @apply flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer transition-all hover:border-blue-300 dark:hover:border-blue-500;
}

.format-option.selected {
  @apply border-blue-500 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20;
}

.format-option.disabled {
  @apply opacity-50 cursor-not-allowed;
}

.format-icon {
  @apply text-gray-500 dark:text-gray-400 mr-3;
}

.format-info {
  @apply flex-1;
}

.format-name {
  @apply font-medium text-gray-900 dark:text-gray-100;
}

.format-desc {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.format-disabled {
  @apply text-xs text-orange-600 dark:text-orange-400 font-medium;
}

.format-check {
  @apply ml-2;
}

.checkbox-label {
  @apply flex items-center;
}

.checkbox {
  @apply mr-3;
}

.checkbox-text {
  @apply text-sm text-gray-700 dark:text-gray-300;
}

.sections-list {
  @apply space-y-2;
}

.section-checkbox {
  @apply flex items-start;
}

.export-preview {
  @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-4;
}

.preview-title {
  @apply font-medium text-gray-900 dark:text-gray-100 mb-3;
}

.preview-content {
  @apply space-y-2;
}

.preview-item {
  @apply flex justify-between items-center text-sm;
}

.preview-label {
  @apply text-gray-600 dark:text-gray-400;
}

.preview-value {
  @apply font-medium text-gray-900 dark:text-gray-100;
}

.dialog-footer {
  @apply flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700;
}

.cancel-btn {
  @apply px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors;
}

.export-btn {
  @apply px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center;
}
</style>
