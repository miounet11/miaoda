# Custom LLM Provider System

This document describes the implementation of the custom LLM provider system for MiaoDa Chat.

## Overview

The custom provider system allows users to add their own LLM providers that are compatible with OpenAI's API format. This includes providers like:

- Custom OpenAI deployments
- Azure OpenAI
- Together AI
- Groq
- DeepSeek
- Any other OpenAI-compatible API

## Architecture

### Core Components

1. **CustomProviderConfig**: Configuration interface for custom providers
2. **CustomOpenAIProvider**: Implementation for OpenAI-compatible providers
3. **CustomProviderManager**: Manager for CRUD operations and health monitoring
4. **ProviderFactory**: Updated factory to support custom providers
5. **LLMManager**: Enhanced manager with custom provider support

### Security Features

- Encrypted storage using electron-store with custom encryption key
- API key encryption at rest
- Secure configuration validation
- Connection testing before storage

### Health Monitoring

- Automatic periodic health checks (every 5 minutes)
- Manual health check capabilities
- Provider response time monitoring
- Error tracking and reporting

## Usage Examples

### Adding a Custom Provider

```typescript
// Example: Adding a DeepSeek provider
const config = {
  name: 'deepseek',
  displayName: 'DeepSeek API',
  apiKey: 'your-deepseek-api-key',
  baseURL: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
  type: 'openai-compatible' as const,
  parameters: {
    temperature: 0.7,
    maxTokens: 4000
  }
}

const result = await llmManager.addCustomProvider(config)
if (result.success) {
  console.log(`Provider added with ID: ${result.id}`)
} else {
  console.error(`Failed to add provider: ${result.error}`)
}
```

### Checking Provider Health

```typescript
// Check specific provider health
const health = await llmManager.checkCustomProviderHealth('provider-id')
console.log(`Provider ${health.providerName} is ${health.isHealthy ? 'healthy' : 'unhealthy'}`)

// Check all providers health
const allHealth = await llmManager.checkAllCustomProvidersHealth()
allHealth.forEach(health => {
  console.log(`${health.providerName}: ${health.isHealthy ? '✓' : '✗'} (${health.responseTime}ms)`)
})
```

### Using Custom Provider

```typescript
// Set custom provider as active
const llmConfig: LLMConfig = {
  provider: 'custom',
  customProviderId: 'your-custom-provider-id'
}

const result = llmManager.setProvider(llmConfig)
if (result.success) {
  // Provider is now active and ready to use
  const response = await llmManager.sendMessage('Hello!', chatId, messageId)
}
```

## IPC Handlers

The following IPC handlers are available for frontend communication:

### Custom Provider Management

- `llm:addCustomProvider` - Add new custom provider
- `llm:updateCustomProvider` - Update existing provider
- `llm:removeCustomProvider` - Remove provider
- `llm:getAllCustomProviders` - Get all custom providers
- `llm:getCustomProvider` - Get specific provider

### Health Monitoring

- `llm:checkCustomProviderHealth` - Check single provider health
- `llm:checkAllCustomProvidersHealth` - Check all providers health
- `llm:getAllProviderHealthStatuses` - Get cached health statuses
- `llm:getCustomProviderHealth` - Get cached health for specific provider

### Import/Export

- `llm:exportCustomProviders` - Export providers (without API keys)
- `llm:importCustomProviders` - Import providers configuration

### Provider Discovery

- `llm:getAllProviders` - Get all available providers (built-in + custom)

## Error Handling

The system implements comprehensive error handling:

- Connection validation before adding providers
- Graceful fallbacks for network issues
- Detailed error reporting with context
- Automatic retry mechanisms for health checks

## Configuration Storage

Custom providers are stored securely using electron-store with:

- Encryption of sensitive data (API keys)
- Separate storage namespace for custom providers
- Atomic operations for data consistency
- Backup and recovery capabilities

## Best Practices

1. Always validate connections before adding providers
2. Monitor provider health regularly
3. Handle provider failures gracefully
4. Use secure API key storage
5. Implement proper error boundaries
6. Test provider configurations thoroughly

## Supported Provider Types

Currently supported provider types:

1. **openai-compatible**: Standard OpenAI API format
2. **anthropic-compatible**: Future support for Anthropic-compatible APIs
3. **custom**: Extensible for custom API formats

## Future Enhancements

Planned improvements include:

- Support for more provider types (Anthropic, Google, etc.)
- Advanced parameter tuning interfaces
- Provider usage analytics
- Multi-model support per provider
- Custom prompt templates per provider
- Advanced authentication methods (OAuth, etc.)
