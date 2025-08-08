export function formatDistanceToNow(date: Date | string | number): string {
  try {
    // Handle different input types
    let dateObj: Date
    
    if (date instanceof Date) {
      dateObj = date
    } else if (typeof date === 'string') {
      dateObj = new Date(date)
    } else if (typeof date === 'number') {
      dateObj = new Date(date)
    } else {
      // If date is null, undefined, or invalid type
      return 'unknown'
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatDistanceToNow:', date)
      return 'unknown'
    }
    
    const now = new Date()
    const diff = now.getTime() - dateObj.getTime()
    
    // Handle future dates
    if (diff < 0) {
      return 'in the future'
    }
    
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 30) {
      // Show actual date for old messages
      return dateObj.toLocaleDateString()
    } else if (days > 0) {
      return `${days}d ago`
    } else if (hours > 0) {
      return `${hours}h ago`
    } else if (minutes > 0) {
      return `${minutes}m ago`
    } else {
      return 'just now'
    }
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', date)
    return 'unknown'
  }
}