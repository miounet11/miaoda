# Chatbox 完整复刻执行计划

## 项目背景
复刻 Chatbox (https://web.chatboxai.app/) 的界面和功能，实现 100% 视觉对齐，同时保持 MiaoDa Chat 的技术优势。

## 目标
1. 外观 100% 复制 Chatbox 界面布局
2. 交互行为完全一致
3. 保持现有数据架构和性能优势  
4. 为后续超越功能奠定基础

## 技术方案
采用混合增强方案：
- 前端界面完全重构为 Chatbox 风格
- 后端服务保持现有架构不变
- 新增 UI 适配层实现数据转换

## 分阶段执行计划

### Phase 1: 基础布局架构 (2-3小时)
**目标**: 搭建左右双面板布局框架

1.1 创建主布局框架 
- 文件: `views/ChatboxLayoutView.vue`
- 实现 30%|70% 左右分栏布局
- 响应式设计支持

1.2 创建顶部品牌栏
- 文件: `components/layout/ChatboxTopBar.vue` 
- Chatbox logo 和标题
- 菜单切换按钮

1.3 路由配置更新
- 文件: `router/index.ts`
- 设置新布局为默认路由

### Phase 2: 左侧边栏实现 (3-4小时)
**目标**: 完整复刻 Chatbox 侧边栏功能

2.1 侧边栏基础框架
- 文件: `components/chatbox/ChatboxSidebar.vue`
- 可折叠容器
- 分区域布局

2.2 会话列表组件  
- 文件: `components/chatbox/ChatboxSessionList.vue`
- 集成现有 ChatService
- 完全复制 UI 样式
- 点击切换功能

2.3 机器人模板系统
- 文件: `components/chatbox/ChatboxBotTemplates.vue`
- 预定义模板数据
- 点击创建新会话

2.4 新建按钮区域
- New Chat/Images 按钮
- Settings/About 链接

### Phase 3: 右侧主区域重构 (3-4小时)
**目标**: 主聊天区域完全对齐 Chatbox

3.1 主区域容器
- 文件: `components/chatbox/ChatboxMainArea.vue`
- 集成现有消息组件
- 条件渲染控制

3.2 欢迎屏幕重制
- 文件: `components/chatbox/ChatboxWelcome.vue`
- 100% 复制欢迎界面
- 快捷操作建议

3.3 输入区域增强
- 文件: `components/chatbox/ChatboxInputArea.vue`
- 工具栏按钮
- 模型选择器集成

### Phase 4: 状态管理整合 (2小时)
**目标**: UI 状态与数据层完美集成

4.1 UI状态管理
- 文件: `stores/chatboxUI.ts`
- 侧边栏折叠状态
- 当前选中会话

4.2 模板数据管理  
- 文件: `stores/botTemplates.ts`
- 预定义模板
- 模板创建逻辑

### Phase 5: 样式精细调优 (2-3小时)
**目标**: 视觉效果 100% 对齐

5.1 CSS样式文件
- 文件: `styles/chatbox.css` 
- 完全复制色彩系统
- 字体间距细节对齐

5.2 动画和过渡
- 折叠动画
- 切换过渡
- 点击反馈

### Phase 6: 集成测试和优化 (1-2小时)
**目标**: 确保功能稳定性和性能

6.1 功能测试
- 会话 CRUD 流程
- 模型选择切换
- 消息收发测试

6.2 性能优化
- 虚拟列表优化
- 内存泄漏检查
- 响应速度优化

## 技术实现要点

### 数据流架构
```typescript
现有数据层 (不变)
├── ChatService
├── MessageService  
└── LLMManager

新增UI适配层
├── ChatboxUIAdapter
├── SessionListAdapter
└── ModelSelectorAdapter

Chatbox UI 层
├── ChatboxSidebar
├── ChatboxMainArea
└── ChatboxInputArea
```

### 组件复用策略
- 复用: ChatMessage, TypingIndicator, MessageActions
- 新建: ChatboxSidebar, SessionList, BotTemplates
- 改造: ChatInput (增强为工具栏模式)

### 关键技术决策
1. 保持现有 Pinia stores 不变
2. 新增 chatboxUI store 管理界面状态  
3. 使用事件总线模式处理组件通信
4. CSS 变量系统复制 Chatbox 设计令牌

## 验收标准
1. 用户无法区分与真实 Chatbox 的视觉差异
2. 所有基础功能(新建/切换/发送消息)正常
3. 现有用户数据完整保留和显示
4. 应用性能不低于重构前水平

## 风险控制
1. 保留现有路由作为备选方案
2. 数据层完全隔离,确保不影响现有功能
3. 分阶段提交,每个 Phase 独立可回滚
4. 充分测试后再切换默认界面

## 预期时间
总计: 12-18 小时
核心功能可用: 8-10 小时
完美复刻: 12-18 小时

## 成功指标
短期: 界面100%对齐,基础功能完备
中期: 用户体验优于原版,性能更好
长期: 成为用户心中的"Chatbox Plus"