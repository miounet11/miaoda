# Custom Provider Usage Examples

## Backend Examples

### 1. Adding a Provider via Code

```typescript
// In main process
import { CustomProviderManager } from './llm/customProviderManager'

const manager = new CustomProviderManager()

const providerConfig = {
  name: 'groq-llama',
  displayName: 'Groq Llama 3',
  apiKey: 'gsk_xxxxxxxxxxxxx',
  baseURL: 'https://api.groq.com/openai/v1',
  model: 'llama3-70b-8192',
  type: 'openai-compatible' as const,
  parameters: {
    temperature: 0.7,
    maxTokens: 4096
  }
}

// Add provider
const result = await manager.addProvider(providerConfig)
if (result.success) {
  console.log('Provider added:', result.id)
}

// Test provider health
const health = await manager.checkProviderHealth(result.id!)
console.log('Provider health:', health)
```

### 2. Using Custom Provider in LLM Manager

```typescript
// In main process
import { LLMManager } from './llm/llmManager'
import { MCPManager } from './mcp/mcpManager'

const mcpManager = new MCPManager()
const llmManager = new LLMManager(mcpManager)

// Set up custom provider for use
const config = {
  provider: 'custom' as const,
  customProviderId: 'custom-groq-llama-xxxxx'
}

const setupResult = llmManager.setProvider(config)
if (setupResult.success) {
  // Now can send messages using custom provider
  const response = await llmManager.sendMessage(
    'Hello, world!',
    'chat-id',
    'message-id'
  )
  console.log('Response:', response)
}
```

## Frontend Examples

### 1. Using CustomProviderService

```typescript
// In renderer process
import { customProviderService } from '@/services/CustomProviderService'

// Add a new provider
const addProvider = async () => {
  const config = {
    name: 'deepseek-coder',
    displayName: 'DeepSeek Coder',
    apiKey: 'sk-xxxxxxxxxxxxx',
    baseURL: 'https://api.deepseek.com/v1',
    model: 'deepseek-coder',
    type: 'openai-compatible' as const
  }

  const result = await customProviderService.addProvider(config)
  if (result.success) {
    console.log('Provider added:', result.id)
  } else {
    console.error('Failed to add provider:', result.error)
  }
}

// Get all providers
const loadProviders = async () => {
  const providers = await customProviderService.getAllProviders()
  console.log('Available providers:', providers)
}

// Check provider health
const checkHealth = async (providerId: string) => {
  const health = await customProviderService.checkProviderHealth(providerId)
  if (health) {
    console.log(`${health.providerName} is ${health.isHealthy ? 'healthy' : 'unhealthy'}`)
  }
}
```

### 2. Vue Component Example

```vue
<template>
  <div class="custom-provider-manager">
    <h2>Custom LLM Providers</h2>
    
    <!-- Add Provider Form -->
    <form @submit.prevent="addProvider" class="provider-form">
      <input v-model="newProvider.displayName" placeholder="Display Name" required />
      <input v-model="newProvider.apiKey" placeholder="API Key" type="password" required />
      <input v-model="newProvider.baseURL" placeholder="Base URL" required />
      <input v-model="newProvider.model" placeholder="Model Name" required />
      <select v-model="newProvider.type">
        <option value="openai-compatible">OpenAI Compatible</option>
        <option value="anthropic-compatible">Anthropic Compatible</option>
      </select>
      <button type="submit" :disabled="isLoading">Add Provider</button>
    </form>

    <!-- Provider List -->
    <div class="providers-list">
      <div v-for="provider in providers" :key="provider.id" class="provider-card">
        <h3>{{ provider.displayName }}</h3>
        <p>Model: {{ provider.model }}</p>
        <p>Type: {{ provider.type }}</p>
        <div class="provider-health" :class="getHealthClass(provider.id)">
          {{ getHealthStatus(provider.id) }}
        </div>
        <div class="provider-actions">
          <button @click="checkHealth(provider.id)">Check Health</button>
          <button @click="editProvider(provider)">Edit</button>
          <button @click="removeProvider(provider.id)" class="danger">Remove</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { customProviderService } from '@/services/CustomProviderService'
import type { CustomProviderConfig, CustomProviderCreateRequest } from '@/types/api'

const providers = ref<CustomProviderConfig[]>([])
const healthStatuses = ref<Map<string, any>>(new Map())
const isLoading = ref(false)

const newProvider = ref<CustomProviderCreateRequest>({
  name: '',
  displayName: '',
  apiKey: '',
  baseURL: '',
  model: '',
  type: 'openai-compatible'
})

const loadProviders = async () => {
  providers.value = await customProviderService.getAllProviders()
  // Load health statuses
  const statuses = await customProviderService.getAllHealthStatuses()
  statuses.forEach(status => {
    // Find provider by name
    const provider = providers.value.find(p => p.displayName === status.providerName)
    if (provider) {
      healthStatuses.value.set(provider.id, status)
    }
  })
}

const addProvider = async () => {
  isLoading.value = true
  try {
    // Generate name from display name
    newProvider.value.name = newProvider.value.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')

    const result = await customProviderService.addProvider(newProvider.value)
    if (result.success) {
      await loadProviders()
      // Reset form
      newProvider.value = {
        name: '',
        displayName: '',
        apiKey: '',
        baseURL: '',
        model: '',
        type: 'openai-compatible'
      }
    } else {
      alert('Failed to add provider: ' + result.error)
    }
  } finally {
    isLoading.value = false
  }
}

const checkHealth = async (providerId: string) => {
  const health = await customProviderService.checkProviderHealth(providerId)
  if (health) {
    healthStatuses.value.set(providerId, health)
  }
}

const removeProvider = async (providerId: string) => {
  if (confirm('Are you sure you want to remove this provider?')) {
    const result = await customProviderService.removeProvider(providerId)
    if (result.success) {
      await loadProviders()
    } else {
      alert('Failed to remove provider: ' + result.error)
    }
  }
}

const getHealthStatus = (providerId: string) => {
  const health = healthStatuses.value.get(providerId)
  if (!health) return 'Unknown'
  return health.isHealthy ? 'Healthy' : `Unhealthy: ${health.error}`
}

const getHealthClass = (providerId: string) => {
  const health = healthStatuses.value.get(providerId)
  if (!health) return 'health-unknown'
  return health.isHealthy ? 'health-good' : 'health-bad'
}

onMounted(() => {
  loadProviders()
})
</script>

<style scoped>
.provider-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  max-width: 400px;
}

.providers-list {
  display: grid;
  gap: 1rem;
}

.provider-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
}

.provider-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.health-good { color: green; }
.health-bad { color: red; }
.health-unknown { color: gray; }

.danger { 
  background-color: #dc3545;
  color: white;
}
</style>
```

## Configuration Examples

### 1. Popular Provider Configurations

```typescript
// Groq Configuration
const groqConfig = {
  name: 'groq-llama3',
  displayName: 'Groq Llama 3 70B',
  apiKey: 'gsk_xxxxxxxxxxxxx',
  baseURL: 'https://api.groq.com/openai/v1',
  model: 'llama3-70b-8192',
  type: 'openai-compatible' as const,
  parameters: {
    temperature: 0.7,
    maxTokens: 8192
  }
}

// DeepSeek Configuration
const deepseekConfig = {
  name: 'deepseek-coder',
  displayName: 'DeepSeek Coder',
  apiKey: 'sk-xxxxxxxxxxxxx',
  baseURL: 'https://api.deepseek.com/v1',
  model: 'deepseek-coder',
  type: 'openai-compatible' as const,
  parameters: {
    temperature: 0.1,
    maxTokens: 4096
  }
}

// Mistral Configuration
const mistralConfig = {
  name: 'mistral-large',
  displayName: 'Mistral Large',
  apiKey: 'sk-xxxxxxxxxxxxx',
  baseURL: 'https://api.mistral.ai/v1',
  model: 'mistral-large-latest',
  type: 'openai-compatible' as const,
  parameters: {
    temperature: 0.7,
    maxTokens: 4096
  }
}

// Together AI Configuration
const togetherConfig = {
  name: 'together-llama',
  displayName: 'Together AI Llama',
  apiKey: 'xxxxxxxxxxxxx',
  baseURL: 'https://api.together.xyz/v1',
  model: 'meta-llama/Llama-2-70b-chat-hf',
  type: 'openai-compatible' as const,
  parameters: {
    temperature: 0.8,
    maxTokens: 4096
  }
}
```

### 2. Batch Operations

```typescript
// Import multiple providers
const importProviders = async () => {
  const providersToImport = [groqConfig, deepseekConfig, mistralConfig]
  
  const result = await customProviderService.importProviders(providersToImport)
  console.log(`Imported ${result.success} providers`)
  if (result.failed > 0) {
    console.error('Failed imports:', result.errors)
  }
}

// Export all providers
const exportProviders = async () => {
  const exportedProviders = await customProviderService.exportProviders()
  // Save to file or backup
  const json = JSON.stringify(exportedProviders, null, 2)
  console.log('Exported providers:', json)
}

// Health check all providers
const checkAllHealth = async () => {
  const healthResults = await customProviderService.checkAllProvidersHealth()
  healthResults.forEach(health => {
    console.log(`${health.providerName}: ${health.isHealthy ? '✅' : '❌'}`)
    if (!health.isHealthy && health.error) {
      console.log(`  Error: ${health.error}`)
    }
    if (health.responseTime) {
      console.log(`  Response time: ${health.responseTime}ms`)
    }
  })
}
```

## Error Handling Examples

```typescript
// Robust provider addition with validation
const addProviderSafely = async (config: CustomProviderCreateRequest) => {
  try {
    // Client-side validation
    const validation = await customProviderService.validateProvider(config)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.error}`)
    }

    // Attempt to add provider
    const result = await customProviderService.addProvider(config)
    if (!result.success) {
      throw new Error(`Failed to add provider: ${result.error}`)
    }

    // Verify health after adding
    const health = await customProviderService.checkProviderHealth(result.id!)
    if (!health?.isHealthy) {
      console.warn(`Provider added but health check failed: ${health?.error}`)
    }

    return result.id
  } catch (error) {
    console.error('Error adding provider:', error)
    // Handle specific error types
    if (error.message.includes('Connection failed')) {
      // Show network error message
    } else if (error.message.includes('Invalid API key')) {
      // Show authentication error message
    }
    throw error
  }
}
```

## Testing Examples

```typescript
// Testing custom provider functionality
import { describe, it, expect, vi } from 'vitest'
import { customProviderService } from '@/services/CustomProviderService'

describe('Custom Provider Integration', () => {
  it('should add and use custom provider', async () => {
    const config = {
      name: 'test-provider',
      displayName: 'Test Provider',
      apiKey: 'test-key',
      baseURL: 'https://api.test.com/v1',
      model: 'test-model',
      type: 'openai-compatible' as const
    }

    // Mock the API calls
    vi.spyOn(window.api.llm, 'addCustomProvider')
      .mockResolvedValue({ success: true, id: 'test-id' })

    const result = await customProviderService.addProvider(config)
    expect(result.success).toBe(true)
    expect(result.id).toBe('test-id')
  })

  it('should handle validation errors', async () => {
    const invalidConfig = {
      name: '',
      displayName: '',
      apiKey: '',
      baseURL: 'invalid-url',
      model: '',
      type: 'openai-compatible' as const
    }

    const validation = await customProviderService.validateProvider(invalidConfig)
    expect(validation.valid).toBe(false)
    expect(validation.error).toContain('required')
  })
})
```