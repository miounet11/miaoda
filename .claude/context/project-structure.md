---
created: 2025-08-26T05:26:45Z
last_updated: 2025-08-26T05:26:45Z
version: 1.0
author: Claude Code PM System
---

# Project Structure

## Repository Organization

### Root Level Structure
```
miaoda/
├── .claude/                    # Claude Code PM system
│   ├── agents/                # Task-oriented agent configs
│   ├── commands/              # Command definitions (PM, context, testing)
│   ├── context/              # Project-wide context files (this directory)
│   ├── epics/                # Epic management workspace
│   ├── prds/                 # Product requirement documents
│   ├── rules/                # Rule files and guidelines
│   └── scripts/              # Utility scripts
├── miaoda-chat/              # Main application (Electron + Vue 3)
├── agentdocs/                # Additional documentation
├── CLAUDE.md                 # Main project guidance
├── README.md                 # Claude Code PM documentation
└── PROJECT_MANAGEMENT.md     # PM system overview
```

### MiaoDa Chat Application Structure
```
miaoda-chat/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── db/              # SQLite database layer
│   │   │   ├── database.ts  # Core database functionality
│   │   │   ├── ChatService.ts, MessageService.ts
│   │   │   └── SearchService.ts # Full-text search
│   │   ├── llm/             # LLM provider implementations
│   │   │   ├── llmManager.ts # Central LLM coordinator
│   │   │   ├── provider.ts   # Provider interface
│   │   │   └── customProviderManager.ts
│   │   ├── mcp/             # Model Context Protocol integration
│   │   │   ├── mcpManager.ts # MCP server management
│   │   │   └── servers.ts    # Server configurations
│   │   ├── plugins/         # Plugin system architecture
│   │   │   └── pluginManager.ts
│   │   └── ipcHandlers.ts   # IPC communication layer
│   ├── renderer/            # Vue 3 frontend
│   │   └── src/
│   │       ├── components/  # Vue components (feature-organized)
│   │       │   ├── chat/    # Chat-related components
│   │       │   ├── voice/   # Voice input/output
│   │       │   ├── search/  # Search functionality
│   │       │   ├── settings/ # Configuration UI
│   │       │   └── ui/      # Reusable UI components
│   │       ├── services/    # Frontend service layer
│   │       │   ├── voice/   # Voice processing
│   │       │   ├── export/  # Data export functionality
│   │       │   └── mcp/     # MCP integration
│   │       ├── stores/      # Pinia state management
│   │       │   ├── chat.ts  # Chat state
│   │       │   ├── settings.ts # App settings
│   │       │   └── ui.ts    # UI state
│   │       ├── views/       # Route-level components
│   │       └── types/       # TypeScript definitions
│   └── preload/            # Electron preload scripts
├── example-plugins/        # Plugin development examples
├── agentdocs/             # Development documentation
└── package.json           # Node.js configuration
```

## Key Directory Patterns

### Component Organization
- **Feature-based grouping**: Components organized by functionality (chat, voice, search)
- **Shared UI components**: Common elements in `components/ui/`
- **Test co-location**: `__tests__/` directories alongside components

### Service Layer Pattern
- **Backend services**: Main process services for database, LLM, MCP
- **Frontend services**: Renderer process services for UI logic
- **IPC bridge**: Clean separation via `ipcHandlers.ts`

### State Management
- **Pinia stores**: Centralized reactive state management
- **Persistent state**: Using pinia-plugin-persistedstate
- **Store organization**: Feature-based store modules

## File Naming Conventions

### TypeScript/Vue Files
- **Components**: PascalCase (e.g., `ChatInput.vue`, `VoiceRecorder.vue`)
- **Services**: PascalCase with suffix (e.g., `VoiceService.ts`, `ExportService.ts`)
- **Stores**: camelCase (e.g., `chat.ts`, `customProviders.ts`)
- **Types**: camelCase with `.ts` extension

### Test Files
- **Unit tests**: `*.test.ts` pattern
- **Component tests**: `ComponentName.test.ts`
- **Test utilities**: `test/` directory with shared utilities

## Module Dependencies

### Main Process Architecture
- **Database layer**: SQLite with better-sqlite3
- **LLM integration**: Multiple provider support (OpenAI, Anthropic, Google, Ollama)
- **MCP Protocol**: Tool integration and execution
- **Plugin system**: Dynamic plugin loading

### Renderer Process Architecture
- **Vue 3**: Composition API with TypeScript
- **UI Framework**: Tailwind CSS + Radix Vue components
- **State management**: Pinia with persistence
- **Build system**: Vite with electron-vite integration