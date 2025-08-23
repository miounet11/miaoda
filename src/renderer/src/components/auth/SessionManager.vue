<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
  >
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Active Sessions</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Manage devices where you're signed in
      </p>
    </div>

    <!-- Content -->
    <div class="p-6">
      <!-- Loading state -->
      <div v-if="isLoading" class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span class="ml-3 text-gray-600 dark:text-gray-400">Loading sessions...</span>
      </div>

      <!-- Sessions list -->
      <div v-else-if="sessions.length > 0" class="space-y-4">
        <div
          v-for="session in sessions"
          :key="session.id"
          class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
          :class="
            session.current
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              : ''
          "
        >
          <!-- Device info -->
          <div class="flex items-center space-x-4">
            <!-- Device icon -->
            <div class="flex-shrink-0">
              <component
                :is="getDeviceIcon(session.device_type)"
                class="h-8 w-8 text-gray-500 dark:text-gray-400"
              />
            </div>

            <!-- Device details -->
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="font-medium text-gray-900 dark:text-white">
                  {{ session.device_name || 'Unknown Device' }}
                </h3>
                <span
                  v-if="session.current"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  Current
                </span>
              </div>

              <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div class="flex items-center space-x-4">
                  <span class="flex items-center">
                    <MapPinIcon class="h-4 w-4 mr-1" />
                    {{ session.location || 'Unknown Location' }}
                  </span>

                  <span class="flex items-center">
                    <ClockIcon class="h-4 w-4 mr-1" />
                    {{ formatLastActive(session.last_active) }}
                  </span>
                </div>

                <div class="flex items-center">
                  <GlobeAltIcon class="h-4 w-4 mr-1" />
                  <span class="text-xs font-mono">{{ session.ip_address || 'Unknown IP' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-2">
            <!-- Security status -->
            <div class="text-right mr-3">
              <div class="flex items-center justify-end">
                <div :class="getSecurityStatusColor(session)" class="h-2 w-2 rounded-full mr-2" />
                <span class="text-xs text-gray-500">
                  {{ getSecurityStatus(session) }}
                </span>
              </div>
            </div>

            <!-- Revoke button (only for non-current sessions) -->
            <button
              v-if="!session.current"
              @click="revokeSession(session)"
              :disabled="revokingSessionId === session.id"
              class="text-red-600 hover:text-red-700 disabled:text-gray-400 text-sm font-medium transition-colors"
            >
              <div v-if="revokingSessionId === session.id" class="flex items-center">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1" />
                Revoking...
              </div>
              <span v-else>Revoke</span>
            </button>
          </div>
        </div>

        <!-- Revoke all others button -->
        <div
          class="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ nonCurrentSessions.length }} other active session{{
                nonCurrentSessions.length !== 1 ? 's' : ''
              }}
            </p>
          </div>

          <button
            v-if="nonCurrentSessions.length > 0"
            @click="revokeAllOtherSessions"
            :disabled="isRevokingAll"
            class="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <div v-if="isRevokingAll" class="flex items-center">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Revoking All...
            </div>
            <span v-else>Revoke All Others</span>
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-8">
        <DevicePhoneMobileIcon class="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p class="text-gray-600 dark:text-gray-400">No active sessions found</p>
      </div>

      <!-- Error message -->
      <div
        v-if="errorMessage"
        class="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
      >
        <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
      </div>

      <!-- Success message -->
      <div
        v-if="successMessage"
        class="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
      >
        <p class="text-sm text-green-600 dark:text-green-400">{{ successMessage }}</p>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmDialog
      v-if="showRevokeConfirm"
      :title="revokeConfirmTitle"
      :message="revokeConfirmMessage"
      confirm-text="Revoke"
      confirm-class="bg-red-600 hover:bg-red-700"
      @confirm="confirmRevoke"
      @cancel="cancelRevoke"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  ComputerDesktopIcon,
  MapPinIcon,
  ClockIcon,
  GlobeAltIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '../../stores/auth'
import ConfirmDialog from '../ui/ConfirmDialog.vue'

const authStore = useAuthStore()

const sessions = ref<any[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const revokingSessionId = ref('')
const isRevokingAll = ref(false)

// Confirmation dialog state
const showRevokeConfirm = ref(false)
const revokeTarget = ref<any>(null)
const revokeConfirmTitle = ref('')
const revokeConfirmMessage = ref('')

const nonCurrentSessions = computed(() => sessions.value.filter(s => !s.current))

const getDeviceIcon = (deviceType: string) => {
  switch (deviceType?.toLowerCase()) {
    case 'mobile':
    case 'phone':
      return DevicePhoneMobileIcon
    case 'tablet':
    case 'ipad':
      return DeviceTabletIcon
    default:
      return ComputerDesktopIcon
  }
}

const formatLastActive = (timestamp: string | number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minutes ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString()
}

const getSecurityStatus = (session: any) => {
  const lastActive = new Date(session.last_active)
  const now = new Date()
  const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60)

  if (session.current) return 'Active'
  if (diffHours < 1) return 'Recent'
  if (diffHours < 24) return 'Today'
  return 'Inactive'
}

const getSecurityStatusColor = (session: any) => {
  const status = getSecurityStatus(session)

  switch (status) {
    case 'Active':
      return 'bg-green-500'
    case 'Recent':
      return 'bg-blue-500'
    case 'Today':
      return 'bg-yellow-500'
    default:
      return 'bg-gray-400'
  }
}

const loadSessions = async () => {
  if (isLoading.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    sessions.value = await authStore.getActiveSessions()
  } catch (error: any) {
    console.error('Failed to load sessions:', error)
    errorMessage.value = error.message || 'Failed to load sessions'
  } finally {
    isLoading.value = false
  }
}

const revokeSession = (session: any) => {
  revokeTarget.value = session
  revokeConfirmTitle.value = 'Revoke Session'
  revokeConfirmMessage.value = `Are you sure you want to revoke the session on "${session.device_name || 'Unknown Device'}"? This will sign out that device immediately.`
  showRevokeConfirm.value = true
}

const revokeAllOtherSessions = () => {
  revokeTarget.value = 'all'
  revokeConfirmTitle.value = 'Revoke All Other Sessions'
  revokeConfirmMessage.value = `Are you sure you want to revoke all other sessions? This will sign out all devices except this one.`
  showRevokeConfirm.value = true
}

const confirmRevoke = async () => {
  showRevokeConfirm.value = false

  if (revokeTarget.value === 'all') {
    await handleRevokeAllOthers()
  } else {
    await handleRevokeSession(revokeTarget.value)
  }

  revokeTarget.value = null
}

const cancelRevoke = () => {
  showRevokeConfirm.value = false
  revokeTarget.value = null
}

const handleRevokeSession = async (session: any) => {
  revokingSessionId.value = session.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await authStore.revokeSession(session.id)

    // Remove session from list
    sessions.value = sessions.value.filter(s => s.id !== session.id)

    successMessage.value = `Session on "${session.device_name || 'Unknown Device'}" has been revoked.`

    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error: any) {
    console.error('Failed to revoke session:', error)
    errorMessage.value = error.message || 'Failed to revoke session'
  } finally {
    revokingSessionId.value = ''
  }
}

const handleRevokeAllOthers = async () => {
  isRevokingAll.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // Revoke all non-current sessions
    const promises = nonCurrentSessions.value.map(session => authStore.revokeSession(session.id))

    await Promise.all(promises)

    // Keep only current session
    sessions.value = sessions.value.filter(s => s.current)

    successMessage.value = 'All other sessions have been revoked.'

    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error: any) {
    console.error('Failed to revoke all sessions:', error)
    errorMessage.value = error.message || 'Failed to revoke all sessions'
  } finally {
    isRevokingAll.value = false
  }
}

onMounted(() => {
  loadSessions()
})
</script>
