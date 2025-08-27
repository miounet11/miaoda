---
created: 2025-08-26T05:26:45Z
last_updated: 2025-08-26T05:26:45Z
version: 1.0
author: Claude Code PM System
---

# Technical Context

## Technology Stack

### Core Framework
- **Platform**: Electron 35.5.1 (Cross-platform desktop application)
- **Frontend**: Vue 3.5.14 (Composition API + TypeScript)
- **Language**: TypeScript 5.8.3 (Strict mode enabled)
- **Build System**: Vite 6.0.7 + electron-vite 4.0.0
- **Package Manager**: pnpm >=8.0.0 (preferred), npm compatible

### UI & Styling
- **CSS Framework**: Tailwind CSS 3.4.17 with animations
- **Component Library**: Radix Vue 1.9.14 (headless UI components)
- **Icons**: Lucide Vue Next 0.511.0
- **Typography**: @tailwindcss/typography 0.5.16

### State Management & Data
- **State Management**: Pinia 3.0.3 with persistedstate plugin
- **Database**: better-sqlite3 11.5.0 (Local SQLite)
- **Data Validation**: Zod 3.24.3
- **HTTP Client**: Axios 1.7.9
- **Date Handling**: Day.js 1.11.13

### AI & LLM Integration
- **OpenAI**: openai 5.3.0
- **Anthropic Claude**: @anthropic-ai/sdk 0.53.0
- **Google AI**: @google/genai 1.5.1
- **Ollama**: ollama 0.5.16 (Local models)
- **MCP Protocol**: @modelcontextprotocol/sdk 1.13.1

### Development & Testing
- **Testing Framework**: Vitest 3.2.3 with @vue/test-utils 2.4.6
- **Test Environment**: happy-dom 15.11.7
- **Coverage**: @vitest/coverage-v8 3.2.3
- **Linting**: ESLint 9.16.0 + @typescript-eslint 8.0.0
- **Formatting**: Prettier 3.5.3

### Desktop Integration
- **Window State**: electron-window-state 5.0.3
- **Auto Updater**: electron-updater 6.1.7
- **Logging**: electron-log 5.3.3
- **Settings Storage**: electron-store 8.2.0

### Additional Features
- **Markdown**: marked 16.1.1 + highlight.js 11.11.1
- **PDF Export**: jspdf 3.0.1 + html2canvas 1.4.1
- **Voice/Audio**: Built-in Web Audio API
- **Drag & Drop**: SortableJS 1.15.6
- **Unique IDs**: nanoid 5.1.5

## Development Environment

### Node.js Requirements
- **Minimum Version**: Node.js >=20.0.0
- **Package Manager**: pnpm >=8.0.0 (recommended)
- **TypeScript**: Strict mode with comprehensive type checking

### Build Configuration
- **Bundler**: Vite with custom Electron configuration
- **Target**: ES2020 with Node.js compatibility
- **Output**: `out/` directory for Electron distribution
- **Source Maps**: Enabled for development

### Testing Setup
- **Environment**: jsdom-like with happy-dom
- **Coverage Threshold**: 70% (branches, functions, lines, statements)
- **Test Patterns**: `**/*.test.ts`, `**/*.spec.ts`
- **Mocking**: Comprehensive Electron API mocks

### Code Quality
- **ESLint**: TypeScript + Vue rules configured
- **Prettier**: Consistent code formatting
- **Type Checking**: `tsc --noEmit` for validation
- **Pre-commit**: Quality gates before commits

## Architecture Patterns

### Electron Architecture
- **Main Process**: Node.js backend with database, LLM, file system access
- **Renderer Process**: Vue 3 frontend with restricted Node.js access
- **Preload Scripts**: Secure IPC communication bridge
- **Context Isolation**: Security-first approach

### Vue 3 Patterns
- **Composition API**: Preferred over Options API
- **Composables**: Reusable logic in `composables/` directory
- **Single File Components**: `.vue` files with `<script setup>`
- **Props Interface**: TypeScript interfaces for component props

### State Management
- **Pinia Stores**: Feature-based store organization
- **Persistent State**: Automatic localStorage synchronization
- **Reactive State**: Vue 3 reactivity system integration
- **Type Safety**: Full TypeScript support

## Performance Considerations

### Frontend Optimization
- **Virtual Scrolling**: For large chat message lists
- **Lazy Loading**: Component and route-based code splitting
- **Image Optimization**: Efficient attachment handling
- **Memory Management**: Proper cleanup in composables

### Database Performance
- **SQLite FTS**: Full-text search indexing
- **Query Optimization**: Indexed searches and pagination
- **Connection Pooling**: Efficient database connections
- **Batch Operations**: Bulk insert/update operations

### Build Optimization
- **Tree Shaking**: Unused code elimination
- **Bundle Splitting**: Vendor and app code separation
- **Minification**: Production code optimization
- **Asset Optimization**: Image and font compression

## Development Dependencies

### Key Dev Tools
- **@electron-toolkit/***: Electron development utilities
- **@vitejs/plugin-vue**: Vue 3 Vite integration
- **@vueuse/core**: Vue composition utilities
- **class-variance-authority**: Tailwind component variants
- **quality-mcp**: Code quality MCP integration