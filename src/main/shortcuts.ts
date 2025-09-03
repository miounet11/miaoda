import { globalShortcut, ipcMain, BrowserWindow } from 'electron'
import { logger } from './utils/Logger'

export function registerShortcuts(mainWindow: BrowserWindow) {
  // Register global shortcuts
  const shortcuts = [
    {
      accelerator: 'CommandOrControl+N',
      action: () => {
        mainWindow.webContents.send('shortcut:new-chat')
      },
    },
    {
      accelerator: 'CommandOrControl+,',
      action: () => {
        mainWindow.webContents.send('shortcut:open-settings')
      },
    },
    {
      accelerator: 'CommandOrControl+K',
      action: () => {
        mainWindow.webContents.send('shortcut:focus-input')
      },
    },
    {
      accelerator: 'CommandOrControl+Shift+K',
      action: () => {
        mainWindow.webContents.send('shortcut:clear-chat')
      },
    },
    {
      accelerator: 'CommandOrControl+[',
      action: () => {
        mainWindow.webContents.send('shortcut:prev-chat')
      },
    },
    {
      accelerator: 'CommandOrControl+]',
      action: () => {
        mainWindow.webContents.send('shortcut:next-chat')
      },
    },
    {
      accelerator: 'CommandOrControl+Shift+?',
      action: () => {
        mainWindow.webContents.send('shortcut:show-help')
      },
    },
    {
      accelerator: 'CommandOrControl+Tab',
      action: () => {
        mainWindow.webContents.send('shortcut:next-tab')
      },
    },
    {
      accelerator: 'Alt+1',
      action: () => {
        mainWindow.webContents.send('shortcut:switch-tab', 0)
      },
    },
    {
      accelerator: 'Alt+2',
      action: () => {
        mainWindow.webContents.send('shortcut:switch-tab', 1)
      },
    },
    {
      accelerator: 'Alt+3',
      action: () => {
        mainWindow.webContents.send('shortcut:switch-tab', 2)
      },
    },
    {
      accelerator: 'CommandOrControl+Shift+I',
      action: () => {
        mainWindow.webContents.toggleDevTools()
      },
    },
    {
      accelerator: 'F12',
      action: () => {
        mainWindow.webContents.toggleDevTools()
      },
    },
  ]

  // Register shortcuts when window is focused
  const registerAllShortcuts = () => {
    shortcuts.forEach(({ accelerator, action }) => {
      try {
        // Check if shortcut is already registered
        if (globalShortcut.isRegistered(accelerator)) {
          globalShortcut.unregister(accelerator)
        }

        const success = globalShortcut.register(accelerator, action)
        if (!success) {
          logger.warn(`Failed to register shortcut: ${accelerator}`, 'Shortcuts', {
            accelerator,
            reason: 'Global shortcut registration returned false',
          })
        } else {
          logger.debug(`Successfully registered shortcut: ${accelerator}`, 'Shortcuts')
        }
      } catch (error) {
        logger.error(`Error registering shortcut ${accelerator}`, 'Shortcuts', error)
        // Don't throw - allow other shortcuts to be registered
      }
    })
  }

  const unregisterAllShortcuts = () => {
    globalShortcut.unregisterAll()
  }

  // Register shortcuts when window is focused
  mainWindow.on('focus', registerAllShortcuts)

  // Unregister when window loses focus (only on Windows/Linux)
  if (process.platform !== 'darwin') {
    mainWindow.on('blur', unregisterAllShortcuts)
  }

  // Cleanup on window close
  mainWindow.on('closed', unregisterAllShortcuts)

  // Register shortcuts immediately for better UX
  registerAllShortcuts()
}

// Export handler for registration
export function registerShortcutHandlers() {
  ipcMain.handle('shortcuts:get-all', () => {
    return [
      { key: 'Cmd/Ctrl+N', description: 'New Chat' },
      { key: 'Cmd/Ctrl+,', description: 'Open Settings' },
      { key: 'Cmd/Ctrl+K', description: 'Focus Input' },
      { key: 'Cmd/Ctrl+Shift+K', description: 'Clear Chat' },
      { key: 'Cmd/Ctrl+[', description: 'Previous Chat' },
      { key: 'Cmd/Ctrl+]', description: 'Next Chat' },
      { key: 'Cmd/Ctrl+Shift+?', description: 'Show Help' },
      { key: 'Cmd/Ctrl+Tab', description: 'Next Tab' },
      { key: 'Alt+1', description: 'Switch to Tab 1' },
      { key: 'Alt+2', description: 'Switch to Tab 2' },
      { key: 'Alt+3', description: 'Switch to Tab 3' },
      { key: 'Cmd/Ctrl+Shift+I', description: 'Toggle Developer Tools' },
      { key: 'F12', description: 'Toggle Developer Tools' },
      { key: 'Enter', description: 'Send Message' },
      { key: 'Shift+Enter', description: 'New Line' },
      { key: 'Cmd/Ctrl+V', description: 'Paste Image' },
    ]
  })
}
