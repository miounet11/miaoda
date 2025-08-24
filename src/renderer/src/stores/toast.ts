import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
	const messages = ref<{ id: string; type: 'info' | 'error' | 'success'; text: string }[]>([])

	function showError(text: string) {
		messages.value.push({ id: String(Date.now()), type: 'error', text })
	}

	function showSuccess(text: string) {
		messages.value.push({ id: String(Date.now()), type: 'success', text })
	}

	return { messages, showError, showSuccess }
})