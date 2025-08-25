# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MiaoDa Chat is a modern AI chat client built with Electron + Vue 3 + TypeScript. It supports multiple LLM providers (OpenAI, Anthropic Claude, Google, Ollama) with MCP tool integration and an extensible plugin system.

**Important**: The actual project is located in the `miaoda-chat/` subdirectory.

## Essential Commands

### Development
```bash
# Navigate to project directory first
cd miaoda-chat

# Install dependencies (uses pnpm)
npm install

# Run in development mode
npm run dev

# Run tests
npm run test
npm run test:watch      # Watch mode
npm run test:ui         # UI testing interface
npm run test:coverage   # Coverage report

# Lint and type check
npm run lint
npm run typecheck
npm run format

# Build for production
npm run build:mac       # macOS
npm run build:win       # Windows  
npm run build:linux     # Linux
```

### Testing Single Files
```bash
# Run specific test file
npm run test -- src/renderer/src/components/__tests__/ChatInput.test.ts

# Run tests with specific pattern
npm run test -- --watch src/renderer/src/stores
```

## Architecture Overview

### Core Technologies
- **Frontend**: Vue 3 (Composition API) + TypeScript + Tailwind CSS + Pinia + Radix Vue
- **Desktop**: Electron with better-sqlite3 database
- **Build Tools**: Vite + electron-vite + electron-builder
- **Testing**: Vitest + @vue/test-utils + happy-dom
- **LLM SDKs**: OpenAI, Anthropic, Google GenAI, Ollama

### Key Directories
```
miaoda-chat/
├── src/
│   ├── main/              # Electron main process
│   │   ├── db/           # SQLite database layer
│   │   ├── llm/          # LLM provider implementations
│   │   ├── mcp/          # Model Context Protocol integration
│   │   ├── plugins/      # Plugin system architecture
│   │   └── ipcHandlers.ts # IPC communication handlers
│   ├── renderer/src/      # Vue 3 frontend
│   │   ├── components/   # Vue components (organized by feature)
│   │   ├── services/     # Frontend service layer
│   │   ├── stores/       # Pinia state management
│   │   ├── views/        # Route-level components
│   │   └── types/        # TypeScript type definitions
│   └── preload/          # Electron preload scripts
├── example-plugins/       # Example plugin implementations
└── agentdocs/            # Project documentation and planning
```

### IPC Communication Pattern
Main process exposes services through IPC handlers in `ipcHandlers.ts`:
- Database operations (chat/message CRUD)
- LLM streaming responses  
- File operations and attachments
- MCP tool execution
- Plugin management

### State Management Architecture
Pinia stores provide reactive state management:
- `chat.ts` / `chat-enhanced.ts`: Chat conversations and messages
- `settings.ts`: User preferences and LLM configurations  
- `ui.ts`: UI state and theming
- `auth.ts`: Authentication state

### Database Schema
SQLite with tables for:
- `chats`: Chat conversations with metadata
- `messages`: Chat messages with role, content, attachments
- `search_index`: Full-text search index for messages

## Development Workflow

### Component Development
1. Follow existing patterns in `src/renderer/src/components/`
2. Use TypeScript interfaces for props (defined in `types/`)
3. Implement unit tests in `__tests__/` directories
4. Follow Vue 3 Composition API patterns
5. Use Tailwind classes with design system consistency

### Service Layer Pattern
Create services in `src/renderer/src/services/` for:
- Backend communication (`BackendSearchService.ts`)
- Feature logic (`VoiceService.ts`, `ExportService.ts`)
- External integrations (`MCPService.ts`)

### Adding New LLM Provider
1. Implement provider interface in `src/main/llm/provider.ts`
2. Add provider to LLM manager in `src/main/llm/llmManager.ts`
3. Update settings UI in `src/renderer/src/views/SettingsView.vue`

### Plugin Development
1. See `docs/PLUGIN_DEVELOPMENT.md` for plugin API
2. Example plugins in `example-plugins/` directory
3. Plugin manager handles loading in `src/main/plugins/pluginManager.ts`

## Critical Development Notes

### Testing Strategy
- Unit tests for components and services
- Coverage thresholds: 70% (branches/functions/lines/statements)
- Test setup in `src/test/setup.ts`
- Mocking patterns established for Electron APIs

### Code Quality Requirements
- TypeScript strict mode enabled
- ESLint configuration with Vue/TypeScript rules
- Prettier for code formatting
- No build warnings or type errors allowed

### MCP Integration
- MCP servers defined in `src/main/mcp/servers.ts`
- Tool execution through MCP manager
- In-memory servers for code execution and filesystem access

### Multi-Window Support
Window management through services in `src/renderer/src/services/window/`

### Performance Considerations
- Virtual scrolling for large chat histories
- Streaming responses for LLM interactions
- SQLite FTS for fast message search
- Lazy loading of components where appropriate