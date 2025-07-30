# MiaoDa Chat - 项目开发指南

## 项目概述

**项目名称**: MiaoDa Chat  
**项目路径**: `/Users/lu/Documents/miaodachat/miaoda-chat`  
**项目类型**: Electron + Vue 3 + TypeScript 聊天应用

## 重要提醒

⚠️ **开发目标明确**: 本项目位于 `/Users/lu/Documents/miaodachat/miaoda-chat` 目录下  
⚠️ **避免混淆**: 不要与其他类似项目混淆，始终在正确目录下工作  
⚠️ **架构理解**: 基于 Electron 主进程/渲染进程分离架构

## 项目架构

### 目录结构
```
miaoda-chat/
├── src/
│   ├── main/                 # 主进程代码
│   │   ├── db/               # 数据库相关
│   │   ├── llm/              # LLM管理
│   │   ├── mcp/              # MCP协议支持
│   │   ├── plugins/          # 插件系统
│   │   └── presenter/        # 业务逻辑层
│   ├── renderer/             # 渲染进程代码
│   │   └── src/
│   │       ├── components/   # Vue组件
│   │       ├── services/     # 前端服务
│   │       ├── stores/       # 状态管理
│   │       ├── views/        # 页面视图
│   │       └── types/        # 类型定义
│   └── preload/              # 预加载脚本
└── agentdocs/                # 项目文档
```

### 现有功能
1. **聊天系统**: 基本的聊天界面和消息处理
2. **搜索功能**: 完善的SearchService，支持全文搜索、过滤、缓存
3. **语音功能**: VoiceService支持语音输入和合成
4. **插件系统**: 支持动态加载插件
5. **多窗口支持**: 窗口管理和标签页功能
6. **数据库**: SQLite本地存储聊天记录

### 数据库结构
```sql
-- 聊天表
CREATE TABLE chats (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 消息表  
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  role TEXT NOT NULL,        -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (chat_id) REFERENCES chats(id)
);
```

## 当前开发任务

### 第四阶段目标: 实现导出功能
用户明确表示"用户历史对话记录保存 这块也非常关键"，需要实现完整的导出功能。

### 功能需求
1. **导出格式**: Markdown, JSON, HTML, TXT
2. **导出范围**: 单个聊天、多个聊天、全部聊天
3. **过滤选项**: 时间范围、消息类型、包含元数据等
4. **用户界面**: 易用的导出对话框
5. **文件下载**: 浏览器下载功能

### 技术实现路径
1. **后端服务**: 在 `services/export/` 创建ExportService
2. **前端组件**: 创建导出对话框组件
3. **界面集成**: 在ChatView中添加导出按钮
4. **IPC通信**: 实现渲染进程与主进程的数据交互

## 开发规范

### 代码风格
- TypeScript严格模式
- Vue 3 Composition API
- 组件化开发
- 服务化架构

### 文件命名
- 组件: PascalCase (如 ExportDialog.vue)
- 服务: PascalCase (如 ExportService.ts)
- 类型: interface/type定义统一管理

### Git提交
- 每完成一个功能模块提交一次
- 提交信息使用中文，描述清晰

## 开发进度跟踪

### 已完成
- [x] 项目架构分析
- [x] ExportService基础实现

### 进行中
- [ ] 完善ExportService的IPC通信
- [ ] 创建导出对话框组件
- [ ] 集成到ChatView界面

### 待完成
- [ ] 测试导出功能
- [ ] 优化用户体验
- [ ] 文档更新

## 重要提醒

1. **始终确认工作目录**: `/Users/lu/Documents/miaodachat/miaoda-chat`
2. **理解现有架构**: 不要重复造轮子，利用现有的服务和组件
3. **保持一致性**: 与现有代码风格和架构保持一致
4. **渐进开发**: 每次完成一个小功能，确保稳定性

---
最后更新: 2025-07-29  
更新人: Claude AI助手