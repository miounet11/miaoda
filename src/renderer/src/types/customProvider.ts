export type CustomProviderFormData = {
	name: string
	displayName: string
	apiKey: string
	baseURL: string
	model: string
	type: 'openai-compatible' | 'anthropic-compatible' | 'custom'
	headers?: Record<string, string>
	parameters?: Record<string, unknown>
}

export type CustomProviderConfig = {
	id: string
	name: string
	displayName: string
	apiKey: string
	baseURL: string
	model: string
	type: 'openai-compatible' | 'anthropic-compatible' | 'custom'
	headers?: Record<string, string>
	parameters?: Record<string, unknown>
	createdAt?: string
	updatedAt?: string
}

export type ProviderHealthStatus = {
	providerName: string
	isHealthy: boolean
	lastChecked: string
	error?: string
	responseTime?: number
}

export type ProviderListItem = {
	id: string
	name: string
	displayName: string
	model: string
	enabled: boolean
}

export type CustomProviderOperationResult = {
	success: boolean
	error?: string
}

export type ProviderImportResult = {
	success: number
	failed: number
	errors: string[]
}