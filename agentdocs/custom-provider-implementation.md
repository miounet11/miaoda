# Custom LLM Provider Backend Implementation

## Overview

This document outlines the complete backend implementation for custom LLM provider support in MiaoDa Chat. The implementation provides a secure, extensible, and robust system for managing third-party LLM providers.

## Architecture Components

### 1. Core Components

#### CustomProviderManager (`src/main/llm/customProviderManager.ts`)
- **Purpose**: Central manager for all custom provider operations
- **Features**:
  - Secure storage using encrypted electron-store
  - Provider validation and health monitoring
  - CRUD operations (Create, Read, Update, Delete)
  - Import/Export functionality
  - Automatic health checking every 5 minutes

#### ProviderFactory (`src/main/llm/ProviderFactory.ts`)
- **Purpose**: Factory pattern for creating provider instances
- **Features**:
  - Unified interface for built-in and custom providers
  - Configuration validation
  - Provider type abstraction

#### CustomOpenAIProvider (`src/main/llm/provider.ts`)
- **Purpose**: OpenAI-compatible provider implementation
- **Features**:
  - Support for streaming and non-streaming responses
  - Tool calling capabilities
  - Connection validation
  - Configurable parameters (temperature, max tokens, etc.)

### 2. Data Storage

#### Secure Configuration Storage
```typescript
// Encrypted storage configuration
const store = new Store({
  name: 'custom-providers',
  encryptionKey: 'miaoda-chat-custom-providers-key',
  defaults: {
    providers: {},
    healthStatus: {}
  }
})
```

#### Provider Configuration Schema
```typescript
interface CustomProviderConfig {
  id: string                    // Unique identifier
  name: string                  // Internal name
  displayName: string           // User-friendly name
  apiKey: string               // Encrypted API key
  baseURL: string              // API endpoint
  model: string                // Model name
  type: 'openai-compatible' | 'anthropic-compatible' | 'custom'
  headers?: Record<string, string>  // Custom headers
  parameters?: {               // Optional parameters
    temperature?: number
    maxTokens?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
  }
  createdAt: string
  updatedAt: string
}
```

### 3. IPC Communication

#### Available IPC Handlers
- `llm:addCustomProvider` - Add new provider
- `llm:updateCustomProvider` - Update existing provider
- `llm:removeCustomProvider` - Remove provider
- `llm:getAllCustomProviders` - Get all providers
- `llm:getCustomProvider` - Get specific provider
- `llm:checkCustomProviderHealth` - Check provider health
- `llm:checkAllCustomProvidersHealth` - Check all providers health
- `llm:getAllProviderHealthStatuses` - Get cached health statuses
- `llm:exportCustomProviders` - Export provider configurations
- `llm:importCustomProviders` - Import provider configurations

### 4. Health Monitoring

#### Health Check System
- Automatic health checks every 5 minutes
- On-demand health validation
- Response time tracking
- Error logging and reporting

#### Health Status Schema
```typescript
interface ProviderHealthStatus {
  providerName: string
  isHealthy: boolean
  lastChecked: string
  error?: string
  responseTime?: number
}
```

## Integration Points

### 1. LLMManager Integration
The CustomProviderManager is integrated into the main LLMManager:
```typescript
export class LLMManager {
  private customProviderManager: CustomProviderManager

  constructor(mcpManager: MCPManager) {
    this.customProviderManager = new CustomProviderManager()
    ProviderFactory.setCustomProviderManager(this.customProviderManager)
  }
  
  // All custom provider methods are proxied through LLMManager
}
```

### 2. Preload Script Integration
Custom provider API methods are exposed through the preload script:
```typescript
llm: {
  // ... existing methods
  addCustomProvider: (config: any) => ipcRenderer.invoke('llm:addCustomProvider', config),
  updateCustomProvider: (id: string, updates: any) => 
    ipcRenderer.invoke('llm:updateCustomProvider', id, updates),
  // ... other custom provider methods
}
```

### 3. Frontend Service Layer
A dedicated service handles all custom provider operations:
```typescript
export class CustomProviderService {
  async addProvider(config: CustomProviderCreateRequest): Promise<Result>
  async updateProvider(id: string, updates: CustomProviderUpdateRequest): Promise<Result>
  async removeProvider(id: string): Promise<Result>
  // ... other methods
}
```

## Security Features

### 1. Encrypted Storage
- API keys are stored using electron-store encryption
- Encryption key is embedded in the application
- Configuration data is encrypted at rest

### 2. Validation
- Server-side validation of all provider configurations
- Connection testing before saving
- Input sanitization and type checking

### 3. Error Handling
- Comprehensive error handling at all levels
- Structured error messages
- Fallback mechanisms for failed operations

## Usage Examples

### Adding a Custom Provider
```typescript
const config = {
  name: 'groq-provider',
  displayName: 'Groq API',
  apiKey: 'your-api-key',
  baseURL: 'https://api.groq.com/openai/v1',
  model: 'llama3-70b-8192',
  type: 'openai-compatible'
}

const result = await customProviderService.addProvider(config)
if (result.success) {
  console.log('Provider added with ID:', result.id)
}
```

### Health Monitoring
```typescript
// Check specific provider
const health = await customProviderService.checkProviderHealth(providerId)
console.log('Provider is healthy:', health.isHealthy)

// Check all providers
const allHealth = await customProviderService.checkAllProvidersHealth()
console.log('Healthy providers:', allHealth.filter(h => h.isHealthy).length)
```

## Testing

### Test Coverage
- Unit tests for CustomProviderManager
- Integration tests for ProviderFactory
- Mock implementations for external dependencies
- Health monitoring tests
- Validation tests

### Running Tests
```bash
npm run test src/main/llm/__tests__/customProvider.test.ts
```

## Error Handling

### Common Error Scenarios
1. **Invalid API Configuration**: Malformed URLs, missing keys
2. **Connection Failures**: Network issues, invalid endpoints
3. **Authentication Errors**: Invalid API keys, expired tokens
4. **Rate Limiting**: API quota exceeded
5. **Model Availability**: Requested model not available

### Error Recovery
- Automatic retry mechanisms for transient failures
- Graceful degradation when providers are unavailable
- User-friendly error messages
- Logging for debugging

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Providers are only initialized when needed
2. **Caching**: Health statuses are cached to reduce API calls
3. **Connection Pooling**: Reuse HTTP connections when possible
4. **Batch Operations**: Health checks can be batched
5. **Background Processing**: Health monitoring runs in background

### Memory Management
- Proper cleanup of provider instances
- Removal of event listeners
- Garbage collection of unused configurations

## Future Enhancements

### Planned Features
1. **Provider Templates**: Pre-configured templates for popular services
2. **Advanced Authentication**: OAuth, JWT support
3. **Load Balancing**: Distribute requests across multiple providers
4. **Usage Analytics**: Track usage patterns and costs
5. **Provider Marketplace**: Community-driven provider sharing

### Extensibility
The architecture supports easy extension for:
- New provider types (non-OpenAI compatible)
- Additional authentication methods
- Custom validation rules
- Enhanced monitoring capabilities

## Troubleshooting

### Common Issues
1. **Provider Not Found**: Check if provider ID exists in storage
2. **Connection Timeout**: Verify network connectivity and API endpoint
3. **Invalid Configuration**: Use validation methods before saving
4. **Health Check Failures**: Check API key validity and rate limits

### Debug Information
- Enable debug logging in development mode
- Check electron-store for configuration persistence
- Monitor IPC communication in dev tools
- Review health check logs for connection issues