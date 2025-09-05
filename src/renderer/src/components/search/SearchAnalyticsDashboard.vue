<template>
  <div class="search-analytics-dashboard">
    <!-- Dashboard Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <h2 class="dashboard-title">
          <BarChart3 :size="24" />
          Search Analytics
        </h2>
        <p class="dashboard-subtitle">Monitor search performance and user behavior</p>
      </div>

      <div class="header-actions">
        <div class="time-range-selector">
          <select v-model="selectedTimeRange" @change="refreshData" class="time-select">
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>

        <button @click="refreshData" class="refresh-button" :disabled="isLoading" aria-label="按钮">
          <component
            :is="isLoading ? Loader2 : RefreshCw"
            :size="16"
            :class="{ 'animate-spin': isLoading }"
          />
          Refresh
        </button>

        <button @click="exportAnalytics" class="export-button" aria-label="按钮">
          <Download :size="16" />
          Export
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <Loader2 :size="32" class="animate-spin" />
      <p>Loading analytics data...</p>
    </div>

    <!-- Analytics Content -->
    <div v-else class="analytics-content">
      <!-- Key Metrics -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <Search :size="20" />
            <span class="metric-label">Total Searches</span>
          </div>
          <div class="metric-value">{{ formatNumber(analytics.totalSearches) }}</div>
          <div class="metric-change" :class="getChangeClass(analytics.searchGrowth)">
            <component :is="analytics.searchGrowth >= 0 ? TrendingUp : TrendingDown" :size="16" />
            {{ Math.abs(analytics.searchGrowth) }}% vs last period
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <Clock :size="20" />
            <span class="metric-label">Avg Search Time</span>
          </div>
          <div class="metric-value">{{ analytics.avgSearchTime }}ms</div>
          <div class="metric-change" :class="getChangeClass(-analytics.searchTimeChange)">
            <component
              :is="analytics.searchTimeChange <= 0 ? TrendingUp : TrendingDown"
              :size="16"
            />
            {{ Math.abs(analytics.searchTimeChange) }}% vs last period
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <Target :size="20" />
            <span class="metric-label">Cache Hit Rate</span>
          </div>
          <div class="metric-value">{{ analytics.cacheHitRate }}%</div>
          <div class="metric-change" :class="getChangeClass(analytics.cacheHitChange)">
            <component :is="analytics.cacheHitChange >= 0 ? TrendingUp : TrendingDown" :size="16" />
            {{ Math.abs(analytics.cacheHitChange) }}% vs last period
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <Brain :size="20" />
            <span class="metric-label">Semantic Searches</span>
          </div>
          <div class="metric-value">{{ formatNumber(analytics.semanticSearches) }}</div>
          <div class="metric-change" :class="getChangeClass(analytics.semanticGrowth)">
            <component :is="analytics.semanticGrowth >= 0 ? TrendingUp : TrendingDown" :size="16" />
            {{ Math.abs(analytics.semanticGrowth) }}% vs last period
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <!-- Search Volume Over Time -->
        <div class="chart-container">
          <div class="chart-header">
            <h3 class="chart-title">Search Volume Over Time</h3>
            <div class="chart-legend">
              <div class="legend-item">
                <div class="legend-color" style="background-color: #3b82f6" />
                <span>Total Searches</span>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #10b981" />
                <span>Semantic Searches</span>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #f59e0b" />
                <span>Cached Results</span>
              </div>
            </div>
          </div>
          <div class="chart-content">
            <SearchVolumeChart :data="analytics.volumeData" :height="300" />
          </div>
        </div>

        <!-- Performance Metrics -->
        <div class="chart-container">
          <div class="chart-header">
            <h3 class="chart-title">Search Performance</h3>
            <div class="performance-tabs">
              <button
                v-for="tab in performanceTabs"
                :key="tab.id"
                @click="selectedPerformanceTab = tab.id"
                class="tab-button"
                :class="{ active: selectedPerformanceTab === tab.id }"
                aria-label="按钮"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>
          <div class="chart-content">
            <PerformanceChart
              :data="getPerformanceData()"
              :metric="selectedPerformanceTab"
              :height="300"
            />
          </div>
        </div>
      </div>

      <!-- Search Patterns Analysis -->
      <div class="patterns-section">
        <div class="section-header">
          <h3 class="section-title">
            <TrendingUp :size="20" />
            Search Patterns & Insights
          </h3>
        </div>

        <div class="patterns-grid">
          <!-- Popular Queries -->
          <div class="pattern-card">
            <h4 class="pattern-title">Most Popular Queries</h4>
            <div class="query-list">
              <div
                v-for="(query, index) in analytics.popularQueries"
                :key="index"
                class="query-item"
              >
                <div class="query-text">{{ query.text }}</div>
                <div class="query-stats">
                  <span class="query-count">{{ query.count }} searches</span>
                  <span class="query-avg-time">{{ query.avgTime }}ms avg</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Search Types Distribution -->
          <div class="pattern-card">
            <h4 class="pattern-title">Search Types</h4>
            <div class="search-types">
              <div v-for="type in analytics.searchTypes" :key="type.name" class="type-item">
                <div class="type-info">
                  <component :is="getSearchTypeIcon(type.name)" :size="16" />
                  <span class="type-name">{{ formatSearchType(type.name) }}</span>
                </div>
                <div class="type-stats">
                  <div class="type-bar">
                    <div
                      class="type-fill"
                      :style="{ width: `${(type.count / analytics.totalSearches) * 100}%` }"
                      :class="`fill-${type.name}`"
                    />
                  </div>
                  <span class="type-percentage"
                    >{{ Math.round((type.count / analytics.totalSearches) * 100) }}%</span
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Performance Bottlenecks -->
          <div class="pattern-card">
            <h4 class="pattern-title">Performance Bottlenecks</h4>
            <div class="bottlenecks-list">
              <div
                v-for="bottleneck in analytics.bottlenecks"
                :key="bottleneck.phase"
                class="bottleneck-item"
              >
                <div class="bottleneck-info">
                  <div class="bottleneck-phase">{{ formatPhase(bottleneck.phase) }}</div>
                  <div class="bottleneck-impact">
                    {{ (bottleneck.impact * 100).toFixed(1) }}% of search time
                  </div>
                </div>
                <div class="bottleneck-time">{{ bottleneck.avgTime.toFixed(0) }}ms</div>
              </div>
            </div>
          </div>

          <!-- Search Quality Metrics -->
          <div class="pattern-card">
            <h4 class="pattern-title">Search Quality</h4>
            <div class="quality-metrics">
              <div class="quality-item">
                <div class="quality-label">
                  <Target :size="16" />
                  Result Relevance
                </div>
                <div class="quality-score" :class="getQualityClass(analytics.resultRelevance)">
                  {{ analytics.resultRelevance }}%
                </div>
              </div>

              <div class="quality-item">
                <div class="quality-label">
                  <Users :size="16" />
                  User Satisfaction
                </div>
                <div class="quality-score" :class="getQualityClass(analytics.userSatisfaction)">
                  {{ analytics.userSatisfaction }}%
                </div>
              </div>

              <div class="quality-item">
                <div class="quality-label">
                  <Zap :size="16" />
                  Query Success Rate
                </div>
                <div class="quality-score" :class="getQualityClass(analytics.querySuccessRate)">
                  {{ analytics.querySuccessRate }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="recommendations-section">
        <div class="section-header">
          <h3 class="section-title">
            <Lightbulb :size="20" />
            Optimization Recommendations
          </h3>
        </div>

        <div class="recommendations-list">
          <div
            v-for="rec in recommendations"
            :key="rec.id"
            class="recommendation-item"
            :class="`severity-${rec.severity}`"
          >
            <div class="rec-icon">
              <component :is="getRecommendationIcon(rec.type)" :size="20" />
            </div>

            <div class="rec-content">
              <div class="rec-header">
                <h4 class="rec-title">{{ rec.title }}</h4>
                <span class="rec-severity" :class="`severity-${rec.severity}`">
                  {{ rec.severity.toUpperCase() }}
                </span>
              </div>

              <p class="rec-description">{{ rec.description }}</p>

              <div class="rec-impact"><strong>Expected Impact:</strong> {{ rec.impact }}</div>
            </div>

            <div class="rec-actions">
              <button @click="applyRecommendation(rec)" class="rec-apply-btn" aria-label="按钮">
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import {
  BarChart3,
  Search,
  Clock,
  Target,
  Brain,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Loader2,
  Lightbulb,
  Users,
  Zap,
  Database,
  FileText,
  Image,
  Volume2
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import SearchVolumeChart from './charts/SearchVolumeChart.vue'
import PerformanceChart from './charts/PerformanceChart.vue'
import { backendSearchService } from '@renderer/src/services/search/BackendSearchService'

// Composables
const { t } = useI18n()

// Refs
const isLoading = ref(true)
const selectedTimeRange = ref('7d')
const selectedPerformanceTab = ref('response_time')

// Analytics data
const analytics = reactive({
  totalSearches: 0,
  searchGrowth: 0,
  avgSearchTime: 0,
  searchTimeChange: 0,
  cacheHitRate: 0,
  cacheHitChange: 0,
  semanticSearches: 0,
  semanticGrowth: 0,
  resultRelevance: 0,
  userSatisfaction: 0,
  querySuccessRate: 0,
  volumeData: [],
  performanceData: {},
  popularQueries: [],
  searchTypes: [],
  bottlenecks: []
})

const recommendations = ref<
  Array<{
    id: string
    type: 'indexing' | 'caching' | 'query' | 'hardware'
    severity: 'low' | 'medium' | 'high'
    title: string
    description: string
    impact: string
  }>
>([])

// Computed
const performanceTabs = computed(() => [
  { id: 'response_time', label: 'Response Time' },
  { id: 'throughput', label: 'Throughput' },
  { id: 'error_rate', label: 'Error Rate' },
  { id: 'cache_performance', label: 'Cache Performance' }
])

// Methods
const refreshData = async () => {
  isLoading.value = true

  try {
    // Fetch analytics data from backend
    const [searchStats, performanceAnalysis, searchRecommendations] = await Promise.all([
      fetchSearchStats(),
      fetchPerformanceAnalysis(),
      fetchRecommendations()
    ])

    updateAnalyticsData(searchStats, performanceAnalysis)
    recommendations.value = searchRecommendations
  } catch (error) {
    console.error('Failed to load analytics data:', error)
  } finally {
    isLoading.value = false
  }
}

const fetchSearchStats = async () => {
  // This would call backend API for search statistics
  // Mock data for demonstration
  return {
    totalSearches: 1250,
    searchGrowth: 15.3,
    avgSearchTime: 245,
    searchTimeChange: -8.2,
    cacheHitRate: 72,
    cacheHitChange: 5.1,
    semanticSearches: 387,
    semanticGrowth: 23.8,
    resultRelevance: 87,
    userSatisfaction: 84,
    querySuccessRate: 92,
    volumeData: generateMockVolumeData(),
    performanceData: generateMockPerformanceData(),
    popularQueries: [
      { text: 'error handling', count: 45, avgTime: 189 },
      { text: 'authentication', count: 38, avgTime: 256 },
      { text: 'database query', count: 32, avgTime: 312 }
    ],
    searchTypes: [
      { name: 'lexical', count: 863 },
      { name: 'semantic', count: 387 },
      { name: 'hybrid', count: 156 }
    ],
    bottlenecks: [
      { phase: 'vectorSearch', avgTime: 85, impact: 0.35 },
      { phase: 'indexLookup', avgTime: 52, impact: 0.21 },
      { phase: 'resultFormatting', avgTime: 38, impact: 0.15 }
    ]
  }
}

const fetchPerformanceAnalysis = async () => {
  // This would fetch performance analysis from backend
  return {}
}

const fetchRecommendations = async () => {
  // Mock recommendations
  return [
    {
      id: '1',
      type: 'indexing',
      severity: 'high',
      title: 'Optimize Vector Index',
      description: 'Vector search is taking 85ms on average. Consider rebuilding the index.',
      impact: 'Reduce search time by ~30%'
    },
    {
      id: '2',
      type: 'caching',
      severity: 'medium',
      title: 'Improve Cache Strategy',
      description: 'Cache hit rate is 72%. Implement smarter caching for popular queries.',
      impact: 'Increase cache hit rate to 85%+'
    }
  ]
}

const updateAnalyticsData = (stats: any, performance: any) => {
  Object.assign(analytics, stats)
}

const generateMockVolumeData = () => {
  const data = []
  const now = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    data.push({
      date: date.toISOString().split('T')[0],
      total: Math.floor(Math.random() * 100) + 20,
      semantic: Math.floor(Math.random() * 40) + 5,
      cached: Math.floor(Math.random() * 60) + 10
    })
  }

  return data
}

const generateMockPerformanceData = () => {
  return {
    response_time: generateTimeSeriesData(200, 400),
    throughput: generateTimeSeriesData(50, 150),
    error_rate: generateTimeSeriesData(0.5, 2),
    cache_performance: generateTimeSeriesData(60, 90)
  }
}

const generateTimeSeriesData = (min: number, max: number) => {
  const data = []
  const now = new Date()

  for (let i = 23; i >= 0; i--) {
    const date = new Date(now)
    date.setHours(date.getHours() - i)

    data.push({
      timestamp: date.toISOString(),
      value: Math.floor(Math.random() * (max - min)) + min
    })
  }

  return data
}

const getPerformanceData = () => {
  return analytics.performanceData[selectedPerformanceTab.value] || []
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const getChangeClass = (change: number): string => {
  return change >= 0 ? 'positive-change' : 'negative-change'
}

const getSearchTypeIcon = (type: string) => {
  switch (type) {
    case 'semantic':
      return Brain
    case 'hybrid':
      return Zap
    default:
      return Search
  }
}

const formatSearchType = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

const formatPhase = (phase: string): string => {
  return phase.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}

const getQualityClass = (score: number): string => {
  if (score >= 85) return 'quality-excellent'
  if (score >= 70) return 'quality-good'
  if (score >= 50) return 'quality-fair'
  return 'quality-poor'
}

const getRecommendationIcon = (type: string) => {
  switch (type) {
    case 'indexing':
      return Database
    case 'caching':
      return Zap
    case 'query':
      return Search
    case 'hardware':
      return TrendingUp
    default:
      return Lightbulb
  }
}

const exportAnalytics = () => {
  // Implement analytics export
  console.log('Exporting analytics data...')
}

const applyRecommendation = (rec: any) => {
  // Implement recommendation application
  console.log('Applying recommendation:', rec.title)
}

// Lifecycle
onMounted(() => {
  refreshData()

  // Set up auto-refresh
  const interval = setInterval(refreshData, 5 * 60 * 1000) // 5 minutes

  onUnmounted(() => {
    clearInterval(interval)
  })
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
.container-sm {
  max-width: var(--breakpoint-sm);
}
.container-md {
  max-width: var(--breakpoint-md);
}
.container-lg {
  max-width: var(--breakpoint-lg);
}
.container-xl {
  max-width: var(--breakpoint-xl);
}

/* 响应式显示 */
.hidden-sm {
  display: none;
}
.hidden-md {
  display: none;
}
.hidden-lg {
  display: none;
}

@media (min-width: 640px) {
  .hidden-sm {
    display: block;
  }
}

@media (min-width: 768px) {
  .hidden-md {
    display: block;
  }
}

@media (min-width: 1024px) {
  .hidden-lg {
    display: block;
  }
}

/* 响应式文本 */
.text-responsive-sm {
  font-size: clamp(0.875rem, 2vw, 1rem);
}
.text-responsive-base {
  font-size: clamp(1rem, 2.5vw, 1.125rem);
}
.text-responsive-lg {
  font-size: clamp(1.125rem, 3vw, 1.25rem);
}
.text-responsive-xl {
  font-size: clamp(1.25rem, 3.5vw, 1.5rem);
}

/* 响应式间距 */
.space-responsive-sm {
  gap: clamp(0.5rem, 2vw, 1rem);
}
.space-responsive-md {
  gap: clamp(1rem, 3vw, 1.5rem);
}
.space-responsive-lg {
  gap: clamp(1.5rem, 4vw, 2rem);
}

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
  .flex-col-mobile {
    flex-direction: column;
  }
  .grid-1-mobile {
    grid-template-columns: 1fr;
  }
  .gap-2-mobile {
    gap: var(--space-2);
  }
  .p-4-mobile {
    padding: var(--space-4);
  }
}

@media (max-width: 768px) {
  .flex-col-tablet {
    flex-direction: column;
  }
  .grid-2-tablet {
    grid-template-columns: repeat(2, 1fr);
  }
  .gap-4-tablet {
    gap: var(--space-4);
  }
  .p-6-tablet {
    padding: var(--space-6);
  }
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

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}
.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}
.grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

.grid-gap-2 {
  gap: var(--space-2);
}
.grid-gap-4 {
  gap: var(--space-4);
}
.grid-gap-6 {
  gap: var(--space-6);
}

/* 🎨 卡片布局 */
.card {
  background: white;
  border-radius: 12px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.card:hover {
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.card-interactive:hover {
  cursor: pointer;
  transform: translateY(-2px);
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.15),
    0 4px 10px rgba(0, 0, 0, 0.1);
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

  .hidden-mobile {
    display: none;
  }
  .flex-mobile-col {
    flex-direction: column;
  }
  .grid-mobile-1 {
    grid-template-columns: 1fr;
  }
}

/* 🎨 完整间距系统 - 基于4px网格 */
:root {
  --space-0: 0;
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
  --space-20: 5rem; /* 80px */
  --space-24: 6rem; /* 96px */
  --space-32: 8rem; /* 128px */

  /* 负间距 */
  --space-neg-1: -0.25rem;
  --space-neg-2: -0.5rem;
  --space-neg-4: -1rem;
}

/* 🎨 间距实用类 */
.m-1 {
  margin: var(--space-1);
}
.m-2 {
  margin: var(--space-2);
}
.m-3 {
  margin: var(--space-3);
}
.m-4 {
  margin: var(--space-4);
}
.m-6 {
  margin: var(--space-6);
}
.m-8 {
  margin: var(--space-8);
}

.p-1 {
  padding: var(--space-1);
}
.p-2 {
  padding: var(--space-2);
}
.p-3 {
  padding: var(--space-3);
}
.p-4 {
  padding: var(--space-4);
}
.p-6 {
  padding: var(--space-6);
}
.p-8 {
  padding: var(--space-8);
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.my-auto {
  margin-top: auto;
  margin-bottom: auto;
}

.px-1 {
  padding-left: var(--space-1);
  padding-right: var(--space-1);
}
.px-2 {
  padding-left: var(--space-2);
  padding-right: var(--space-2);
}
.px-3 {
  padding-left: var(--space-3);
  padding-right: var(--space-3);
}
.px-4 {
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}
.px-6 {
  padding-left: var(--space-6);
  padding-right: var(--space-6);
}

.py-1 {
  padding-top: var(--space-1);
  padding-bottom: var(--space-1);
}
.py-2 {
  padding-top: var(--space-2);
  padding-bottom: var(--space-2);
}
.py-3 {
  padding-top: var(--space-3);
  padding-bottom: var(--space-3);
}
.py-4 {
  padding-top: var(--space-4);
  padding-bottom: var(--space-4);
}
.py-6 {
  padding-top: var(--space-6);
  padding-bottom: var(--space-6);
}

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

.stack-sm > * + * {
  margin-top: var(--space-2);
}
.stack-md > * + * {
  margin-top: var(--space-4);
}
.stack-lg > * + * {
  margin-top: var(--space-6);
}
.stack-xl > * + * {
  margin-top: var(--space-8);
}

.inline-sm > * + * {
  margin-left: var(--space-2);
}
.inline-md > * + * {
  margin-left: var(--space-4);
}
.inline-lg > * + * {
  margin-left: var(--space-6);
}

/* 🎨 完整字体系统 */
:root {
  /* 字体族 */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;

  /* 字体大小 - 基于1.25的倍数比例 */
  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-base: 1rem; /* 16px */
  --font-size-lg: 1.125rem; /* 18px */
  --font-size-xl: 1.25rem; /* 20px */
  --font-size-2xl: 1.5rem; /* 24px */
  --font-size-3xl: 1.875rem; /* 30px */
  --font-size-4xl: 2.25rem; /* 36px */
  --font-size-5xl: 3rem; /* 48px */

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
.font-sans {
  font-family: var(--font-family-sans);
}
.font-mono {
  font-family: var(--font-family-mono);
}

.text-xs {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-tight);
}
.text-sm {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-snug);
}
.text-base {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
}
.text-lg {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
}
.text-xl {
  font-size: var(--font-size-xl);
  line-height: var(--line-height-relaxed);
}
.text-2xl {
  font-size: var(--font-size-2xl);
  line-height: var(--line-height-loose);
}
.text-3xl {
  font-size: var(--font-size-3xl);
  line-height: var(--line-height-loose);
}

.font-thin {
  font-weight: var(--font-weight-thin);
}
.font-light {
  font-weight: var(--font-weight-light);
}
.font-normal {
  font-weight: var(--font-weight-normal);
}
.font-medium {
  font-weight: var(--font-weight-medium);
}
.font-semibold {
  font-weight: var(--font-weight-semibold);
}
.font-bold {
  font-weight: var(--font-weight-bold);
}

.leading-tight {
  line-height: var(--line-height-tight);
}
.leading-snug {
  line-height: var(--line-height-snug);
}
.leading-normal {
  line-height: var(--line-height-normal);
}
.leading-relaxed {
  line-height: var(--line-height-relaxed);
}

.tracking-tight {
  letter-spacing: var(--letter-spacing-tight);
}
.tracking-normal {
  letter-spacing: var(--letter-spacing-normal);
}
.tracking-wide {
  letter-spacing: var(--letter-spacing-wide);
}

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
.text-primary {
  color: var(--color-primary);
}
.text-success {
  color: var(--color-success);
}
.text-warning {
  color: var(--color-warning);
}
.text-error {
  color: var(--color-error);
}
.text-gray-500 {
  color: var(--color-gray-500);
}
.text-gray-600 {
  color: var(--color-gray-600);
}
.text-gray-700 {
  color: var(--color-gray-700);
}

.bg-primary {
  background-color: var(--color-primary);
}
.bg-primary-hover:hover {
  background-color: var(--color-primary-hover);
}
.bg-success {
  background-color: var(--color-success);
}
.bg-warning {
  background-color: var(--color-warning);
}
.bg-error {
  background-color: var(--color-error);
}

.border-primary {
  border-color: var(--color-primary);
}
.border-success {
  border-color: var(--color-success);
}
.border-error {
  border-color: var(--color-error);
}

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
.search-analytics-dashboard {
  @apply max-w-7xl mx-auto p-6 space-y-8;
}

.dashboard-header {
  @apply flex items-center justify-between pb-6 border-b border-border;
}

.header-content h2 {
  @apply flex items-center gap-3 text-2xl font-bold;
}

.dashboard-subtitle {
  @apply text-muted-foreground mt-1;
}

.header-actions {
  @apply flex items-center gap-3;
}

.time-select {
  @apply px-3 py-2 border border-border rounded bg-background;
}

.refresh-button,
.export-button {
  @apply flex items-center gap-2 px-4 py-2 border border-border rounded
         hover:bg-accent transition-colors disabled:opacity-50;
}

.loading-state {
  @apply flex flex-col items-center justify-center py-16 text-center;
}

.loading-state p {
  @apply mt-4 text-muted-foreground;
}

.metrics-grid {
  @apply grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6;
}

.metric-card {
  @apply bg-card border border-border rounded-lg p-6;
}

.metric-header {
  @apply flex items-center gap-3 mb-4;
}

.metric-label {
  @apply text-sm font-medium text-muted-foreground;
}

.metric-value {
  @apply text-3xl font-bold mb-2;
}

.metric-change {
  @apply flex items-center gap-1 text-sm;
}

.positive-change {
  @apply text-green-600 dark:text-green-400;
}

.negative-change {
  @apply text-red-600 dark:text-red-400;
}

.charts-section {
  @apply grid grid-cols-1 xl:grid-cols-2 gap-8;
}

.chart-container {
  @apply bg-card border border-border rounded-lg p-6;
}

.chart-header {
  @apply flex items-center justify-between mb-6;
}

.chart-title {
  @apply text-lg font-semibold;
}

.chart-legend {
  @apply flex items-center gap-4;
}

.legend-item {
  @apply flex items-center gap-2 text-sm;
}

.legend-color {
  @apply w-3 h-3 rounded-full;
}

.performance-tabs {
  @apply flex items-center gap-1 p-1 bg-muted rounded;
}

.tab-button {
  @apply px-3 py-1.5 text-sm rounded transition-colors hover:bg-accent;
}

.tab-button.active {
  @apply bg-background shadow-sm;
}

.patterns-section {
  @apply space-y-6;
}

.section-header {
  @apply pb-4 border-b border-border;
}

.section-title {
  @apply flex items-center gap-3 text-xl font-semibold;
}

.patterns-grid {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}

.pattern-card {
  @apply bg-card border border-border rounded-lg p-6;
}

.pattern-title {
  @apply text-lg font-semibold mb-4;
}

.query-list {
  @apply space-y-3;
}

.query-item {
  @apply p-3 rounded bg-muted/30;
}

.query-text {
  @apply font-medium mb-1;
}

.query-stats {
  @apply flex items-center gap-4 text-sm text-muted-foreground;
}

.search-types {
  @apply space-y-3;
}

.type-item {
  @apply flex items-center justify-between;
}

.type-info {
  @apply flex items-center gap-2;
}

.type-stats {
  @apply flex items-center gap-3;
}

.type-bar {
  @apply w-24 h-2 bg-muted rounded-full overflow-hidden;
}

.type-fill {
  @apply h-full transition-all duration-500;
}

.fill-lexical {
  @apply bg-blue-500;
}

.fill-semantic {
  @apply bg-green-500;
}

.fill-hybrid {
  @apply bg-purple-500;
}

.bottlenecks-list {
  @apply space-y-3;
}

.bottleneck-item {
  @apply flex items-center justify-between p-3 rounded bg-muted/30;
}

.bottleneck-phase {
  @apply font-medium;
}

.bottleneck-impact {
  @apply text-sm text-muted-foreground;
}

.bottleneck-time {
  @apply font-mono text-sm;
}

.quality-metrics {
  @apply space-y-4;
}

.quality-item {
  @apply flex items-center justify-between;
}

.quality-label {
  @apply flex items-center gap-2 text-sm;
}

.quality-score {
  @apply font-semibold;
}

.quality-excellent {
  @apply text-green-600 dark:text-green-400;
}

.quality-good {
  @apply text-blue-600 dark:text-blue-400;
}

.quality-fair {
  @apply text-yellow-600 dark:text-yellow-400;
}

.quality-poor {
  @apply text-red-600 dark:text-red-400;
}

.recommendations-list {
  @apply space-y-4;
}

.recommendation-item {
  @apply flex items-start gap-4 p-6 rounded-lg border;
}

.severity-low {
  @apply border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950;
}

.severity-medium {
  @apply border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950;
}

.severity-high {
  @apply border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950;
}

.rec-icon {
  @apply flex-shrink-0 p-2 rounded-full;
}

.severity-low .rec-icon {
  @apply bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300;
}

.severity-medium .rec-icon {
  @apply bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300;
}

.severity-high .rec-icon {
  @apply bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300;
}

.rec-content {
  @apply flex-1;
}

.rec-header {
  @apply flex items-center justify-between mb-2;
}

.rec-title {
  @apply font-semibold;
}

.rec-severity {
  @apply px-2 py-1 rounded text-xs font-medium;
}

.rec-severity.severity-low {
  @apply bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300;
}

.rec-severity.severity-medium {
  @apply bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300;
}

.rec-severity.severity-high {
  @apply bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300;
}

.rec-description {
  @apply text-muted-foreground mb-3;
}

.rec-impact {
  @apply text-sm;
}

.rec-actions {
  @apply flex-shrink-0;
}

.rec-apply-btn {
  @apply px-4 py-2 bg-primary text-primary-foreground rounded
         hover:bg-primary/90 transition-colors;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .dashboard-header {
    @apply flex-col items-start gap-4;
  }

  .patterns-grid {
    @apply grid-cols-1;
  }

  .charts-section {
    @apply grid-cols-1;
  }

  .recommendation-item {
    @apply flex-col gap-3;
  }

  .rec-header {
    @apply flex-col items-start gap-2;
  }
}

/* 无障碍支持 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 焦点样式 */
:focus-visible {
  outline: 2px solid hsl(var(--ring, 59 130 230));
  outline-offset: 2px;
}

/* 🎨 表单用户体验优化 */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  font-size: 1rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}

.form-input.error {
  border-color: hsl(0 84% 60%);
}

.form-error {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: hsl(0 84% 60%);
}

.form-success {
  border-color: hsl(142 71% 45%);
}

/* 加载状态 */
.form-input.loading {
  background-image: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  background-size: 200% 100%;
  animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
