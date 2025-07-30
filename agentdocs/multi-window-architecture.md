# Multi-Window/Tab Architecture Implementation

## Overview

The MiaoDa Chat application has been enhanced with a comprehensive multi-window and tab management system, enabling users to organize their work across multiple windows and tabs efficiently. This architecture provides a modern, browser-like experience while maintaining the native feel of a desktop application.

## Architecture Components

### 1. WindowManager Service

**Location**: `src/renderer/src/services/window/WindowManager.ts`

The WindowManager is the core service that handles all window and tab operations:

#### Key Features:
- **Window Management**: Create, close, minimize, maximize windows
- **Tab Management**: Create, close, switch, move tabs within and between windows
- **Layout Persistence**: Save and restore window layouts
- **Event System**: Comprehensive event emission for UI synchronization
- **Multi-instance Support**: Handle multiple application windows

#### Core Methods:
```typescript
// Window operations
createWindow(options): Promise<string>
closeWindow(windowId, force?): Promise<boolean>
focusWindow(windowId): boolean
minimizeWindow(windowId): Promise<boolean>
maximizeWindow(windowId): Promise<boolean>

// Tab operations
createTab(windowId, options): Promise<WindowTab>
closeTab(windowId, tabId, force?): Promise<boolean>
switchTab(windowId, tabId): boolean
moveTab(windowId, tabId, newIndex): boolean
moveTabToWindow(sourceWindowId, tabId, targetWindowId): boolean

// Layout management
saveLayout(name, description?): Promise<string>
restoreLayout(layoutId): Promise<boolean>
```

### 2. Window Component

**Location**: `src/renderer/src/components/window/Window.vue`

The main window component that integrates all window functionality:

#### Features:
- **Window Controls**: Minimize, maximize, close buttons (macOS style)
- **TabBar Integration**: Embedded tab management
- **Content Area**: Dynamic content rendering based on active tab
- **Status Bar**: Connection status, tab count, time display
- **Window Menu**: Context menu for window operations
- **Resize Handles**: Manual window resizing (when not maximized)
- **Keyboard Shortcuts**: Full keyboard navigation support

#### Props:
```typescript
interface Props {
  windowId?: string
  showHeader?: boolean
  showStatusBar?: boolean
  allowTabDrag?: boolean
  showAddButton?: boolean
  showNavigation?: boolean
  showTabMenu?: boolean
  allowResize?: boolean
  maxTabWidth?: number
  minTabWidth?: number
}
```

### 3. TabBar Component

**Location**: `src/renderer/src/components/window/TabBar.vue`

Advanced tab management with full browser-like functionality:

#### Features:
- **Tab Display**: Icons, titles, modified indicators
- **Drag & Drop**: Reorder tabs within and between windows
- **Context Menu**: Right-click operations (duplicate, close, move)
- **Scrolling**: Navigation buttons for overflow
- **Keyboard Navigation**: Tab switching via keyboard
- **Loading States**: Visual feedback for tab operations
- **All Tabs Menu**: Dropdown for tab overview

#### Supported Tab Types:
- `chat` - Chat conversations
- `settings` - Application settings
- `tools` - MCP tool interfaces
- `plugins` - Plugin management
- `file` - File editor
- `browser` - Web browser
- `terminal` - Terminal emulator
- `notes` - Note taking
- `custom` - Extensible custom types

### 4. TabContent Component

**Location**: `src/renderer/src/components/window/TabContent.vue`

Smart content router that renders appropriate views based on tab type:

#### Features:
- **Dynamic Loading**: Code-split view components
- **Error Handling**: Graceful error states with retry
- **Loading States**: Visual feedback during content loading
- **Auto-save**: Automatic saving for modified content
- **Keyboard Shortcuts**: Type-specific keyboard handling
- **Debug Mode**: Development debugging panel

### 5. View Components

**Location**: `src/renderer/src/views/`

Specialized view components for different tab types:

#### ToolsView.vue
- MCP tool discovery and execution
- Categorized tool organization
- Real-time tool status

#### PluginsView.vue
- Plugin management interface
- Install/uninstall operations
- Plugin development tools

#### FileView.vue
- Code editor with syntax highlighting
- File operations (save, readonly toggle)
- Cursor position tracking

#### BrowserView.vue
- Embedded browser functionality
- Navigation controls
- Developer tools integration

#### TerminalView.vue
- Terminal emulation
- Command history
- Customizable themes

#### NotesView.vue
- Markdown editor with preview
- Export functionality
- Real-time collaboration ready

## Integration Points

### App.vue Integration

The main application component has been updated to support both multi-window and legacy single-window modes:

```typescript
// Feature flag for multi-window support
const useMultiWindow = ref(true)

// Global shortcuts for window/tab operations
handleNewChat()      // Ctrl/Cmd + T
handleNewWindow()    // Ctrl/Cmd + Shift + T  
handleCloseTab()     // Ctrl/Cmd + W
handleOpenSettings() // Ctrl/Cmd + ,
```

### MCP Service Integration

**Location**: `src/renderer/src/services/mcp/MCPService.ts`

The MCP (Model Context Protocol) service integrates with the window system for tool execution:

- Tool calls can be associated with specific tabs
- Results are displayed in appropriate tab contexts
- Server connection status is reflected in window status bars

## Event System

The architecture uses a comprehensive event system for coordination:

### Window Events:
- `window-created`: New window instantiated
- `window-closed`: Window closed
- `window-focused`: Window gained focus
- `window-bounds-changed`: Window resized/moved

### Tab Events:
- `tab-created`: New tab added
- `tab-closed`: Tab removed
- `tab-switched`: Active tab changed
- `tab-moved`: Tab reordered

### Layout Events:
- `layout-saved`: Layout configuration saved
- `layout-restored`: Layout configuration applied

## Testing Strategy

### Unit Tests

**WindowManager Tests**: `src/renderer/src/services/window/__tests__/WindowManager.test.ts`
- Window lifecycle management
- Tab operations
- Layout persistence
- Event emission
- Error handling

**TabBar Tests**: `src/renderer/src/components/window/__tests__/TabBar.test.ts`
- Tab rendering and interaction
- Drag & drop functionality
- Context menu operations
- Keyboard navigation

### Integration Tests

End-to-end testing covers:
- Multi-window creation and management
- Tab movement between windows
- Layout save/restore operations
- Cross-window communication

## Performance Considerations

### Memory Management
- Automatic cleanup of closed windows/tabs
- Event listener management
- Component lazy loading

### Optimization Techniques
- Virtual scrolling for large tab lists
- Debounced auto-save operations
- Code splitting for view components
- Efficient state synchronization

## Usage Examples

### Creating a New Window
```typescript
const windowId = await windowManager.createWindow({
  title: 'Development Window',
  bounds: { x: 100, y: 100, width: 1200, height: 800 },
  tabs: [
    { title: 'Code Editor', type: 'file' },
    { title: 'Terminal', type: 'terminal' }
  ]
})
```

### Adding a Tab
```typescript
const tab = await windowManager.createTab(windowId, {
  title: 'API Documentation',
  type: 'browser',
  data: { url: 'https://api.docs.com' }
})
```

### Saving a Layout
```typescript
const layoutId = await windowManager.saveLayout(
  'Development Setup',
  'Code editor, terminal, and documentation'
)
```

## Future Enhancements

### Planned Features
1. **Session Persistence**: Restore tabs and windows on restart
2. **Tab Groups**: Organize related tabs into collapsible groups
3. **Split Panes**: Divide tab content into multiple panes
4. **Picture-in-Picture**: Floating mini-views for monitoring
5. **Workspace Templates**: Predefined window/tab arrangements

### Extensibility Points
- Custom tab types via plugin system
- Theme customization for window chrome
- Custom keyboard shortcuts
- External window management APIs

## Migration Guide

### From Single Window
Applications using the legacy single-window mode can gradually migrate:

1. Enable multi-window mode: `useMultiWindow.value = true`
2. Update route handling to work with tab system
3. Migrate custom views to new tab-based architecture
4. Test window/tab operations thoroughly

### Breaking Changes
- Router navigation now handled through tab system
- Global state management requires window-aware context
- Custom shortcuts need multi-window consideration

## Best Practices

### Development
1. Always test with multiple windows open
2. Handle window/tab cleanup properly
3. Use provided event system for state synchronization
4. Implement proper error boundaries in tab content

### User Experience
1. Provide visual feedback for tab operations
2. Maintain consistent keyboard shortcuts
3. Save user's window arrangements
4. Handle edge cases gracefully (last tab, modified content)

## Conclusion

The multi-window/tab architecture transforms MiaoDa Chat into a powerful, flexible workspace that adapts to different user workflows. The modular design ensures maintainability while providing room for future enhancements and customizations.

The implementation successfully balances complexity with usability, providing a sophisticated window management system that feels natural to desktop application users while maintaining the flexibility of modern web interfaces.