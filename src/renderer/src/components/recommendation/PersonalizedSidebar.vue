<template>
  <div class="personalized-sidebar">
    <!-- 用户画像概览 -->
    <div class="profile-overview">
      <div class="profile-header">
        <div class="profile-avatar">
          <User class="w-6 h-6" />
        </div>
        <div class="profile-info">
          <h3 class="profile-title">个人档案</h3>
          <div class="profile-completeness">
            <div class="completeness-bar">
              <div 
                class="completeness-fill" 
                :style="{ width: `${profileCompleteness}%` }"
              />
            </div>
            <span class="completeness-text">{{ profileCompleteness }}% 完整</span>
          </div>
        </div>
      </div>

      <!-- 快速统计 -->
      <div v-if="userProfile" class="quick-stats">
        <div class="stat-item">
          <MessageCircle class="w-4 h-4 text-blue-500" />
          <span class="stat-value">{{ userProfile.totalMessages }}</span>
          <span class="stat-label">消息</span>
        </div>
        <div class="stat-item">
          <Hash class="w-4 h-4 text-green-500" />
          <span class="stat-value">{{ userProfile.totalChats }}</span>
          <span class="stat-label">对话</span>
        </div>
        <div class="stat-item">
          <Clock class="w-4 h-4 text-purple-500" />
          <span class="stat-value">{{ Math.round(userProfile.averageSessionLength) }}m</span>
          <span class="stat-label">平均时长</span>
        </div>
      </div>
    </div>

    <!-- 兴趣标签 -->
    <div v-if="userProfile?.interests?.length" class="interests-section">
      <div class="section-header">
        <Heart class="w-4 h-4" />
        <span>我的兴趣</span>
        <button @click="toggleInterests" class="expand-btn">
          <ChevronDown :class="{ 'rotate-180': !interestsCollapsed }" class="w-4 h-4" />
        </button>
      </div>
      
      <div v-if="!interestsCollapsed" class="interests-content">
        <div class="interest-tags">
          <div 
            v-for="interest in userProfile.interests.slice(0, 8)" 
            :key="interest.keyword"
            class="interest-tag"
            :style="{ opacity: 0.3 + interest.weight * 0.7 }"
            @click="exploreInterest(interest)"
          >
            <span class="tag-text">{{ interest.keyword }}</span>
            <span class="tag-weight">{{ Math.round(interest.weight * 100) }}%</span>
          </div>
        </div>
        <button @click="showAllInterests" class="show-more-btn">
          查看全部兴趣
        </button>
      </div>
    </div>

    <!-- 知识领域 -->
    <div v-if="userProfile?.knowledgeDomains?.length" class="domains-section">
      <div class="section-header">
        <BookOpen class="w-4 h-4" />
        <span>知识领域</span>
        <button @click="toggleDomains" class="expand-btn">
          <ChevronDown :class="{ 'rotate-180': !domainsCollapsed }" class="w-4 h-4" />
        </button>
      </div>

      <div v-if="!domainsCollapsed" class="domains-content">
        <div 
          v-for="domain in userProfile.knowledgeDomains.slice(0, 5)" 
          :key="domain.domain"
          class="domain-item"
          @click="exploreDomain(domain)"
        >
          <div class="domain-info">
            <span class="domain-name">{{ domain.domain }}</span>
            <div class="domain-levels">
              <div class="level-bar">
                <span class="level-label">熟练度</span>
                <div class="level-progress">
                  <div 
                    class="level-fill proficiency" 
                    :style="{ width: `${domain.proficiencyLevel}%` }"
                  />
                </div>
                <span class="level-value">{{ Math.round(domain.proficiencyLevel) }}</span>
              </div>
              <div class="level-bar">
                <span class="level-label">兴趣度</span>
                <div class="level-progress">
                  <div 
                    class="level-fill interest" 
                    :style="{ width: `${domain.interestLevel}%` }"
                  />
                </div>
                <span class="level-value">{{ Math.round(domain.interestLevel) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions-section">
      <div class="section-header">
        <Zap class="w-4 h-4" />
        <span>快捷操作</span>
      </div>

      <div class="quick-actions">
        <!-- 基于用户画像的智能快捷操作 -->
        <div class="action-grid">
          <button 
            v-for="action in personalizedActions" 
            :key="action.id"
            @click="executeAction(action)"
            class="action-button"
            :class="action.variant"
          >
            <component :is="action.icon" class="w-4 h-4" />
            <span class="action-text">{{ action.label }}</span>
          </button>
        </div>

        <!-- 常用场景快速启动 -->
        <div v-if="userProfile?.commonScenarios?.length" class="scenarios-section">
          <h4 class="scenarios-title">常用场景</h4>
          <div class="scenario-buttons">
            <button 
              v-for="scenario in userProfile.commonScenarios.slice(0, 4)" 
              :key="scenario"
              @click="startScenario(scenario)"
              class="scenario-btn"
            >
              {{ scenario }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 推荐设置快速入口 -->
    <div class="settings-section">
      <div class="section-header">
        <Settings class="w-4 h-4" />
        <span>推荐设置</span>
      </div>

      <div class="settings-controls">
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">智能推荐</span>
            <span class="setting-desc">基于使用习惯推荐内容</span>
          </div>
          <label class="toggle-switch">
            <input 
              type="checkbox" 
              v-model="personalizationSettings.enableRecommendations"
              @change="updateSettings"
            >
            <span class="toggle-slider" />
          </label>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">智能建议</span>
            <span class="setting-desc">自动生成续写和深度探索建议</span>
          </div>
          <label class="toggle-switch">
            <input 
              type="checkbox" 
              v-model="personalizationSettings.enableSmartSuggestions"
              @change="updateSettings"
            >
            <span class="toggle-slider" />
          </label>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">推荐频率</span>
          </div>
          <select 
            v-model="personalizationSettings.recommendationFrequency"
            @change="updateSettings"
            class="frequency-select"
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>

        <button @click="openDetailedSettings" class="detailed-settings-btn">
          <Settings2 class="w-4 h-4" />
          详细设置
        </button>
      </div>
    </div>

    <!-- 学习进度 -->
    <div v-if="learningPaths.length" class="learning-section">
      <div class="section-header">
        <GraduationCap class="w-4 h-4" />
        <span>学习进度</span>
      </div>

      <div class="learning-paths">
        <div 
          v-for="path in learningPaths.slice(0, 3)" 
          :key="path.id"
          class="learning-path"
          @click="continueLearning(path)"
        >
          <div class="path-info">
            <span class="path-title">{{ path.title }}</span>
            <div class="path-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${path.progress}%` }"
                />
              </div>
              <span class="progress-text">{{ path.progress }}%</span>
            </div>
          </div>
        </div>
        <button @click="createNewLearningPath" class="create-path-btn">
          <Plus class="w-4 h-4" />
          创建学习路径
        </button>
      </div>
    </div>

    <!-- 活跃时间分析 -->
    <div v-if="userProfile?.activeHours" class="activity-section">
      <div class="section-header">
        <Clock class="w-4 h-4" />
        <span>活跃时段</span>
        <button @click="toggleActivity" class="expand-btn">
          <ChevronDown :class="{ 'rotate-180': !activityCollapsed }" class="w-4 h-4" />
        </button>
      </div>

      <div v-if="!activityCollapsed" class="activity-content">
        <div class="activity-chart">
          <div 
            v-for="(activity, hour) in userProfile.activeHours" 
            :key="hour"
            class="activity-bar"
            :style="{ 
              height: `${Math.max(activity, 5)}%`,
              opacity: activity > 20 ? 1 : 0.3 
            }"
            :title="`${hour}:00 - 活跃度 ${Math.round(activity)}%`"
          >
            <div class="hour-label" v-if="hour % 4 === 0">{{ hour }}</div>
          </div>
        </div>
        <p class="activity-insight">
          您在 {{ getMostActiveHours() }} 时段最活跃
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  User, MessageCircle, Hash, Clock, Heart, ChevronDown, BookOpen,
  Zap, Settings, Settings2, GraduationCap, Plus, Code2, 
  Lightbulb, MessageSquare, Search, Bookmark
} from 'lucide-vue-next'
import { useRecommendationStore } from '../../stores/recommendation'
import type { UserInterest, KnowledgeDomain } from '../../types/recommendation'

// Props
interface Props {
  userId: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  interestExplored: [interest: UserInterest]
  domainExplored: [domain: KnowledgeDomain]
  actionExecuted: [actionId: string]
  scenarioStarted: [scenario: string]
  settingsOpened: []
  learningContinued: [pathId: string]
  newLearningPath: []
}>()

// Store
const recommendationStore = useRecommendationStore()

// State
const interestsCollapsed = ref(false)
const domainsCollapsed = ref(false)
const activityCollapsed = ref(false)

// Computed
const userProfile = computed(() => recommendationStore.userProfile)
const profileCompleteness = computed(() => recommendationStore.profileCompleteness)
const personalizationSettings = computed(() => recommendationStore.personalizationSettings)
const learningPaths = computed(() => recommendationStore.learningPaths)

// 基于用户画像生成的个性化快捷操作
const personalizedActions = computed(() => {
  const actions = [
    {
      id: 'new-chat',
      label: '新对话',
      icon: MessageSquare,
      variant: 'primary'
    },
    {
      id: 'search-history',
      label: '搜索历史',
      icon: Search,
      variant: 'secondary'
    }
  ]

  if (!userProfile.value) return actions

  // 基于用户的知识领域添加快捷操作
  const topDomains = userProfile.value.knowledgeDomains.slice(0, 2)
  topDomains.forEach(domain => {
    if (domain.domain === '编程开发') {
      actions.push({
        id: 'code-review',
        label: '代码审查',
        icon: Code2,
        variant: 'accent'
      })
    } else if (domain.domain === '创作写作') {
      actions.push({
        id: 'creative-writing',
        label: '创意写作',
        icon: Lightbulb,
        variant: 'accent'
      })
    }
  })

  // 基于常用场景添加操作
  const scenarios = userProfile.value.commonScenarios
  if (scenarios.includes('学习指导')) {
    actions.push({
      id: 'learning-assistant',
      label: '学习助手',
      icon: BookOpen,
      variant: 'success'
    })
  }

  return actions.slice(0, 6) // 最多显示6个
})

// Methods
const toggleInterests = () => {
  interestsCollapsed.value = !interestsCollapsed.value
}

const toggleDomains = () => {
  domainsCollapsed.value = !domainsCollapsed.value
}

const toggleActivity = () => {
  activityCollapsed.value = !activityCollapsed.value
}

const exploreInterest = (interest: UserInterest) => {
  emit('interestExplored', interest)
}

const exploreDomain = (domain: KnowledgeDomain) => {
  emit('domainExplored', domain)
}

const showAllInterests = () => {
  // 显示所有兴趣的模态框或导航到详细页面
}

const executeAction = (action: any) => {
  emit('actionExecuted', action.id)
}

const startScenario = (scenario: string) => {
  emit('scenarioStarted', scenario)
}

const updateSettings = async () => {
  await recommendationStore.updatePersonalizationSettings(
    props.userId,
    personalizationSettings.value
  )
}

const openDetailedSettings = () => {
  emit('settingsOpened')
}

const continueLearning = (path: any) => {
  emit('learningContinued', path.id)
}

const createNewLearningPath = () => {
  emit('newLearningPath')
}

const getMostActiveHours = (): string => {
  if (!userProfile.value?.activeHours) return '未知'
  
  const hours = userProfile.value.activeHours
  let maxActivity = 0
  let maxHour = 0
  
  hours.forEach((activity, hour) => {
    if (activity > maxActivity) {
      maxActivity = activity
      maxHour = hour
    }
  })
  
  return `${maxHour}:00-${(maxHour + 1) % 24}:00`
}

// 监听用户ID变化，重新加载数据
watch(() => props.userId, async (newUserId) => {
  if (newUserId) {
    await recommendationStore.initialize(newUserId)
  }
}, { immediate: true })
</script>

<style scoped>
.personalized-sidebar {
  @apply w-64 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto;
}

/* 用户画像概览 */
.profile-overview {
  @apply p-4 border-b border-gray-200 dark:border-gray-700;
}

.profile-header {
  @apply flex items-start gap-3 mb-4;
}

.profile-avatar {
  @apply w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400;
}

.profile-info {
  @apply flex-1;
}

.profile-title {
  @apply text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2;
}

.profile-completeness {
  @apply flex items-center gap-2;
}

.completeness-bar {
  @apply flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden;
}

.completeness-fill {
  @apply h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500;
}

.completeness-text {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

.quick-stats {
  @apply grid grid-cols-3 gap-2;
}

.stat-item {
  @apply flex flex-col items-center gap-1 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg;
}

.stat-value {
  @apply text-sm font-semibold text-gray-800 dark:text-gray-200;
}

.stat-label {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

/* 通用Section样式 */
.section-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700;
}

.section-header span {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300 flex-1 ml-2;
}

.expand-btn {
  @apply p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
}

/* 兴趣标签 */
.interests-content {
  @apply p-4;
}

.interest-tags {
  @apply flex flex-wrap gap-2 mb-3;
}

.interest-tag {
  @apply flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full cursor-pointer transition-all hover:bg-blue-200 dark:hover:bg-blue-800;
}

.tag-text {
  @apply text-xs font-medium;
}

.tag-weight {
  @apply text-xs opacity-75;
}

.show-more-btn {
  @apply text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300;
}

/* 知识领域 */
.domains-content {
  @apply p-4 space-y-3;
}

.domain-item {
  @apply p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-600;
}

.domain-name {
  @apply text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 block;
}

.domain-levels {
  @apply space-y-2;
}

.level-bar {
  @apply flex items-center gap-2;
}

.level-label {
  @apply text-xs text-gray-600 dark:text-gray-400 w-12;
}

.level-progress {
  @apply flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden;
}

.level-fill.proficiency {
  @apply bg-green-500;
}

.level-fill.interest {
  @apply bg-blue-500;
}

.level-value {
  @apply text-xs text-gray-600 dark:text-gray-400 w-6;
}

/* 快捷操作 */
.quick-actions {
  @apply p-4 space-y-4;
}

.action-grid {
  @apply grid grid-cols-2 gap-2;
}

.action-button {
  @apply flex flex-col items-center gap-2 p-3 rounded-lg transition-all;
}

.action-button.primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.action-button.secondary {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600;
}

.action-button.accent {
  @apply bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800;
}

.action-button.success {
  @apply bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800;
}

.action-text {
  @apply text-xs font-medium text-center;
}

.scenarios-section {
  @apply space-y-2;
}

.scenarios-title {
  @apply text-xs font-medium text-gray-700 dark:text-gray-300 mb-2;
}

.scenario-buttons {
  @apply flex flex-wrap gap-1;
}

.scenario-btn {
  @apply px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors;
}

/* 设置控制 */
.settings-controls {
  @apply p-4 space-y-4;
}

.setting-item {
  @apply flex items-center justify-between;
}

.setting-info {
  @apply flex-1 pr-3;
}

.setting-label {
  @apply text-sm font-medium text-gray-800 dark:text-gray-200 block;
}

.setting-desc {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

.toggle-switch {
  @apply relative inline-block w-11 h-6;
}

.toggle-switch input {
  @apply opacity-0 w-0 h-0;
}

.toggle-slider {
  @apply absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 dark:bg-gray-600 rounded-full transition-all;
}

.toggle-slider:before {
  @apply absolute content-[''] h-4 w-4 left-1 bottom-1 bg-white rounded-full transition-all;
}

input:checked + .toggle-slider {
  @apply bg-blue-500;
}

input:checked + .toggle-slider:before {
  @apply translate-x-5;
}

.frequency-select {
  @apply px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md;
}

.detailed-settings-btn {
  @apply flex items-center gap-2 w-full p-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors;
}

/* 学习进度 */
.learning-paths {
  @apply p-4 space-y-3;
}

.learning-path {
  @apply p-3 bg-green-50 dark:bg-green-900/20 rounded-lg cursor-pointer transition-all hover:bg-green-100 dark:hover:bg-green-900/40;
}

.path-title {
  @apply text-sm font-medium text-gray-800 dark:text-gray-200 block mb-2;
}

.path-progress {
  @apply flex items-center gap-2;
}

.progress-bar {
  @apply flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-green-500 transition-all duration-300;
}

.progress-text {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

.create-path-btn {
  @apply flex items-center gap-2 w-full p-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors;
}

/* 活跃时间图表 */
.activity-content {
  @apply p-4;
}

.activity-chart {
  @apply flex items-end gap-1 h-16 mb-3;
}

.activity-bar {
  @apply flex-1 bg-blue-500 rounded-t-sm relative transition-all;
  min-height: 2px;
}

.hour-label {
  @apply absolute -bottom-5 left-0 text-xs text-gray-600 dark:text-gray-400;
}

.activity-insight {
  @apply text-xs text-gray-600 dark:text-gray-400 text-center;
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .personalized-sidebar {
    @apply w-56;
  }
  
  .action-grid {
    @apply grid-cols-1;
  }
  
  .quick-stats {
    @apply grid-cols-2;
  }
}
</style>