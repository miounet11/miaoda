<template>
  <div class="chatbox-about-panel">
    <div class="about-header">
      <div class="app-logo">
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="8"
            y="8"
            width="48"
            height="48"
            rx="12"
            fill="url(#about-logo-gradient)"
            stroke="currentColor"
            stroke-width="2"
          />
          <path
            d="M24 32c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8-8-3.582-8-8z"
            fill="currentColor"
          />
          <path
            d="M20 20h24v4H20z"
            fill="currentColor"
            opacity="0.7"
          />
          <path
            d="M20 40h24v4H20z"
            fill="currentColor"
            opacity="0.7"
          />
          <defs>
            <linearGradient
              id="about-logo-gradient"
              x1="8"
              y1="8"
              x2="56"
              y2="56"
              gradientUnits="userSpaceOnUse"
            >
              <stop stop-color="var(--mantine-color-chatbox-brand-light)" />
              <stop offset="1" stop-color="var(--mantine-color-chatbox-brand-filled)" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div class="app-info">
        <h1>MiaoDa Chat</h1>
        <div class="version">版本 {{ appInfo.version }}</div>
        <div class="tagline">智能对话助手，让AI更贴近生活</div>
      </div>
    </div>

    <div class="about-content">
      <!-- App Information -->
      <div class="info-section">
        <h2>应用信息</h2>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">版本号</div>
            <div class="info-value">{{ appInfo.version }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">构建时间</div>
            <div class="info-value">{{ appInfo.buildDate }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">许可证</div>
            <div class="info-value">{{ appInfo.license }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">开发团队</div>
            <div class="info-value">{{ appInfo.developer }}</div>
          </div>
        </div>
      </div>

      <!-- Features -->
      <div class="features-section">
        <h2>核心功能</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div class="feature-content">
              <div class="feature-title">智能对话</div>
              <div class="feature-description">支持多种AI模型，提供自然流畅的对话体验</div>
            </div>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="9" cy="9" r="2"></circle>
                <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
              </svg>
            </div>
            <div class="feature-content">
              <div class="feature-title">图片生成</div>
              <div class="feature-description">集成DALL-E等AI模型，创作精美图像</div>
            </div>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <div class="feature-content">
              <div class="feature-title">多模型支持</div>
              <div class="feature-description">OpenAI、Claude、Gemini等15+AI提供商</div>
            </div>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <circle cx="12" cy="16" r="1"></circle>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div class="feature-content">
              <div class="feature-title">隐私保护</div>
              <div class="feature-description">本地存储对话，保护用户数据安全</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Links and Actions -->
      <div class="actions-section">
        <h2>更多信息</h2>
        <div class="action-buttons">
          <button @click="openWebsite" class="chatbox-button-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            官方网站
          </button>

          <button @click="openGitHub" class="chatbox-button-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
            GitHub
          </button>

          <button @click="sendFeedback" class="chatbox-button-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            反馈建议
          </button>

          <button @click="checkUpdates" class="chatbox-button-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            检查更新
          </button>
        </div>
      </div>

      <!-- Changelog -->
      <div class="changelog-section">
        <h2>更新日志</h2>
        <div class="changelog-list">
          <div v-for="release in changelog" :key="release.version" class="changelog-item">
            <div class="changelog-header">
              <div class="changelog-version">v{{ release.version }}</div>
              <div class="changelog-date">{{ release.date }}</div>
            </div>
            <div class="changelog-content">
              <ul>
                <li v-for="change in release.changes" :key="change">{{ change }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Credits -->
      <div class="credits-section">
        <h2>致谢</h2>
        <div class="credits-content">
          <p>感谢以下开源项目和贡献者：</p>
          <div class="credits-grid">
            <div class="credit-item">
              <div class="credit-name">Vue.js</div>
              <div class="credit-description">渐进式JavaScript框架</div>
            </div>
            <div class="credit-item">
              <div class="credit-name">Electron</div>
              <div class="credit-description">跨平台桌面应用框架</div>
            </div>
            <div class="credit-item">
              <div class="credit-name">TypeScript</div>
              <div class="credit-description">带类型的JavaScript</div>
            </div>
            <div class="credit-item">
              <div class="credit-name">Tailwind CSS</div>
              <div class="credit-description">实用优先的CSS框架</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Copyright -->
      <div class="copyright-section">
        <div class="copyright-text">
          © 2024 MiaoDa Team. All rights reserved. 
          <br>
          基于Chatbox设计灵感，致敬开源精神
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()

interface AppInfo {
  version: string
  buildDate: string
  license: string
  developer: string
}

interface ChangelogItem {
  version: string
  date: string
  changes: string[]
}

const appInfo = ref<AppInfo>({
  version: '6.0.1',
  buildDate: '2024-01-09',
  license: 'MIT License',
  developer: 'MiaoDa Team'
})

const changelog = ref<ChangelogItem[]>([
  {
    version: '6.0.1',
    date: '2024-01-09',
    changes: [
      '修复了图片生成功能的稳定性问题',
      '优化了聊天设置界面的用户体验',
      '增加了更多AI模型的支持',
      '改进了错误处理和用户反馈'
    ]
  },
  {
    version: '6.0.0',
    date: '2024-01-01',
    changes: [
      '全新的界面设计，完美复刻Chatbox体验',
      '支持15+主流AI提供商',
      '集成图片生成功能',
      '完善的设置和配置系统',
      '本地数据存储和隐私保护'
    ]
  }
])

const openWebsite = () => {
  if (window.api?.shell?.openExternal) {
    window.api.shell.openExternal('https://miaoda.com')
  } else {
    showToast('即将打开官方网站', 'info')
  }
}

const openGitHub = () => {
  if (window.api?.shell?.openExternal) {
    window.api.shell.openExternal('https://github.com/miaoda-team/miaoda-chat')
  } else {
    showToast('即将打开GitHub仓库', 'info')
  }
}

const sendFeedback = () => {
  if (window.api?.shell?.openExternal) {
    window.api.shell.openExternal('mailto:feedback@miaoda.com?subject=MiaoDa Chat 反馈')
  } else {
    showToast('请发送反馈到: feedback@miaoda.com', 'info')
  }
}

const checkUpdates = async () => {
  try {
    showToast('正在检查更新...', 'info')
    
    if (window.api?.updater?.checkForUpdates) {
      const result = await window.api.updater.checkForUpdates()
      if (result.hasUpdate) {
        showToast(`发现新版本 v${result.version}`, 'success')
      } else {
        showToast('当前已是最新版本', 'success')
      }
    } else {
      // Mock update check
      setTimeout(() => {
        showToast('当前已是最新版本', 'success')
      }, 1500)
    }
  } catch (error) {
    console.error('Failed to check updates:', error)
    showToast('检查更新失败', 'error')
  }
}

const updateAppInfo = async () => {
  try {
    if (window.api?.app?.getVersion) {
      const version = await window.api.app.getVersion()
      appInfo.value.version = version
    }
  } catch (error) {
    console.error('Failed to get app info:', error)
  }
}

onMounted(() => {
  updateAppInfo()
})
</script>

<style scoped>
.chatbox-about-panel {
  padding: var(--mantine-spacing-md);
  max-width: 60rem;
  margin: 0 auto;
}

/* Header */
.about-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 3rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 1rem;
}

.app-logo svg {
  color: var(--mantine-color-chatbox-brand-filled);
}

.app-info h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--mantine-color-chatbox-primary-text);
  margin: 0 0 0.5rem 0;
}

.version {
  font-size: 1rem;
  font-weight: 600;
  color: var(--mantine-color-chatbox-brand-filled);
  margin-bottom: 0.5rem;
}

.tagline {
  font-size: 0.875rem;
  color: var(--mantine-color-chatbox-secondary-text);
  line-height: 1.5;
}

/* Content Sections */
.about-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.info-section,
.features-section,
.actions-section,
.changelog-section,
.credits-section {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.75rem;
}

.info-section h2,
.features-section h2,
.actions-section h2,
.changelog-section h2,
.credits-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--mantine-color-chatbox-primary-text);
  margin: 0 0 1.5rem 0;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.5rem;
}

.info-label {
  font-size: 0.75rem;
  color: var(--mantine-color-chatbox-secondary-text);
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--mantine-color-chatbox-primary-text);
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.feature-card {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.5rem;
  transition: all 0.15s ease;
}

.feature-card:hover {
  background: rgba(255, 255, 255, 0.04);
  transform: translateY(-1px);
}

.feature-icon {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--mantine-color-chatbox-brand-light);
  color: var(--mantine-color-chatbox-brand-filled);
  border-radius: 0.5rem;
}

.feature-content {
  flex: 1;
}

.feature-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--mantine-color-chatbox-primary-text);
  margin-bottom: 0.5rem;
}

.feature-description {
  font-size: 0.875rem;
  color: var(--mantine-color-chatbox-secondary-text);
  line-height: 1.5;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.chatbox-button-primary,
.chatbox-button-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.chatbox-button-primary {
  background: var(--mantine-color-chatbox-brand-filled);
  color: white;
}

.chatbox-button-primary:hover {
  background: var(--mantine-color-chatbox-brand-filled-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.chatbox-button-secondary {
  background: var(--mantine-color-chatbox-bg-secondary);
  color: var(--mantine-color-chatbox-primary-text);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
}

.chatbox-button-secondary:hover {
  background: var(--mantine-color-chatbox-brand-outline-hover);
  transform: translateY(-1px);
}

/* Changelog */
.changelog-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.changelog-item {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.5rem;
}

.changelog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.changelog-version {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--mantine-color-chatbox-brand-filled);
}

.changelog-date {
  font-size: 0.875rem;
  color: var(--mantine-color-chatbox-secondary-text);
}

.changelog-content ul {
  margin: 0;
  padding-left: 1.5rem;
  color: var(--mantine-color-chatbox-primary-text);
}

.changelog-content li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

/* Credits */
.credits-content p {
  margin: 0 0 1.5rem 0;
  color: var(--mantine-color-chatbox-secondary-text);
  line-height: 1.6;
}

.credits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.credit-item {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.5rem;
}

.credit-name {
  font-weight: 600;
  color: var(--mantine-color-chatbox-primary-text);
  margin-bottom: 0.25rem;
}

.credit-description {
  font-size: 0.75rem;
  color: var(--mantine-color-chatbox-secondary-text);
}

/* Copyright */
.copyright-section {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid var(--mantine-color-chatbox-border-primary-outline);
  border-radius: 0.75rem;
  margin-top: 1rem;
}

.copyright-text {
  font-size: 0.875rem;
  color: var(--mantine-color-chatbox-secondary-text);
  line-height: 1.6;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .about-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    justify-content: center;
  }

  .changelog-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>