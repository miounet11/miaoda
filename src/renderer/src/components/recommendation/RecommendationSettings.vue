<template>
  <div class="recommendation-settings">
    <div class="settings-header">
      <div class="header-info">
        <h2 class="settings-title">AI个性化推荐设置</h2>
        <p class="settings-description">
          配置推荐系统以获得更个性化的AI体验
        </p>
      </div>
      <div class="header-actions">
        <button @click="resetToDefaults" class="reset-btn">
          <RotateCcw class="w-4 h-4" />
          重置默认
        </button>
        <button @click="exportSettings" class="export-btn">
          <Download class="w-4 h-4" />
          导出设置
        </button>
      </div>
    </div>

    <div class="settings-content">
      <!-- 基础设置 -->
      <div class="settings-section">
        <div class="section-header">
          <Settings class="w-5 h-5" />
          <h3 class="section-title">基础设置</h3>
        </div>

        <div class="setting-group">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">启用智能推荐</div>
              <div class="setting-description">
                基于您的使用习惯和偏好提供个性化推荐
              </div>
            </div>
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                v-model="localSettings.enableRecommendations"
                @change="handleSettingsChange"
              >
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-item" :class="{ disabled: !localSettings.enableRecommendations }">
            <div class="setting-info">
              <div class="setting-label">智能建议</div>
              <div class="setting-description">
                在对话过程中提供续写、深度探索等智能建议
              </div>
            </div>
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                v-model="localSettings.enableSmartSuggestions"
                :disabled="!localSettings.enableRecommendations"
                @change="handleSettingsChange"
              >
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-item" :class="{ disabled: !localSettings.enableRecommendations }">
            <div class="setting-info">
              <div class="setting-label">学习路径</div>
              <div class="setting-description">
                根据您的兴趣和知识水平生成个性化学习路径
              </div>
            </div>
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                v-model="localSettings.enableLearningPaths"
                :disabled="!localSettings.enableRecommendations"
                @change="handleSettingsChange"
              >
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-item" :class="{ disabled: !localSettings.enableRecommendations }">
            <div class="setting-info">
              <div class="setting-label">自动提示词</div>
              <div class="setting-description">
                自动为您生成和应用优化的提示词模板
              </div>
            </div>
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                v-model="localSettings.enableAutoPrompts"
                :disabled="!localSettings.enableRecommendations"
                @change="handleSettingsChange"
              >
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- 推荐算法设置 -->
      <div class="settings-section">
        <div class="section-header">
          <Brain class="w-5 h-5" />
          <h3 class="section-title">算法配置</h3>
        </div>

        <div class="setting-group">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">推荐频率</div>
              <div class="setting-description">
                控制推荐内容的更新频率和数量
              </div>
            </div>
            <select 
              v-model="localSettings.recommendationFrequency"
              class="setting-select"
              @change="handleSettingsChange"
            >
              <option value="low">低频率 (重要推荐)</option>
              <option value="medium">中频率 (平衡模式)</option>
              <option value="high">高频率 (详细推荐)</option>
            </select>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">个性化权重</div>
              <div class="setting-description">
                调整基于个人偏好的推荐权重 ({{ algorithmConfig.personalizedWeight * 100 }}%)
              </div>
            </div>
            <div class="slider-container">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                v-model.number="algorithmConfig.personalizedWeight"
                class="setting-slider"
                @input="updateAlgorithmConfig"
              >
              <div class="slider-labels">
                <span>通用</span>
                <span>个性化</span>
              </div>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">多样性权重</div>
              <div class="setting-description">
                调整推荐内容的多样性程度 ({{ algorithmConfig.diversityWeight * 100 }}%)
              </div>
            </div>
            <div class="slider-container">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                v-model.number="algorithmConfig.diversityWeight"
                class="setting-slider"
                @input="updateAlgorithmConfig"
              >
              <div class="slider-labels">
                <span>专注</span>
                <span>多样</span>
              </div>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">置信度阈值</div>
              <div class="setting-description">
                只显示置信度高于此阈值的推荐 ({{ Math.round(algorithmConfig.confidenceThreshold * 100) }}%)
              </div>
            </div>
            <div class="slider-container">
              <input 
                type="range" 
                min="0.1" 
                max="1" 
                step="0.1"
                v-model.number="algorithmConfig.confidenceThreshold"
                class="setting-slider"
                @input="updateAlgorithmConfig"
              >
              <div class="slider-labels">
                <span>宽松</span>
                <span>严格</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 推荐类型设置 -->
      <div class="settings-section">
        <div class="section-header">
          <Filter class="w-5 h-5" />
          <h3 class="section-title">推荐类型</h3>
        </div>

        <div class="setting-group">
          <div class="recommendation-types">
            <div 
              v-for="type in availableTypes" 
              :key="type.id"
              class="type-item"
              :class="{ active: algorithmConfig.enabledTypes.includes(type.id) }"
              @click="toggleRecommendationType(type.id)"
            >
              <div class="type-icon">
                <component :is="type.icon" class="w-5 h-5" />
              </div>
              <div class="type-info">
                <div class="type-name">{{ type.name }}</div>
                <div class="type-description">{{ type.description }}</div>
              </div>
              <div class="type-toggle">
                <Check v-if="algorithmConfig.enabledTypes.includes(type.id)" class="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 隐私设置 -->
      <div class="settings-section">
        <div class="section-header">
          <Shield class="w-5 h-5" />
          <h3 class="section-title">隐私与数据</h3>
        </div>

        <div class="setting-group">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">隐私级别</div>
              <div class="setting-description">
                控制个人数据的使用范围和分析深度
              </div>
            </div>
            <select 
              v-model="localSettings.privacyLevel"
              class="setting-select"
              @change="handleSettingsChange"
            >
              <option value="minimal">最小化 (仅基础功能)</option>
              <option value="partial">部分数据 (平衡隐私与功能)</option>
              <option value="full">完整分析 (最佳推荐效果)</option>
            </select>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">数据保留期</div>
              <div class="setting-description">
                推荐相关数据的保留天数 ({{ localSettings.dataRetention }} 天)
              </div>
            </div>
            <div class="slider-container">
              <input 
                type="range" 
                min="7" 
                max="365" 
                step="7"
                v-model.number="localSettings.dataRetention"
                class="setting-slider"
                @input="handleSettingsChange"
              >
              <div class="slider-labels">
                <span>7天</span>
                <span>365天</span>
              </div>
            </div>
          </div>

          <div class="privacy-info">
            <Info class="w-4 h-4 text-blue-500" />
            <div class="privacy-text">
              <p>您的聊天数据仅在本地处理，不会发送到外部服务器。</p>
              <p>推荐算法基于本地数据分析生成，保护您的隐私安全。</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 用户画像管理 -->
      <div class="settings-section">
        <div class="section-header">
          <User class="w-5 h-5" />
          <h3 class="section-title">用户画像</h3>
        </div>

        <div class="setting-group">
          <div class="profile-stats" v-if="userProfile">
            <div class="stat-card">
              <div class="stat-label">兴趣标签</div>
              <div class="stat-value">{{ userProfile.interests.length }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">知识领域</div>
              <div class="stat-value">{{ userProfile.knowledgeDomains.length }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">完整度</div>
              <div class="stat-value">{{ profileCompleteness }}%</div>
            </div>
          </div>

          <div class="profile-actions">
            <button @click="refreshProfile" class="action-btn primary" :disabled="loading">
              <RefreshCw :class="['w-4 h-4', { 'animate-spin': loading }]" />
              {{ loading ? '更新中...' : '重新分析画像' }}
            </button>
            <button @click="exportProfile" class="action-btn secondary">
              <Download class="w-4 h-4" />
              导出画像数据
            </button>
            <button @click="clearProfile" class="action-btn danger">
              <Trash2 class="w-4 h-4" />
              清除画像数据
            </button>
          </div>
        </div>
      </div>

      <!-- 推荐统计 -->
      <div class="settings-section">
        <div class="section-header">
          <BarChart3 class="w-5 h-5" />
          <h3 class="section-title">推荐统计</h3>
        </div>

        <div class="setting-group">
          <div class="stats-grid" v-if="stats">
            <div class="stats-item">
              <div class="stats-label">总推荐数</div>
              <div class="stats-value">{{ stats.totalGenerated }}</div>
            </div>
            <div class="stats-item">
              <div class="stats-label">接受率</div>
              <div class="stats-value">
                {{ stats.totalGenerated > 0 ? Math.round((stats.totalAccepted / stats.totalGenerated) * 100) : 0 }}%
              </div>
            </div>
            <div class="stats-item">
              <div class="stats-label">平均置信度</div>
              <div class="stats-value">{{ Math.round(stats.averageConfidence) }}%</div>
            </div>
          </div>

          <div class="top-categories" v-if="stats.topCategories.length > 0">
            <h4 class="categories-title">热门推荐类别</h4>
            <div class="categories-list">
              <div 
                v-for="category in stats.topCategories.slice(0, 5)" 
                :key="category.category"
                class="category-item"
              >
                <span class="category-name">{{ category.category }}</span>
                <span class="category-count">{{ category.count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 保存提示 -->
    <div v-if="hasUnsavedChanges" class="save-prompt">
      <div class="prompt-content">
        <AlertCircle class="w-4 h-4 text-orange-500" />
        <span>您有未保存的设置更改</span>
        <div class="prompt-actions">
          <button @click="discardChanges" class="discard-btn">放弃</button>
          <button @click="saveSettings" class="save-btn" :disabled="saving">
            {{ saving ? '保存中...' : '保存设置' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted } from 'vue'
import { 
  Settings, Brain, Filter, Shield, User, BarChart3, RotateCcw, Download,
  RefreshCw, Trash2, Info, AlertCircle, Check, MessageSquare, Lightbulb,
  Hash, Cpu, BookOpen, Zap
} from 'lucide-vue-next'
import { useRecommendationStore } from '../../stores/recommendation'
import type { 
  PersonalizationSettings, 
  RecommendationConfig,
  RecommendationType 
} from '../../types/recommendation'

// Props
interface Props {
  userId: string
}

const props = defineProps<Props>()

// Store
const recommendationStore = useRecommendationStore()

// State
const loading = ref(false)
const saving = ref(false)
const hasUnsavedChanges = ref(false)

// 本地设置副本
const localSettings = reactive<PersonalizationSettings>({
  enableRecommendations: true,
  enableSmartSuggestions: true,
  enableLearningPaths: true,
  enableAutoPrompts: false,
  recommendationFrequency: 'medium',
  privacyLevel: 'partial',
  dataRetention: 90
})

// 算法配置
const algorithmConfig = reactive<RecommendationConfig>({
  maxRecommendations: 10,
  confidenceThreshold: 0.3,
  enabledTypes: ['model', 'prompt', 'topic', 'continuation'],
  personalizedWeight: 0.6,
  diversityWeight: 0.3,
  recencyWeight: 0.1
})

// 可用推荐类型
const availableTypes = ref([
  {
    id: 'model' as RecommendationType,
    name: '模型推荐',
    description: '基于场景推荐适合的AI模型',
    icon: Cpu
  },
  {
    id: 'prompt' as RecommendationType,
    name: '提示词模板',
    description: '智能提示词模板和优化建议',
    icon: MessageSquare
  },
  {
    id: 'topic' as RecommendationType,
    name: '话题建议',
    description: '基于兴趣的对话话题推荐',
    icon: Hash
  },
  {
    id: 'continuation' as RecommendationType,
    name: '对话续写',
    description: '智能对话续写和深度探索',
    icon: Lightbulb
  },
  {
    id: 'tool' as RecommendationType,
    name: '工具推荐',
    description: '相关工具和功能建议',
    icon: Zap
  },
  {
    id: 'learning_path' as RecommendationType,
    name: '学习路径',
    description: '个性化学习计划和进度跟踪',
    icon: BookOpen
  }
])

// Computed
const userProfile = computed(() => recommendationStore.userProfile)
const profileCompleteness = computed(() => recommendationStore.profileCompleteness)
const stats = computed(() => recommendationStore.stats)

// Methods
const handleSettingsChange = () => {
  hasUnsavedChanges.value = true
}

const updateAlgorithmConfig = () => {
  hasUnsavedChanges.value = true
}

const toggleRecommendationType = (type: RecommendationType) => {
  const index = algorithmConfig.enabledTypes.indexOf(type)
  if (index > -1) {
    algorithmConfig.enabledTypes.splice(index, 1)
  } else {
    algorithmConfig.enabledTypes.push(type)
  }
  updateAlgorithmConfig()
}

const saveSettings = async () => {
  saving.value = true
  try {
    // 保存个性化设置
    await recommendationStore.updatePersonalizationSettings(props.userId, localSettings)
    
    // 更新推荐配置
    recommendationStore.updateConfig(algorithmConfig)
    
    hasUnsavedChanges.value = false
  } catch (error) {
    console.error('设置保存失败:', error)
  } finally {
    saving.value = false
  }
}

const discardChanges = () => {
  // 重置本地设置
  const storeSettings = recommendationStore.personalizationSettings
  Object.assign(localSettings, storeSettings)
  
  const storeConfig = recommendationStore.config
  Object.assign(algorithmConfig, storeConfig)
  
  hasUnsavedChanges.value = false
}

const resetToDefaults = async () => {
  const defaultSettings: PersonalizationSettings = {
    enableRecommendations: true,
    enableSmartSuggestions: true,
    enableLearningPaths: true,
    enableAutoPrompts: false,
    recommendationFrequency: 'medium',
    privacyLevel: 'partial',
    dataRetention: 90
  }

  const defaultConfig: RecommendationConfig = {
    maxRecommendations: 10,
    confidenceThreshold: 0.3,
    enabledTypes: ['model', 'prompt', 'topic', 'continuation'],
    personalizedWeight: 0.6,
    diversityWeight: 0.3,
    recencyWeight: 0.1
  }

  Object.assign(localSettings, defaultSettings)
  Object.assign(algorithmConfig, defaultConfig)
  
  await saveSettings()
}

const exportSettings = () => {
  const settingsData = {
    personalization: localSettings,
    algorithm: algorithmConfig,
    userProfile: userProfile.value,
    exportDate: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(settingsData, null, 2)], { 
    type: 'application/json' 
  })
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `recommendation-settings-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const refreshProfile = async () => {
  loading.value = true
  try {
    await recommendationStore.updateUserProfile(props.userId)
  } finally {
    loading.value = false
  }
}

const exportProfile = () => {
  if (!userProfile.value) return

  const blob = new Blob([JSON.stringify(userProfile.value, null, 2)], { 
    type: 'application/json' 
  })
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `user-profile-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const clearProfile = async () => {
  if (confirm('确定要清除用户画像数据吗？此操作不可撤销。')) {
    // 实现清除用户画像的逻辑
    console.log('清除用户画像数据')
  }
}

// 初始化
onMounted(async () => {
  await recommendationStore.initialize(props.userId)
  
  // 同步store中的设置到本地副本
  const storeSettings = recommendationStore.personalizationSettings
  Object.assign(localSettings, storeSettings)
  
  const storeConfig = recommendationStore.config
  Object.assign(algorithmConfig, storeConfig)
})

// 监听store变化
watch(() => recommendationStore.personalizationSettings, (newSettings) => {
  if (!hasUnsavedChanges.value) {
    Object.assign(localSettings, newSettings)
  }
}, { deep: true })

watch(() => recommendationStore.config, (newConfig) => {
  if (!hasUnsavedChanges.value) {
    Object.assign(algorithmConfig, newConfig)
  }
}, { deep: true })
</script>

<style scoped>
.recommendation-settings {
  @apply max-w-4xl mx-auto p-6;
}

.settings-header {
  @apply flex items-start justify-between mb-8 pb-6 border-b border-gray-200 dark:border-gray-700;
}

.header-info {
  @apply flex-1;
}

.settings-title {
  @apply text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2;
}

.settings-description {
  @apply text-gray-600 dark:text-gray-400;
}

.header-actions {
  @apply flex gap-3;
}

.reset-btn, .export-btn {
  @apply flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors;
}

.settings-content {
  @apply space-y-8;
}

/* Section样式 */
.settings-section {
  @apply bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden;
}

.section-header {
  @apply flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750;
}

.section-title {
  @apply text-lg font-semibold text-gray-900 dark:text-gray-100;
}

.setting-group {
  @apply p-6 space-y-6;
}

/* 设置项样式 */
.setting-item {
  @apply flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0;
}

.setting-item.disabled {
  @apply opacity-50 pointer-events-none;
}

.setting-info {
  @apply flex-1 pr-6;
}

.setting-label {
  @apply text-sm font-medium text-gray-900 dark:text-gray-100 mb-1;
}

.setting-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

/* Toggle开关 */
.toggle-switch {
  @apply relative inline-block w-12 h-6;
}

.toggle-switch input {
  @apply opacity-0 w-0 h-0;
}

.toggle-slider {
  @apply absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 dark:bg-gray-600 rounded-full transition-all;
}

.toggle-slider:before {
  @apply absolute content-[''] h-5 w-5 left-0.5 bottom-0.5 bg-white rounded-full transition-all;
}

input:checked + .toggle-slider {
  @apply bg-blue-500;
}

input:checked + .toggle-slider:before {
  @apply translate-x-6;
}

/* 选择框和滑块 */
.setting-select {
  @apply px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.slider-container {
  @apply w-48;
}

.setting-slider {
  @apply w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer;
}

.setting-slider::-webkit-slider-thumb {
  @apply appearance-none w-4 h-4 bg-blue-500 rounded-full cursor-pointer;
}

.slider-labels {
  @apply flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1;
}

/* 推荐类型 */
.recommendation-types {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.type-item {
  @apply flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer transition-all hover:border-blue-300 dark:hover:border-blue-600;
}

.type-item.active {
  @apply border-blue-500 bg-blue-50 dark:bg-blue-900/20;
}

.type-icon {
  @apply p-2 bg-gray-100 dark:bg-gray-700 rounded-lg;
}

.type-item.active .type-icon {
  @apply bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400;
}

.type-info {
  @apply flex-1;
}

.type-name {
  @apply text-sm font-medium text-gray-900 dark:text-gray-100 mb-1;
}

.type-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.type-toggle {
  @apply w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center;
}

.type-item.active .type-toggle {
  @apply border-blue-500 bg-blue-500 text-white;
}

/* 隐私信息 */
.privacy-info {
  @apply flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700;
}

.privacy-text {
  @apply text-sm text-blue-800 dark:text-blue-200 space-y-1;
}

/* 用户画像统计 */
.profile-stats {
  @apply grid grid-cols-3 gap-4 mb-6;
}

.stat-card {
  @apply text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg;
}

.stat-label {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-1;
}

.stat-value {
  @apply text-xl font-bold text-gray-900 dark:text-gray-100;
}

.profile-actions {
  @apply flex gap-3 flex-wrap;
}

.action-btn {
  @apply flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors;
}

.action-btn.primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.action-btn.secondary {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600;
}

.action-btn.danger {
  @apply bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50;
}

/* 推荐统计 */
.stats-grid {
  @apply grid grid-cols-3 gap-6 mb-6;
}

.stats-item {
  @apply text-center;
}

.stats-label {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-2;
}

.stats-value {
  @apply text-2xl font-bold text-gray-900 dark:text-gray-100;
}

.top-categories {
  @apply space-y-3;
}

.categories-title {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300 mb-3;
}

.categories-list {
  @apply space-y-2;
}

.category-item {
  @apply flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md;
}

.category-name {
  @apply text-sm text-gray-700 dark:text-gray-300;
}

.category-count {
  @apply text-sm font-medium text-blue-600 dark:text-blue-400;
}

/* 保存提示 */
.save-prompt {
  @apply fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50;
}

.prompt-content {
  @apply flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded-lg shadow-lg;
}

.prompt-actions {
  @apply flex gap-2 ml-4;
}

.discard-btn {
  @apply px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200;
}

.save-btn {
  @apply px-4 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .recommendation-settings {
    @apply p-4;
  }
  
  .settings-header {
    @apply flex-col gap-4 items-start;
  }
  
  .recommendation-types {
    @apply grid-cols-1;
  }
  
  .profile-stats {
    @apply grid-cols-1;
  }
  
  .stats-grid {
    @apply grid-cols-1;
  }
}
</style>