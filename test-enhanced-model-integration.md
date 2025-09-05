# 增强模型配置集成测试

## 测试计划

这个文档描述了如何测试新实现的增强模型配置集成功能。

## 测试目标

验证以下功能是否正常工作：

1. **提供商管理**
   - [x] 扩展ProviderFactory支持国内大模型（DeepSeek、通义千问、Kimi等）
   - [x] IPC接口桥接前后端配置数据
   - [ ] 前端能正确显示所有可用提供商

2. **配置管理**
   - [x] 配置数据保存到后端（electron-store）而非localStorage
   - [x] 配置数据可以正确加载
   - [ ] 配置验证和错误处理

3. **连接测试**
   - [x] 后端API支持连接测试
   - [ ] 实际连接测试工作正常
   - [ ] 错误信息正确传递

4. **消息发送**
   - [x] 增强模型配置可以用于发送消息
   - [ ] 流式响应正确处理
   - [ ] 不同提供商的消息格式转换

## 手动测试步骤

### 1. 启动应用

```bash
cd miaoda-chat
npm run dev
```

### 2. 测试提供商列表

1. 打开开发者工具
2. 执行以下代码检查提供商列表：

```javascript
// 测试后端API
window.electronAPI.enhancedModel
  .getAllProviders()
  .then(providers => console.log('Available providers:', providers))

// 测试前端服务
import { useEnhancedModelConfig } from '@/services/model/EnhancedModelConfigService'
const { presetProviders } = useEnhancedModelConfig()
console.log('Preset providers:', presetProviders.value)
```

### 3. 测试配置保存和加载

```javascript
// 保存测试配置
const testConfig = {
  deepseek: {
    apiKey: 'test-key',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    configured: false
  }
}

window.electronAPI.enhancedModel.saveConfig(testConfig).then(() => console.log('Config saved'))

// 加载配置
window.electronAPI.enhancedModel.loadConfig().then(config => console.log('Loaded config:', config))
```

### 4. 测试连接（需要真实API密钥）

```javascript
// 测试DeepSeek连接
const testConfig = {
  providerId: 'deepseek',
  apiKey: 'sk-your-actual-deepseek-api-key',
  baseUrl: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat'
}

window.electronAPI.enhancedModel
  .testConnection(testConfig)
  .then(result => console.log('Connection test result:', result))
```

### 5. 测试消息发送（需要已配置的提供商）

```javascript
const messages = [{ role: 'user', content: '你好，请简单介绍一下自己' }]

const modelConfig = {
  providerId: 'deepseek',
  apiKey: 'sk-your-actual-deepseek-api-key',
  baseUrl: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat'
}

window.electronAPI.enhancedModel
  .sendMessage(messages, modelConfig)
  .then(response => console.log('AI Response:', response))
```

## 预期结果

1. **提供商列表**: 应该包含所有国内外大模型（DeepSeek、通义千问、Kimi、百度文心、智谱清言、MiniMax等）
2. **配置管理**: 配置能正确保存到后端并重新加载
3. **连接测试**: 有效的API密钥应该能通过连接测试
4. **消息发送**: 配置正确的提供商应该能正常发送和接收消息

## 已实现的架构改进

### 后端集成

- ✅ 扩展了 `ProviderFactory` 支持所有主流大模型
- ✅ 创建了 OpenAI 兼容的提供商适配器
- ✅ 添加了百度文心的特殊处理（支持 secretKey）
- ✅ 更新了 IPC 处理器，增加了增强模型配置相关接口

### 前端集成

- ✅ 修改了 `EnhancedModelConfigService` 使用后端 API 而非 localStorage
- ✅ 更新了 preload 脚本暴露新的 API 接口
- ✅ 添加了消息发送方法使用增强模型配置

### API 接口

- ✅ `enhanced-model:get-all-providers` - 获取所有提供商
- ✅ `enhanced-model:test-connection` - 测试提供商连接
- ✅ `enhanced-model:send-message` - 使用增强配置发送消息
- ✅ `enhanced-model:save-config` / `load-config` - 配置管理
- ✅ `enhanced-model:get-active-config` / `set-active-config` - 激活配置管理

## 下一步

1. 在实际应用中集成这些API到用户界面
2. 实现模型切换功能
3. 添加流式响应支持
4. 完善错误处理和用户反馈
