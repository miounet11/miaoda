// @ts-nocheck
import { ref, reactive } from 'vue'
import type { ExportOptions, ExportResult, ExportProgress } from './ExportService'

export interface ExportTask {
  id: string
  name: string
  options: ExportOptions
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  result?: ExportResult
  error?: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  priority: 'low' | 'normal' | 'high'
  retryCount: number
  maxRetries: number
}

export interface QueueStats {
  total: number
  pending: number
  running: number
  completed: number
  failed: number
  cancelled: number
}

export type TaskCallback = (task: ExportTask) => Promise<ExportResult>
export type ProgressCallback = (taskId: string, progress: ExportProgress) => void
export type StatusCallback = (task: ExportTask) => void

export class ExportQueue {
  private static instance: ExportQueue
  private tasks = reactive<Map<string, ExportTask>>(new Map())
  private isProcessing = ref(false)
  private maxConcurrency = 2
  private runningTasks = new Set<string>()
  private progressCallbacks = new Map<string, ProgressCallback>()
  private statusCallbacks = new Set<StatusCallback>()
  private taskCallback?: TaskCallback

  private constructor() {}

  static getInstance(): ExportQueue {
    if (!ExportQueue.instance) {
      ExportQueue.instance = new ExportQueue()
    }
    return ExportQueue.instance
  }

  /**
   * Set task execution callback
   */
  setTaskCallback(callback: TaskCallback): void {
    this.taskCallback = callback
  }

  /**
   * Add task to queue
   */
  addTask(
    name: string,
    options: ExportOptions,
    priority: 'low' | 'normal' | 'high' = 'normal',
    maxRetries: number = 3
  ): string {
    const taskId = this.generateTaskId()
    const task: ExportTask = {
      id: taskId,
      name,
      options,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      priority,
      retryCount: 0,
      maxRetries
    }

    this.tasks.set(taskId, task)
    this.notifyStatusCallbacks(task)

    // Start processing if not already running
    if (!this.isProcessing.value) {
      this.startProcessing()
    }

    return taskId
  }

  /**
   * Cancel task
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task || task.status === 'completed' || task.status === 'cancelled') {
      return false
    }

    task.status = 'cancelled'
    task.completedAt = new Date()
    this.runningTasks.delete(taskId)
    this.notifyStatusCallbacks(task)

    return true
  }

  /**
   * Retry failed task
   */
  retryTask(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task || task.status !== 'failed') {
      return false
    }

    if (task.retryCount >= task.maxRetries) {
      return false
    }

    task.status = 'pending'
    task.progress = 0
    task.error = undefined
    task.retryCount++
    this.notifyStatusCallbacks(task)

    if (!this.isProcessing.value) {
      this.startProcessing()
    }

    return true
  }

  /**
   * Remove task from queue
   */
  removeTask(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task) {
      return false
    }

    if (task.status === 'running') {
      this.cancelTask(taskId)
    }

    this.tasks.delete(taskId)
    this.progressCallbacks.delete(taskId)

    return true
  }

  /**
   * Clear completed tasks
   */
  clearCompleted(): number {
    let removedCount = 0

    for (const [taskId, task] of this.tasks.entries()) {
      if (task.status === 'completed' || task.status === 'cancelled') {
        this.tasks.delete(taskId)
        this.progressCallbacks.delete(taskId)
        removedCount++
      }
    }

    return removedCount
  }

  /**
   * Clear all tasks
   */
  clearAll(): number {
    // Cancel running tasks first
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.status === 'running') {
        this.cancelTask(taskId)
      }
    }

    const removedCount = this.tasks.size
    this.tasks.clear()
    this.progressCallbacks.clear()
    this.runningTasks.clear()

    return removedCount
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): ExportTask | undefined {
    return this.tasks.get(taskId)
  }

  /**
   * Get all tasks
   */
  getAllTasks(): ExportTask[] {
    return Array.from(this.tasks.values()).sort((a, b) => {
      // Sort by priority, then by creation time
      const priorityOrder = { high: 3, normal: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]

      if (priorityDiff !== 0) {
        return priorityDiff
      }

      return a.createdAt.getTime() - b.createdAt.getTime()
    })
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const stats: QueueStats = {
      total: 0,
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    }

    for (const task of this.tasks.values()) {
      stats.total++
      stats[task.status]++
    }

    return stats
  }

  /**
   * Set progress callback for specific task
   */
  setProgressCallback(taskId: string, callback: ProgressCallback): void {
    this.progressCallbacks.set(taskId, callback)
  }

  /**
   * Add status change callback
   */
  addStatusCallback(callback: StatusCallback): void {
    this.statusCallbacks.add(callback)
  }

  /**
   * Remove status change callback
   */
  removeStatusCallback(callback: StatusCallback): void {
    this.statusCallbacks.delete(callback)
  }

  /**
   * Set maximum concurrency
   */
  setMaxConcurrency(max: number): void {
    this.maxConcurrency = Math.max(1, max)
  }

  /**
   * Get processing status
   */
  getIsProcessing(): boolean {
    return this.isProcessing.value
  }

  /**
   * Start processing queue
   */
  private async startProcessing(): Promise<void> {
    if (this.isProcessing.value || !this.taskCallback) {
      return
    }

    this.isProcessing.value = true

    try {
      while (this.hasPendingTasks() || this.runningTasks.size > 0) {
        // Start new tasks if we have capacity
        while (this.runningTasks.size < this.maxConcurrency && this.hasPendingTasks()) {
          const nextTask = this.getNextTask()
          if (nextTask) {
            this.processTask(nextTask)
          }
        }

        // Wait a bit before checking again
        await this.delay(100)
      }
    } finally {
      this.isProcessing.value = false
    }
  }

  /**
   * Process individual task
   */
  private async processTask(task: ExportTask): Promise<void> {
    if (task.status !== 'pending') {
      return
    }

    this.runningTasks.add(task.id)
    task.status = 'running'
    task.startedAt = new Date()
    task.progress = 0
    this.notifyStatusCallbacks(task)

    try {
      // Set up progress callback
      const progressCallback = (progress: ExportProgress) => {
        task.progress = Math.round(progress.progress)

        // Notify specific task callback
        const taskProgressCallback = this.progressCallbacks.get(task.id)
        if (taskProgressCallback) {
          taskProgressCallback(task.id, progress)
        }

        this.notifyStatusCallbacks(task)
      }

      // Execute the task
      if (!this.taskCallback) {
        throw new Error('No task callback set')
      }

      const result = await this.taskCallback({
        ...task,
        options: {
          ...task.options
          // Add progress callback to options if supported
        }
      })

      // Task completed successfully
      task.status = 'completed'
      task.progress = 100
      task.result = result
      task.completedAt = new Date()
      this.notifyStatusCallbacks(task)
    } catch (error: any) {
      // Task failed
      task.status = 'failed'
      task.error = error.message || 'Unknown error occurred'
      task.completedAt = new Date()
      this.notifyStatusCallbacks(task)

      console.error(`Export task ${task.id} failed:`, error)
    } finally {
      this.runningTasks.delete(task.id)
    }
  }

  /**
   * Check if there are pending tasks
   */
  private hasPendingTasks(): boolean {
    for (const task of this.tasks.values()) {
      if (task.status === 'pending') {
        return true
      }
    }
    return false
  }

  /**
   * Get next task to process (highest priority first)
   */
  private getNextTask(): ExportTask | undefined {
    const pendingTasks = Array.from(this.tasks.values())
      .filter(task => task.status === 'pending')
      .sort((a, b) => {
        // Sort by priority, then by creation time
        const priorityOrder = { high: 3, normal: 2, low: 1 }
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]

        if (priorityDiff !== 0) {
          return priorityDiff
        }

        return a.createdAt.getTime() - b.createdAt.getTime()
      })

    return pendingTasks[0]
  }

  /**
   * Notify status callbacks
   */
  private notifyStatusCallbacks(task: ExportTask): void {
    for (const callback of this.statusCallbacks) {
      try {
        callback(task)
      } catch (error) {
        console.error('Status callback error:', error)
      }
    }
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get estimated completion time for pending tasks
   */
  getEstimatedCompletionTime(): number {
    const pendingTasks = Array.from(this.tasks.values()).filter(task => task.status === 'pending')
    const runningTasks = Array.from(this.tasks.values()).filter(task => task.status === 'running')

    if (pendingTasks.length === 0) {
      return 0
    }

    // Estimate based on completed tasks average time
    const completedTasks = Array.from(this.tasks.values()).filter(
      task => task.status === 'completed' && task.startedAt && task.completedAt
    )

    let averageTime = 30000 // Default 30 seconds

    if (completedTasks.length > 0) {
      const totalTime = completedTasks.reduce((sum, task) => {
        return sum + (task.completedAt!.getTime() - task.startedAt!.getTime())
      }, 0)
      averageTime = totalTime / completedTasks.length
    }

    // Consider concurrency
    const remainingSlots = Math.max(0, this.maxConcurrency - runningTasks.length)
    const parallelBatches = Math.ceil((pendingTasks.length - remainingSlots) / this.maxConcurrency)

    return Math.max(0, parallelBatches * averageTime)
  }
}

// Export singleton instance
export const exportQueue = ExportQueue.getInstance()
