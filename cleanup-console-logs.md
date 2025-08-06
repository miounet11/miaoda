# Console Log Cleanup Guide

## Completed Files
- `/src/main/index.ts` - ✅ Updated to use logger
- `/src/renderer/src/stores/chat.ts` - ✅ Updated to use logger

## Pattern for Replacement

### Main Process Files
```typescript
// Add import
import { logger } from './utils/Logger' // or appropriate path

// Replace patterns:
console.log('message') → logger.debug('message', 'Context')
console.info('message') → logger.info('message', 'Context') 
console.warn('message') → logger.warn('message', 'Context')
console.error('message', error) → logger.error('message', 'Context', error)
```

### Renderer Process Files
```typescript
// Add import  
import { logger } from '../utils/Logger' // or appropriate path

// Same replacement patterns as above
```

## Files Remaining to Clean (32 total)

### High Priority (Main Process)
- `src/main/ipcHandlers.ts` - 14 occurrences
- `src/main/mcp/mcpManager.ts` - 7 occurrences
- `src/main/plugins/pluginManager.ts` - 7 occurrences
- `src/main/fileHandler.ts` - 1 occurrence

### Medium Priority (Renderer Process)
- `src/renderer/src/services/plugin/PluginManager.ts` - 14 occurrences
- `src/renderer/src/services/mcp/MCPService.ts` - 10 occurrences
- `src/renderer/src/services/search/SearchService.ts` - 8 occurrences
- `src/renderer/src/stores/chat-enhanced.ts` - 4 occurrences

### Low Priority (Development/Debug)
- `src/renderer/src/debug-main.ts` - 4 occurrences (dev only)
- `src/renderer/src/utils/performance.ts` - 4 occurrences (performance logging)
- `src/main/mcp/__tests__/mcpManager.test.ts` - 2 occurrences (test file)

## Automated Cleanup Strategy
1. Created Logger utilities for both main and renderer processes
2. Import logger in each file
3. Replace console statements systematically
4. Keep error logging but improve context
5. Remove or convert debug logging to conditional