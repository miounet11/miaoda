---
created: 2025-08-26T05:26:45Z
last_updated: 2025-08-26T05:26:45Z
version: 1.0
author: Claude Code PM System
---

# System Patterns

## Architectural Design Patterns

### Electron Multi-Process Architecture
- **Process Separation**: Clear distinction between main and renderer processes
- **IPC Communication**: Structured message passing via `ipcHandlers.ts`
- **Security Model**: Context isolation with preload scripts
- **Resource Management**: Main process handles file system, database, and external APIs

### Service Layer Pattern
**Main Process Services:**
- `ChatService` - Database operations for chat management
- `MessageService` - Message CRUD and retrieval
- `SearchService` - Full-text search functionality
- `LLMManager` - Multi-provider LLM coordination
- `MCPManager` - Model Context Protocol integration
- `PluginManager` - Dynamic plugin loading and execution

**Renderer Services:**
- `VoiceService` - Speech recognition and synthesis
- `ExportService` - Data export functionality
- `ToastService` - User notification system
- `WindowManager` - Multi-window state management

### Repository Pattern
- **Database Abstraction**: `BaseDatabaseService` as foundation
- **Specialized Repositories**: Chat, Message, Search services extend base
- **Query Builders**: Structured SQL generation (`SearchQueryBuilder`)
- **Transaction Management**: Consistent database operations

### Provider Pattern
- **LLM Providers**: Standardized interface for OpenAI, Anthropic, Google, Ollama
- **Custom Providers**: User-defined LLM endpoints
- **Provider Factory**: Dynamic provider instantiation
- **Configuration Management**: Per-provider settings and validation

### Plugin Architecture
- **Dynamic Loading**: Runtime plugin discovery and initialization
- **Manifest System**: Plugin metadata and capability declaration
- **Isolation**: Sandboxed plugin execution environment
- **API Bridge**: Structured plugin-to-app communication

## Vue 3 Composition Patterns

### Composable Pattern
**Reusable Logic Extraction:**
- `useChat` - Chat state and operations
- `useErrorHandler` - Error management and display
- `useKeyboardShortcuts` - Global hotkey handling
- `useTheme` - Theme switching and persistence
- `useResponsive` - Responsive design utilities

### Component Composition
- **Feature Components**: Self-contained functionality (`ChatInput`, `VoiceRecorder`)
- **Layout Components**: Structural elements (`TabBar`, `Window`)
- **UI Components**: Reusable interface elements (`Toast`, `ContextMenu`)
- **Smart/Dumb Pattern**: Container vs presentational components

### State Management Patterns
**Pinia Store Organization:**
- **Feature Stores**: Domain-specific state (`chat.ts`, `settings.ts`)
- **UI Stores**: Interface state (`ui.ts` for themes, modals)
- **Auth Stores**: User authentication and session management
- **Reactive Getters**: Computed properties for derived state

## Data Flow Patterns

### Unidirectional Data Flow
1. **User Action** → Component Event
2. **Component Event** → Store Action
3. **Store Action** → Service Call (if needed)
4. **Service Response** → Store Mutation
5. **Store Update** → Component Re-render

### Event-Driven Architecture
- **IPC Events**: Main ↔ Renderer communication
- **Vue Events**: Parent-child component communication
- **Global Events**: Application-wide state changes
- **Service Events**: Background process notifications

### Streaming Data Pattern
- **LLM Streaming**: Real-time response rendering
- **Voice Input**: Continuous audio processing
- **Search Results**: Progressive result loading
- **File Operations**: Progress indication

## Error Handling Patterns

### Layered Error Handling
1. **Service Level**: Catch and log technical errors
2. **Store Level**: Transform errors for UI consumption
3. **Component Level**: Display user-friendly messages
4. **Global Level**: Fallback error boundaries

### Error Recovery Strategies
- **Graceful Degradation**: Disable features when services unavailable
- **Retry Logic**: Automatic retry for transient failures
- **User Feedback**: Clear error messages with actionable steps
- **State Restoration**: Recover from failed operations

## Performance Patterns

### Virtual Scrolling
- **Large Lists**: Efficient rendering of chat message histories
- **Dynamic Heights**: Variable message content support
- **Memory Management**: Only render visible items
- **Smooth Scrolling**: Optimized scroll performance

### Caching Strategies
- **LLM Response Caching**: Avoid redundant API calls
- **Search Result Caching**: Fast repeated searches
- **Asset Caching**: Image and file attachment optimization
- **State Persistence**: Automatic state restoration

### Lazy Loading
- **Route-based**: Load views on demand
- **Component-based**: Heavy components loaded when needed
- **Plugin Loading**: Dynamic plugin initialization
- **Asset Loading**: Images and media on-demand

## Security Patterns

### Input Validation
- **Zod Schemas**: Runtime type validation
- **Sanitization**: XSS prevention in chat content
- **File Validation**: Safe file attachment handling
- **API Input Validation**: Structured API parameter checking

### Data Protection
- **Context Isolation**: Renderer process security
- **Secure Storage**: Encrypted settings storage
- **API Key Management**: Secure credential handling
- **CORS Configuration**: Restricted external access

## Testing Patterns

### Test Organization
- **Unit Tests**: Individual function and component testing
- **Integration Tests**: Service interaction testing
- **Component Tests**: Vue component behavior testing
- **E2E Tests**: Full workflow testing

### Mocking Strategies
- **Electron APIs**: Comprehensive electron mocking
- **External Services**: LLM provider mocking
- **File System**: Safe file operation mocking
- **Network Requests**: HTTP request interception

### Test Utilities
- **Component Factories**: Reusable component test setup
- **Mock Data**: Consistent test data generation
- **Assertion Helpers**: Custom test matchers
- **Test Cleanup**: Proper test isolation