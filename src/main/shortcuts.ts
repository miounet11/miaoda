import { globalShortcut, ipcMain, BrowserWindow } from 'electron'

export function registerShortcuts(mainWindow: BrowserWindow) {
  // Register global shortcuts
  const shortcuts = [
    {
      accelerator: 'CommandOrControl+N',
      action: () => {
        mainWindow.webContents.send('shortcut:new-chat')
      }
    },
    {
      accelerator: 'CommandOrControl+,',
      action: () => {
        mainWindow.webContents.send('shortcut:open-settings')
      }
    },
    {
      accelerator: 'CommandOrControl+K',
      action: () => {
        mainWindow.webContents.send('shortcut:focus-input')
      }
    },
    {
      accelerator: 'CommandOrControl+Shift+K',
      action: () => {
        mainWindow.webContents.send('shortcut:clear-chat')
      }
    },
    {
      accelerator: 'CommandOrControl+[',
      action: () => {
        mainWindow.webContents.send('shortcut:prev-chat')
      }
    },
    {
      accelerator: 'CommandOrControl+]',
      action: () => {
        mainWindow.webContents.send('shortcut:next-chat')
      }
    }
  ]

  // Register shortcuts when window is focused
  mainWindow.on('focus', () => {
    shortcuts.forEach(({ accelerator, action }) => {
      globalShortcut.register(accelerator, action)
    })
  })

  // Unregister when window loses focus
  mainWindow.on('blur', () => {
    globalShortcut.unregisterAll()
  })

  // Cleanup on window close
  mainWindow.on('closed', () => {
    globalShortcut.unregisterAll()
  })
}

// IPC handler for menu shortcuts
ipcMain.handle('shortcuts:get-all', () => {
  return [
    { key: 'Cmd/Ctrl+N', description: 'New Chat' },
    { key: 'Cmd/Ctrl+,', description: 'Open Settings' },
    { key: 'Cmd/Ctrl+K', description: 'Focus Input' },
    { key: 'Cmd/Ctrl+Shift+K', description: 'Clear Chat' },
    { key: 'Cmd/Ctrl+[', description: 'Previous Chat' },
    { key: 'Cmd/Ctrl+]', description: 'Next Chat' },
    { key: 'Enter', description: 'Send Message' },
    { key: 'Shift+Enter', description: 'New Line' },
    { key: 'Cmd/Ctrl+V', description: 'Paste Image' }
  ]
})