# MiaoDa Chat API 配置指南

## 📋 快速配置 LLM API

### 🎯 当前状态说明

MiaoDa Chat 已经集成了完整的 LLM API 支持，但需要正确的配置才能获得真实的 AI 回复。目前应用会显示：

- **🔴 未配置状态**: 使用内置默认回复
- **🟢 已连接状态**: 使用真实 API 智能回复

### 🚀 快速配置步骤

#### 1. 打开设置页面

在 MiaoDa Chat 主界面中：
1. 点击右上角的 **设置按钮** (⚙️)
2. 进入设置页面

#### 2. 配置 API 密钥

##### Option A: 配置 OpenAI API
```
API 提供商: OpenAI
API 密钥: sk-your-openai-api-key-here
模型名称: gpt-3.5-turbo (推荐) 或 gpt-4-turbo
```

##### Option B: 配置 Claude API (Anthropic)
```
API 提供商: Anthropic
API 密钥: sk-ant-your-claude-api-key-here
模型名称: claude-3-sonnet-20240229
```

##### Option C: 配置 Gemini API (Google)
```
API 提供商: Google Gemini
API 密钥: your-gemini-api-key-here
模型名称: gemini-pro
```

#### 3. 测试配置

配置完成后：
1. 返回聊天页面
2. 发送一条测试消息（如："你好，请介绍一下你自己"）
3. 观察顶部状态指示器：
   - **🟢 绿色**: API 连接成功
   - **🔴 红色**: 连接失败

### 📝 获取 API 密钥

#### OpenAI API 密钥
1. 访问: https://platform.openai.com/api-keys
2. 登录 OpenAI 账户
3. 创建新的 API Key
4. 复制密钥并妥善保存

#### Claude API 密钥
1. 访问: https://console.anthropic.com/
2. 登录 Anthropic 账户
3. 在 API Keys 页面创建密钥
4. 复制密钥

#### Gemini API 密钥
1. 访问: https://makersuite.google.com/app/apikey
2. 登录 Google 账户
3. 创建新的 API 密钥
4. 复制密钥

### 🔧 高级配置选项

#### 自定义 API 端点
```json
{
  "provider": "openai",
  "apiKey": "your-api-key",
  "baseUrl": "https://api.openai.com/v1", // 自定义端点
  "model": "gpt-3.5-turbo",
  "timeout": 30000, // 超时时间(ms)
  "maxRetries": 3   // 重试次数
}
```

#### 本地 Ollama 配置
```json
{
  "provider": "ollama",
  "baseUrl": "http://localhost:11434",
  "model": "llama2"
}
```

### 📊 配置验证

#### 成功配置的标志
- ✅ 顶部状态显示 "已连接"
- ✅ 发送消息后显示 "正在思考中..."
- ✅ 收到智能、个性化的回复
- ✅ 回复内容与预设模板不同

#### 配置问题的排查
- ❌ 状态显示 "未配置" → 检查 API 密钥是否正确输入
- ❌ 状态显示 "连接错误" → 检查网络连接和 API 密钥有效性
- ❌ 回复内容仍是默认模板 → 检查配置是否保存成功

### 🎮 测试用例

#### 测试消息示例
```
1. "请解释什么是机器学习" - 验证专业知识
2. "写一首关于春天的诗" - 验证创作能力
3. "分析当前科技发展趋势" - 验证分析能力
4. "用Python写一个Hello World程序" - 验证编程能力
```

#### 预期结果
- **真实 API**: 获得详细、专业、个性化的回复
- **默认模式**: 获得通用、简短的预设回复

### 🔒 安全注意事项

1. **API 密钥保护**
   - 密钥存储在本地，不会上传到服务器
   - 使用系统密钥链进行加密存储
   - 定期更换 API 密钥

2. **使用建议**
   - 合理控制 API 调用频率
   - 监控 API 使用量和费用
   - 设置合理的超时和重试策略

3. **隐私保护**
   - 聊天内容仅在本地处理
   - 支持数据导出和清理功能
   - 符合隐私保护标准

### 🆘 故障排除

#### 常见问题

**Q: 配置了 API 密钥但状态仍显示未连接？**
A: 请检查：
1. API 密钥格式是否正确
2. 网络连接是否正常
3. API 账户是否有余额
4. 模型名称是否支持

**Q: 发送消息后显示网络错误？**
A: 请检查：
1. 网络连接稳定性
2. API 服务是否可用
3. 防火墙设置
4. VPN 配置

**Q: API 调用费用过高？**
A: 建议：
1. 使用更经济的模型（如 gpt-3.5-turbo）
2. 设置消息长度限制
3. 定期检查使用统计

### 📈 性能优化建议

1. **模型选择**
   - 简单对话: gpt-3.5-turbo (快速、经济)
   - 复杂任务: gpt-4-turbo (质量更高)
   - 创意任务: claude-3 (创作能力强)

2. **缓存策略**
   - 启用智能缓存减少重复请求
   - 设置合理的缓存过期时间
   - 监控缓存命中率

3. **并发控制**
   - 限制同时进行的 API 请求数量
   - 实现请求队列管理
   - 添加请求优先级

### 🔄 更新和维护

- **定期更新**: 关注 API 服务商的最新模型和功能
- **监控使用量**: 通过平台控制台监控 API 使用情况
- **备份配置**: 定期备份 API 配置信息
- **安全更新**: 及时更新 API 密钥和安全设置

---

## 🎯 快速开始

1. **获取 API 密钥** (推荐 OpenAI)
2. **在设置页面配置密钥**
3. **发送测试消息验证连接**
4. **享受智能 AI 对话体验**

**配置完成后，您将获得与 ChatGPT、Claude 等专业 AI 模型同等水平的对话体验！** 🚀
