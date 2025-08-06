# Global Shortcuts System for MiaoDa Chat

## Overview

This document outlines the global shortcut system implemented for MiaoDa Chat. The system provides cross-platform keyboard shortcuts that work consistently across macOS and Windows/Linux.

## Architecture

### Core Components

1. **useGlobalShortcuts Composable** (`src/renderer/src/composables/useGlobalShortcuts.ts`)
   - Central logic for handling keyboard shortcuts
   - Platform-aware key detection (Cmd on Mac, Ctrl on Windows/Linux)
   - Integration with Vue 3 Composition API

2. **ShortcutsHelpModal** (`src/renderer/src/components/ShortcutsHelpModal.vue`)
   - User-friendly modal showing available shortcuts
   - Platform-specific key display

3. **QuickSearchModal** (`src/renderer/src/components/QuickSearchModal.vue`)
   - Global search interface with keyboard navigation
   - Message search across all conversations

## Available Shortcuts

### General
- **Cmd/Ctrl + N**: Create new chat
- **Cmd/Ctrl + K**: Open quick search
- **Cmd/Ctrl + /**: Show shortcuts help
- **Escape**: Close modal/cancel operation

### Chat
- **Cmd/Ctrl + Enter**: Send message (when chat input is focused)
- **Cmd/Ctrl + 1-9**: Switch to chat tab 1-9

### Legacy (Already implemented)
- **Cmd/Ctrl + B**: Toggle sidebar
- **Cmd/Ctrl + ,**: Open settings
- **Cmd/Ctrl + Shift + T**: Toggle theme

## Implementation Details

### Platform Detection
```typescript
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
```

### Key Matching Logic
The system handles both meta (Cmd) and ctrl keys appropriately for each platform:
```typescript
if (shortcut.modifiers?.meta && shortcut.modifiers?.ctrl) {
  const platformModifier = isMac ? event.metaKey : event.ctrlKey
  return keyMatch && platformModifier && altMatch && shiftMatch
}
```

### Input Prevention
Shortcuts are prevented from firing when the user is typing in input elements:
```typescript
if (
  target.tagName === 'INPUT' || 
  target.tagName === 'TEXTAREA' || 
  target.isContentEditable ||
  target.closest('[contenteditable="true"]')
) {
  // Only allow Escape key
  if (event.key === 'Escape') {
    uiStore.closeActiveModal()
  }
  return
}
```

## Integration

### Adding the System to Views
```typescript
import { useGlobalShortcuts } from '@renderer/src/composables/useGlobalShortcuts'

// In your component setup
const { shortcuts } = useGlobalShortcuts()
```

### Adding Shortcut Modals to App Root
```vue
<!-- In App.vue -->
<ShortcutsHelpModal />
<QuickSearchModal />
```

## Custom Events

The system uses custom DOM events for loose coupling:

- `shortcuts:send-message`: Triggers message send
- `shortcuts:switch-chat`: Switches to chat by index

Example implementation:
```typescript
document.addEventListener('shortcuts:send-message', () => {
  // Handle sending current message
})
```

## Store Integration

The shortcuts integrate with:
- **UI Store**: Modal management, theme toggles
- **Chat Store**: Chat creation, selection

## Future Enhancements

1. **Customizable Shortcuts**: Allow users to modify key combinations
2. **Context-Aware Shortcuts**: Different shortcuts in different app areas
3. **Recording Mode**: Visual indicator when shortcuts are being captured
4. **Accessibility**: Screen reader announcements for shortcut actions

## Testing

To test shortcuts:

1. **Cmd/Ctrl + /**: Should open shortcuts help modal
2. **Cmd/Ctrl + K**: Should open quick search
3. **Cmd/Ctrl + N**: Should create new chat
4. **Escape**: Should close any open modal

## Browser Compatibility

The system works in all modern browsers that support:
- KeyboardEvent with metaKey/ctrlKey
- Custom DOM events
- Vue 3 Composition API

## Performance Considerations

- Event listeners are properly cleaned up on component unmount
- Shortcut matching uses efficient find() operation
- Platform detection is cached once on component creation