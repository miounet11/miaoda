<template>
  <div class="analytics-view">
    <!-- 简化的统计页面 -->
    <div class="simple-analytics-content">
      <div class="analytics-header">
        <button @click="$router.push('/')" class="back-btn">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1>使用统计</h1>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">💬</div>
          <div class="stat-content">
            <div class="stat-number">{{ totalChats }}</div>
            <div class="stat-label">总对话数</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⚡</div>
          <div class="stat-content">
            <div class="stat-number">{{ totalMessages }}</div>
            <div class="stat-label">总消息数</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <div class="stat-number">{{ avgResponseTime }}</div>
            <div class="stat-label">平均响应时间</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <div class="stat-number">{{ daysUsed }}</div>
            <div class="stat-label">使用天数</div>
          </div>
        </div>
      </div>

      <div class="usage-tips">
        <h2>使用建议</h2>
        <div class="tips-list">
          <div class="tip-item">
            <span class="tip-icon">💡</span>
            <span>尝试不同的AI模型，找到最适合您的问题类型的模型</span>
          </div>
          <div class="tip-item">
            <span class="tip-icon">🎨</span>
            <span>自定义您的界面主题，让聊天体验更舒适</span>
          </div>
          <div class="tip-item">
            <span class="tip-icon">📱</span>
            <span>定期备份您的对话记录，确保数据安全</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 简化的统计数据
const totalChats = ref(0)
const totalMessages = ref(0)
const avgResponseTime = ref('1.2秒')
const daysUsed = ref(0)

// 加载统计数据
const loadStats = () => {
  // 从本地存储或其他地方获取统计数据
  const chats = JSON.parse(localStorage.getItem('miaoda-chats') || '[]')
  totalChats.value = chats.length

  // 简化的统计计算
  totalMessages.value = chats.reduce(
    (total: number, chat: any) => total + (chat.messages?.length || 0),
    0
  )
  daysUsed.value = Math.max(1, Math.floor(Math.random() * 30)) // 模拟数据
}
</script>

<style scoped>
.analytics-view {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.simple-analytics-content {
  max-width: 800px;
  margin: 0 auto;
}

.analytics-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.back-btn {
  padding: 8px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.analytics-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 48px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 32px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.usage-tips {
  background: #f8fafc;
  border-radius: 12px;
  padding: 24px;
}

.usage-tips h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.tip-icon {
  font-size: 20px;
}

@media (max-width: 768px) {
  .analytics-view {
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 16px;
  }

  .tip-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
