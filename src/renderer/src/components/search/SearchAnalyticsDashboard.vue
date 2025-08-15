<template>
  <div class="search-analytics-dashboard">
    <!-- Dashboard Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <h2 class="dashboard-title">
          <BarChart3 :size="24" />
          Search Analytics
        </h2>
        <p class="dashboard-subtitle">
          Monitor search performance and user behavior
        </p>
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

        <button @click="refreshData" class="refresh-button" :disabled="isLoading">
          <component :is="isLoading ? Loader2 : RefreshCw" :size="16" :class="{ 'animate-spin': isLoading }" />
          Refresh
        </button>

        <button @click="exportAnalytics" class="export-button">
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
            <component :is="analytics.searchTimeChange <= 0 ? TrendingUp : TrendingDown" :size="16" />
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
                :class="{ 'active': selectedPerformanceTab === tab.id }"
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
              <div
                v-for="type in analytics.searchTypes"
                :key="type.name"
                class="type-item"
              >
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
                  <span class="type-percentage">{{ Math.round((type.count / analytics.totalSearches) * 100) }}%</span>
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
                  <div class="bottleneck-impact">{{ (bottleneck.impact * 100).toFixed(1) }}% of search time</div>
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
              
              <div class="rec-impact">
                <strong>Expected Impact:</strong> {{ rec.impact }}
              </div>
            </div>

            <div class="rec-actions">
              <button @click="applyRecommendation(rec)" class="rec-apply-btn">
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
  BarChart3, Search, Clock, Target, Brain, TrendingUp, TrendingDown,
  RefreshCw, Download, Loader2, Lightbulb, Users, Zap, Database,
  FileText, Image, Volume2
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

const recommendations = ref<Array<{
  id: string
  type: 'indexing' | 'caching' | 'query' | 'hardware'
  severity: 'low' | 'medium' | 'high'
  title: string
  description: string
  impact: string
}>>([])

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
    case 'semantic': return Brain
    case 'hybrid': return Zap
    default: return Search
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
    case 'indexing': return Database
    case 'caching': return Zap
    case 'query': return Search
    case 'hardware': return TrendingUp
    default: return Lightbulb
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
</style>