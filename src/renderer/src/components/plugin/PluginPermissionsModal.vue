<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="modal-overlay"
      @click.self="$emit('close')"
    >
      <div class="permissions-modal">
        <div class="modal-header">
          <h3>Plugin Permissions</h3>
          <button
            type="button"
            class="close-button"
            @click="$emit('close')"
          >
            <X :size="20" />
          </button>
        </div>

        <div class="modal-content">
          <div class="plugin-info">
            <div class="plugin-icon">
              <img
                v-if="plugin.icon"
                :src="plugin.icon"
                :alt="plugin.name"
              >
              <Package v-else :size="24" />
            </div>
            <div class="plugin-details">
              <h4>{{ plugin.name }}</h4>
              <p class="version">v{{ plugin.version }}</p>
            </div>
          </div>

          <div class="permissions-section">
            <h4>Required Permissions</h4>
            <div class="permissions-list">
              <div
                v-for="permission in permissions"
                :key="permission.name"
                class="permission-item"
              >
                <div class="permission-icon">
                  <component :is="permission.icon" :size="16" />
                </div>
                <div class="permission-info">
                  <div class="permission-name">{{ permission.name }}</div>
                  <div class="permission-description">{{ permission.description }}</div>
                </div>
                <div class="permission-status">
                  <span
                    class="status-badge"
                    :class="permission.granted ? 'granted' : 'denied'"
                  >
                    {{ permission.granted ? 'Granted' : 'Required' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="warning-section" v-if="hasHighRiskPermissions">
            <div class="warning-header">
              <AlertTriangle :size="16" class="warning-icon" />
              <span>High Risk Permissions</span>
            </div>
            <p class="warning-text">
              This plugin requires permissions that could access sensitive data or system resources.
              Only install plugins from trusted sources.
            </p>
          </div>
        </div>

        <div class="modal-actions">
          <button
            type="button"
            class="btn btn-secondary"
            @click="$emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="handleApprove"
            :disabled="!canApprove"
          >
            {{ approveButtonText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X, Package, AlertTriangle, Shield, FileText, Globe, HardDrive, Settings } from 'lucide-vue-next'

interface Plugin {
  name: string
  version: string
  icon?: string
  permissions?: string[]
}

interface Permission {
  name: string
  description: string
  icon: any
  granted: boolean
  risk: 'low' | 'medium' | 'high'
}

interface Props {
  show: boolean
  plugin: Plugin
}

interface Emits {
  (e: 'close'): void
  (e: 'approve', permissions: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Permission definitions
const permissionTypes = {
  'read-chats': {
    name: 'Read Chat History',
    description: 'Access your conversation history and messages',
    icon: FileText,
    risk: 'medium'
  },
  'write-chats': {
    name: 'Modify Chats',
    description: 'Create, edit, or delete conversations',
    icon: FileText,
    risk: 'high'
  },
  'network-access': {
    name: 'Network Access',
    description: 'Make network requests to external services',
    icon: Globe,
    risk: 'medium'
  },
  'file-system': {
    name: 'File System Access',
    description: 'Read and write files on your computer',
    icon: HardDrive,
    risk: 'high'
  },
  'system-info': {
    name: 'System Information',
    description: 'Access system and hardware information',
    icon: Settings,
    risk: 'low'
  },
  'ui-modification': {
    name: 'UI Modification',
    description: 'Modify the application interface',
    icon: Settings,
    risk: 'medium'
  }
}

const permissions = computed((): Permission[] => {
  if (!props.plugin.permissions) return []
  
  return props.plugin.permissions.map(perm => {
    const permType = permissionTypes[perm as keyof typeof permissionTypes]
    return {
      name: permType?.name || perm,
      description: permType?.description || 'Unknown permission',
      icon: permType?.icon || Shield,
      granted: false, // In a real implementation, this would check actual permission status
      risk: permType?.risk || 'medium'
    }
  })
})

const hasHighRiskPermissions = computed(() => {
  return permissions.value.some(p => p.risk === 'high')
})

const canApprove = computed(() => {
  return true // In a real implementation, this would check if all required permissions can be granted
})

const approveButtonText = computed(() => {
  return hasHighRiskPermissions.value ? 'Grant Permissions (High Risk)' : 'Grant Permissions'
})

const handleApprove = () => {
  emit('approve', props.plugin.permissions || [])
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.permissions-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #f3f4f6;
}

.modal-content {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.plugin-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
}

.plugin-icon img {
  width: 32px;
  height: 32px;
  border-radius: 6px;
}

.plugin-details h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.version {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.permissions-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.permissions-list {
  space-y: 12px;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 12px;
}

.permission-icon {
  flex-shrink: 0;
  color: #6b7280;
}

.permission-info {
  flex: 1;
}

.permission-name {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
}

.permission-description {
  font-size: 14px;
  color: #6b7280;
}

.permission-status {
  flex-shrink: 0;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.granted {
  background-color: #d1fae5;
  color: #065f46;
}

.status-badge.denied {
  background-color: #fef3c7;
  color: #92400e;
}

.warning-section {
  margin-top: 20px;
  padding: 16px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
  color: #dc2626;
}

.warning-icon {
  color: #dc2626;
}

.warning-text {
  margin: 0;
  font-size: 14px;
  color: #7f1d1d;
}

.modal-actions {
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-primary:disabled {
  background-color: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .permissions-modal {
    background: #1f2937;
    color: #f9fafb;
  }

  .modal-header {
    border-bottom-color: #374151;
  }

  .modal-header h3 {
    color: #f9fafb;
  }

  .close-button {
    color: #9ca3af;
  }

  .close-button:hover {
    background-color: #374151;
  }

  .plugin-info {
    background-color: #374151;
  }

  .plugin-details h4 {
    color: #f9fafb;
  }

  .permissions-section h4 {
    color: #f9fafb;
  }

  .permission-item {
    border-color: #374151;
    background-color: #374151;
  }

  .permission-name {
    color: #f9fafb;
  }

  .permission-description {
    color: #d1d5db;
  }

  .modal-actions {
    border-top-color: #374151;
  }

  .btn-secondary {
    background-color: #374151;
    color: #d1d5db;
  }

  .btn-secondary:hover {
    background-color: #4b5563;
  }
}
</style>