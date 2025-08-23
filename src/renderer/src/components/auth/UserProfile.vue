<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
  >
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Profile Settings</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Manage your account information and preferences
      </p>
    </div>

    <!-- Content -->
    <div class="p-6 space-y-6">
      <!-- Profile Picture -->
      <div class="flex items-center space-x-6">
        <div class="relative">
          <img
            v-if="user?.avatar"
            :src="user.avatar"
            :alt="user.name"
            class="h-20 w-20 rounded-full object-cover"
          />
          <div
            v-else
            class="h-20 w-20 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
          >
            <UserIcon class="h-10 w-10 text-gray-400" />
          </div>

          <!-- Upload overlay -->
          <div
            class="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
          >
            <CameraIcon class="h-6 w-6 text-white" />
          </div>
        </div>

        <div>
          <h3 class="text-base font-medium text-gray-900 dark:text-white">Profile Photo</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">Update your profile picture</p>
          <div class="mt-2 flex space-x-2">
            <button
              @click="uploadPhoto"
              class="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md"
            >
              Upload
            </button>
            <button
              v-if="user?.avatar"
              @click="removePhoto"
              class="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Remove
            </button>
          </div>
        </div>
      </div>

      <!-- Basic Information -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Name
          </label>
          <input
            v-model="profileForm.name"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        <!-- Email -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Address
          </label>
          <div class="relative">
            <input
              :value="user?.email"
              type="email"
              disabled
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
              <CheckBadgeIcon v-if="user?.email_verified" class="h-5 w-5 text-green-500" />
              <ExclamationTriangleIcon v-else class="h-5 w-5 text-yellow-500" />
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            {{ user?.email_verified ? 'Verified' : 'Unverified - Check your email' }}
          </p>
        </div>
      </div>

      <!-- Account Information -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 class="text-base font-medium text-gray-900 dark:text-white mb-4">
          Account Information
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Member Since
            </label>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ formatDate(user?.createdAt) }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Last Active
            </label>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ formatDate(user?.lastActiveAt) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Preferences -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 class="text-base font-medium text-gray-900 dark:text-white mb-4">Preferences</h3>

        <div class="space-y-4">
          <!-- Theme -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theme
            </label>
            <select
              v-model="profileForm.preferences.theme"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          <!-- Language -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Language
            </label>
            <select
              v-model="profileForm.preferences.language"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="en">English</option>
              <option value="zh-CN">简体中文</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
            </select>
          </div>

          <!-- Timezone -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Timezone
            </label>
            <select
              v-model="profileForm.preferences.timezone"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Asia/Shanghai">Shanghai</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Error/Success Messages -->
      <div
        v-if="errorMessage"
        class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
      >
        <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
      </div>

      <div
        v-if="successMessage"
        class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
      >
        <p class="text-sm text-green-600 dark:text-green-400">{{ successMessage }}</p>
      </div>

      <!-- Actions -->
      <div
        class="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="flex space-x-3">
          <button
            @click="saveProfile"
            :disabled="isLoading || !hasChanges"
            class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <div v-if="isLoading" class="flex items-center">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </div>
            <span v-else>Save Changes</span>
          </button>

          <button
            @click="resetForm"
            :disabled="isLoading"
            class="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Reset
          </button>
        </div>

        <button
          @click="showChangePassword = true"
          class="text-sm text-blue-600 hover:text-blue-500 font-medium"
        >
          Change Password
        </button>
      </div>
    </div>

    <!-- Change Password Modal -->
    <ChangePasswordModal
      v-if="showChangePassword"
      @close="showChangePassword = false"
      @success="handlePasswordChangeSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import {
  UserIcon,
  CameraIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '../../stores/auth'
import ChangePasswordModal from './ChangePasswordModal.vue'

const authStore = useAuthStore()

const user = computed(() => authStore.currentUser)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const showChangePassword = ref(false)

const profileForm = reactive({
  name: '',
  preferences: {
    theme: 'system',
    language: 'en',
    timezone: 'UTC'
  }
})

// Initialize form with user data
watch(
  user,
  newUser => {
    if (newUser) {
      profileForm.name = newUser.name
      profileForm.preferences = { ...newUser.preferences }
    }
  },
  { immediate: true }
)

const hasChanges = computed(() => {
  if (!user.value) return false

  return (
    profileForm.name !== user.value.name ||
    profileForm.preferences.theme !== user.value.preferences.theme ||
    profileForm.preferences.language !== user.value.preferences.language ||
    profileForm.preferences.timezone !== user.value.preferences.timezone
  )
})

const formatDate = (date: Date | undefined) => {
  if (!date) return 'Unknown'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date))
}

const saveProfile = async () => {
  if (isLoading.value || !hasChanges.value) return

  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = true

  try {
    await authStore.updateProfile({
      name: profileForm.name,
      preferences: profileForm.preferences
    })

    successMessage.value = 'Profile updated successfully!'

    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error: any) {
    console.error('Profile update error:', error)
    errorMessage.value = error.message || 'Failed to update profile. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  if (user.value) {
    profileForm.name = user.value.name
    profileForm.preferences = { ...user.value.preferences }
  }
  errorMessage.value = ''
  successMessage.value = ''
}

const uploadPhoto = () => {
  // TODO: Implement photo upload
  console.log('Upload photo functionality to be implemented')
}

const removePhoto = async () => {
  try {
    await authStore.updateProfile({ avatar: null })
    successMessage.value = 'Profile photo removed successfully!'
  } catch (error: any) {
    errorMessage.value = 'Failed to remove profile photo.'
  }
}

const handlePasswordChangeSuccess = () => {
  showChangePassword.value = false
  successMessage.value = 'Password changed successfully!'
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}
</script>
