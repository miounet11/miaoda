<template>
  <div class="plugins-view">
    <!-- 简化的插件页面 - 免费版本 -->
    <div class="simple-plugins-content">
      <div class="plugins-header">
        <h1>扩展功能</h1>
        <p class="description">MiaoDa Chat 提供丰富的免费功能，无需安装插件</p>
      </div>

      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🤖</div>
          <h3>多LLM支持</h3>
          <p>支持OpenAI、Claude、Gemini等多种AI模型，一键切换</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">💬</div>
          <h3>智能对话</h3>
          <p>流畅的对话体验，上下文理解，个性化回复</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">📱</div>
          <h3>跨平台同步</h3>
          <p>免费云端同步，数据安全可控</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🎨</div>
          <h3>个性化设置</h3>
          <p>自定义界面主题、字体大小等</p>
        </div>
      </div>

      <div class="coming-soon">
        <h2>即将推出</h2>
        <div class="coming-features">
          <span class="feature-tag">语音对话</span>
          <span class="feature-tag">图片识别</span>
          <span class="feature-tag">文件处理</span>
          <span class="feature-tag">多语言支持</span>
        </div>
        <p class="coming-note">所有新功能发布时也将完全免费</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 简化的插件页面组件
</script>

<style scoped>
.plugins-view {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.simple-plugins-content {
  text-align: center;
}

.plugins-header {
  margin-bottom: 48px;
}

.plugins-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
}

.description {
  font-size: 18px;
  color: #6b7280;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 64px;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 32px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.feature-card h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.feature-card p {
  color: #6b7280;
  line-height: 1.5;
}

.coming-soon {
  background: #f8fafc;
  border-radius: 12px;
  padding: 32px;
}

.coming-soon h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.coming-features {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 16px;
}

.feature-tag {
  background: #e0f2fe;
  color: #0369a1;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.coming-note {
  color: #6b7280;
  font-size: 16px;
}
</style>
