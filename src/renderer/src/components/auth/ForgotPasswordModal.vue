<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reset Password</h2>
        <p class="text-gray-600 dark:text-gray-400">
          Enter your email to receive reset instructions
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Email field -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Address
          </label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Enter your email"
          />
        </div>

        <!-- Error message -->
        <div
          v-if="errorMessage"
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
        >
          <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
        </div>

        <!-- Success message -->
        <div
          v-if="successMessage"
          class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
        >
          <p class="text-sm text-green-600 dark:text-green-400">{{ successMessage }}</p>
        </div>

        <!-- Submit button -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <div v-if="isLoading" class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
            Sending...
          </div>
          <span v-else>Send Reset Instructions</span>
        </button>
      </form>

      <!-- Back to login -->
      <div class="mt-6 text-center">
        <button
          @click="$emit('close')"
          class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          ← Back to sign in
        </button>
      </div>

      <!-- Close button -->
      <button
        @click="$emit('close')"
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      >
        <XMarkIcon class="h-6 w-6" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '../../stores/auth'

interface Emits {
  (e: 'close'): void
  (e: 'success'): void
}

const emit = defineEmits<Emits>()

const authStore = useAuthStore()

const email = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleSubmit = async () => {
  if (isLoading.value) return

  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = true

  try {
    await authStore.forgotPassword(email.value)

    successMessage.value = 'Password reset instructions have been sent to your email address.'

    // Close modal after 3 seconds
    setTimeout(() => {
      emit('success')
      emit('close')
    }, 3000)
  } catch (error: any) {
    console.error('Password reset error:', error)
    errorMessage.value = error.message || 'An error occurred. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
