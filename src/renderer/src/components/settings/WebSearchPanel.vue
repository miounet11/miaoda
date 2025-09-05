<template>
  <div class="chatbox-websearch-panel">
    <h1
      style="
        color: var(--mantine-color-chatbox-primary-text);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
      "
    >
      网络搜索
    </h1>

    <div class="settings-group">
      <!-- Search Engine -->
      <div class="settings-section">
        <h2>搜索引擎</h2>

        <div class="chatbox-settings-grid">
          <!-- Default Search Engine -->
          <div class="chatbox-settings-item">
            <label for="search-engine" class="chatbox-label">默认搜索引擎</label>
            <div class="chatbox-select-wrapper">
              <select
                id="search-engine"
                v-model="webSearchSettings.defaultEngine"
                class="chatbox-select"
              >
                <option value="google">Google</option>
                <option value="bing">Bing</option>
                <option value="duckduckgo">DuckDuckGo</option>
                <option value="baidu">百度</option>
                <option value="sogou">搜狗</option>
              </select>
              <svg
                class="chatbox-select-chevron"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </div>
            <p class="chatbox-description">AI进行网络搜索时使用的默认搜索引擎</p>
          </div>

          <!-- Safe Search -->
          <div class="chatbox-settings-item">
            <label for="safe-search" class="chatbox-label">安全搜索</label>
            <div class="chatbox-select-wrapper">
              <select
                id="safe-search"
                v-model="webSearchSettings.safeSearch"
                class="chatbox-select"
              >
                <option value="strict">严格</option>
                <option value="moderate">中等</option>
                <option value="off">关闭</option>
              </select>
              <svg
                class="chatbox-select-chevron"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </div>
            <p class="chatbox-description">过滤不适当的搜索结果</p>
          </div>

          <!-- Search Region -->
          <div class="chatbox-settings-item">
            <label for="search-region" class="chatbox-label">搜索区域</label>
            <div class="chatbox-select-wrapper">
              <select id="search-region" v-model="webSearchSettings.region" class="chatbox-select">
                <option value="auto">自动检测</option>
                <option value="cn">中国</option>
                <option value="us">美国</option>
                <option value="uk">英国</option>
                <option value="jp">日本</option>
                <option value="kr">韩国</option>
                <option value="global">全球</option>
              </select>
              <svg
                class="chatbox-select-chevron"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </div>
            <p class="chatbox-description">优先显示特定区域的搜索结果</p>
          </div>

          <!-- Search Language -->
          <div class="chatbox-settings-item">
            <label for="search-language" class="chatbox-label">搜索语言</label>
            <div class="chatbox-select-wrapper">
              <select
                id="search-language"
                v-model="webSearchSettings.language"
                class="chatbox-select"
              >
                <option value="auto">自动检测</option>
                <option value="zh">中文</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
              </select>
              <svg
                class="chatbox-select-chevron"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </div>
            <p class="chatbox-description">优先显示特定语言的搜索结果</p>
          </div>
        </div>
      </div>

      <!-- Search Behavior -->
      <div class="settings-section">
        <h2>搜索行为</h2>

        <div class="chatbox-settings-grid">
          <!-- Enable Web Search -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="webSearchSettings.enabled"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 启用网络搜索 </span>
                <p class="chatbox-description mt-1">允许AI使用网络搜索获取最新信息</p>
              </div>
            </label>
          </div>

          <!-- Auto Search -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="webSearchSettings.autoSearch"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 自动搜索 </span>
                <p class="chatbox-description mt-1">AI自动判断何时需要搜索网络信息</p>
              </div>
            </label>
          </div>

          <!-- Search Confirmation -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="webSearchSettings.confirmBeforeSearch"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 搜索前确认 </span>
                <p class="chatbox-description mt-1">在进行网络搜索前询问用户确认</p>
              </div>
            </label>
          </div>

          <!-- Show Search Process -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="webSearchSettings.showSearchProcess"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 显示搜索过程 </span>
                <p class="chatbox-description mt-1">显示AI正在搜索和处理信息的详细过程</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Search Results -->
      <div class="settings-section">
        <h2>搜索结果</h2>

        <div class="chatbox-settings-grid">
          <!-- Max Results -->
          <div class="chatbox-settings-item">
            <label for="max-results" class="chatbox-label">最大结果数量</label>
            <div class="chatbox-range-wrapper">
              <span class="chatbox-range-label">少</span>
              <input
                id="max-results"
                v-model.number="webSearchSettings.maxResults"
                type="range"
                min="3"
                max="20"
                step="1"
                class="chatbox-range-slider"
              />
              <span class="chatbox-range-label">多</span>
              <span class="chatbox-range-value">{{ webSearchSettings.maxResults }}</span>
            </div>
            <p class="chatbox-description">单次搜索返回的最大结果数量</p>
          </div>

          <!-- Result Freshness -->
          <div class="chatbox-settings-item">
            <label for="result-freshness" class="chatbox-label">结果时效性</label>
            <div class="chatbox-select-wrapper">
              <select
                id="result-freshness"
                v-model="webSearchSettings.freshness"
                class="chatbox-select"
              >
                <option value="any">任何时间</option>
                <option value="day">过去一天</option>
                <option value="week">过去一周</option>
                <option value="month">过去一个月</option>
                <option value="year">过去一年</option>
              </select>
              <svg
                class="chatbox-select-chevron"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </div>
            <p class="chatbox-description">限制搜索结果的发布时间范围</p>
          </div>

          <!-- Show Sources -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="webSearchSettings.showSources"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 显示信息来源 </span>
                <p class="chatbox-description mt-1">在回答中显示信息的具体来源链接</p>
              </div>
            </label>
          </div>

          <!-- Cache Results -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="webSearchSettings.cacheResults"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 缓存搜索结果 </span>
                <p class="chatbox-description mt-1">暂时保存搜索结果以提高响应速度</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Search Engines Configuration -->
      <div class="settings-section">
        <h2>搜索引擎配置</h2>

        <div class="search-engines-grid">
          <div
            v-for="engine in searchEngines"
            :key="engine.id"
            class="search-engine-card"
            :class="{ active: webSearchSettings.defaultEngine === engine.id }"
          >
            <div class="search-engine-header">
              <div class="search-engine-icon">
                <component :is="engine.icon" :size="24" />
              </div>
              <div class="search-engine-info">
                <div class="search-engine-name">{{ engine.name }}</div>
                <div class="search-engine-description">{{ engine.description }}</div>
              </div>
              <div class="search-engine-status">
                <div class="status-indicator" :class="engine.status">
                  <span class="status-dot"></span>
                </div>
              </div>
            </div>
            <div class="search-engine-features">
              <span v-for="feature in engine.features" :key="feature" class="feature-tag">
                {{ feature }}
              </span>
            </div>
            <div class="search-engine-actions">
              <button
                @click="setDefaultEngine(engine.id)"
                :disabled="webSearchSettings.defaultEngine === engine.id"
                class="chatbox-button-outline"
              >
                {{ webSearchSettings.defaultEngine === engine.id ? '当前默认' : '设为默认' }}
              </button>
              <button
                @click="testEngine(engine.id)"
                :disabled="testingEngine === engine.id"
                class="chatbox-button-outline"
              >
                <component
                  :is="testingEngine === engine.id ? Loader2 : Search"
                  :size="16"
                  :class="{ 'animate-spin': testingEngine === engine.id }"
                />
                {{ testingEngine === engine.id ? '测试中...' : '测试' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Privacy & Security -->
      <div class="settings-section">
        <h2>隐私与安全</h2>

        <div class="chatbox-settings-grid">
          <!-- Anonymous Search -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="webSearchSettings.anonymousSearch"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 匿名搜索 </span>
                <p class="chatbox-description mt-1">不保存搜索历史和个人信息</p>
              </div>
            </label>
          </div>

          <!-- Block Ads -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="webSearchSettings.blockAds"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 屏蔽广告 </span>
                <p class="chatbox-description mt-1">过滤搜索结果中的广告内容</p>
              </div>
            </label>
          </div>

          <!-- Use Proxy -->
          <div class="chatbox-settings-item">
            <label class="chatbox-checkbox-item-vertical">
              <div class="chatbox-checkbox-wrapper">
                <input
                  v-model="webSearchSettings.useProxy"
                  type="checkbox"
                  class="chatbox-checkbox"
                />
                <div class="chatbox-checkbox-indicator">
                  <svg
                    class="chatbox-checkbox-check"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="chatbox-checkbox-label cursor-pointer"> 使用代理 </span>
                <p class="chatbox-description mt-1">通过代理服务器进行搜索请求</p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToastStore } from '@/stores/toast'
import { Search, Loader2, Globe, Shield, Zap, Eye } from 'lucide-vue-next'

const toastStore = useToastStore()

// Local state
const testingEngine = ref<string | null>(null)

// Web search settings
const webSearchSettings = ref({
  enabled: true,
  defaultEngine: 'google',
  safeSearch: 'moderate',
  region: 'auto',
  language: 'auto',
  autoSearch: true,
  confirmBeforeSearch: false,
  showSearchProcess: true,
  maxResults: 10,
  freshness: 'any',
  showSources: true,
  cacheResults: true,
  anonymousSearch: false,
  blockAds: true,
  useProxy: false
})

// Search engines configuration
const searchEngines = ref([
  {
    id: 'google',
    name: 'Google',
    description: '全球最大的搜索引擎',
    icon: Search,
    status: 'active',
    features: ['实时搜索', '智能建议', '多语言']
  },
  {
    id: 'bing',
    name: 'Bing',
    description: '微软搜索引擎',
    icon: Globe,
    status: 'active',
    features: ['图像搜索', '新闻搜索', 'AI集成']
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    description: '注重隐私的搜索引擎',
    icon: Shield,
    status: 'active',
    features: ['隐私保护', '无追踪', '匿名搜索']
  },
  {
    id: 'baidu',
    name: '百度',
    description: '中文搜索引擎',
    icon: Search,
    status: 'active',
    features: ['中文优化', '本地化', '实时热点']
  },
  {
    id: 'sogou',
    name: '搜狗',
    description: '中文搜索引擎',
    icon: Zap,
    status: 'active',
    features: ['中文分词', '智能问答', '语音搜索']
  }
])

// Methods
const setDefaultEngine = (engineId: string) => {
  webSearchSettings.value.defaultEngine = engineId
  toastStore.showSuccess(
    `已设置 ${searchEngines.value.find(e => e.id === engineId)?.name} 为默认搜索引擎`
  )
}

const testEngine = async (engineId: string) => {
  if (testingEngine.value) return

  testingEngine.value = engineId

  try {
    // Simulate engine test
    await new Promise(resolve => setTimeout(resolve, 2000))

    const engine = searchEngines.value.find(e => e.id === engineId)
    const success = Math.random() > 0.2 // 80% success rate

    if (success) {
      toastStore.showSuccess(`${engine?.name} 搜索引擎测试成功`)
    } else {
      toastStore.showError(`${engine?.name} 搜索引擎连接失败`)
    }
  } catch (error) {
    toastStore.showError('搜索引擎测试失败')
  } finally {
    testingEngine.value = null
  }
}

// Watch for settings changes
watch(
  webSearchSettings,
  () => {
    localStorage.setItem('webSearchSettings', JSON.stringify(webSearchSettings.value))
  },
  { deep: true }
)

// Load saved settings
const loadWebSearchSettings = () => {
  const saved = localStorage.getItem('webSearchSettings')
  if (saved) {
    try {
      const settings = JSON.parse(saved)
      webSearchSettings.value = { ...webSearchSettings.value, ...settings }
    } catch (error) {
      console.error('Error loading web search settings:', error)
    }
  }
}

// Initialize
loadWebSearchSettings()
</script>

<style scoped>
@import './chatbox-base.css';

.chatbox-websearch-panel {
  padding: var(--mantine-spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--mantine-spacing-xl);
}

.chatbox-settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Search engines grid */
.search-engines-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.search-engine-card {
  padding: 1rem;
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.15s ease;
}

.search-engine-card:hover {
  background: rgba(255, 255, 255, 0.05);
}

.search-engine-card.active {
  border-color: var(--mantine-color-chatbox-brand-filled);
  background: rgba(59, 130, 246, 0.1);
}

.search-engine-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-engine-icon {
  color: var(--mantine-color-chatbox-brand-filled);
  flex-shrink: 0;
}

.search-engine-info {
  flex: 1;
}

.search-engine-name {
  font-weight: 600;
  color: var(--mantine-color-chatbox-primary-text);
  margin-bottom: 0.25rem;
}

.search-engine-description {
  font-size: var(--mantine-font-size-sm);
  color: var(--mantine-color-chatbox-secondary-text);
}

.search-engine-status {
  flex-shrink: 0;
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
}

.status-indicator.active .status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #22c55e;
}

.search-engine-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.feature-tag {
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.25rem;
  font-size: var(--mantine-font-size-xs);
  color: var(--mantine-color-chatbox-secondary-text);
}

.search-engine-actions {
  display: flex;
  gap: 0.5rem;
}

.chatbox-button-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  color: var(--mantine-color-chatbox-primary-text);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.25rem;
  font-size: var(--mantine-font-size-sm);
  cursor: pointer;
  transition: all 0.15s ease;
  flex: 1;
}

.chatbox-button-outline:hover:not(:disabled) {
  background: var(--mantine-color-chatbox-brand-outline-hover);
}

.chatbox-button-outline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Animations */
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

/* Responsive */
@media (max-width: 768px) {
  .chatbox-settings-grid,
  .search-engines-grid {
    grid-template-columns: 1fr;
  }

  .search-engine-actions {
    flex-direction: column;
  }
}
</style>
