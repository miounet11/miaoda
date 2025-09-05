import { dialog, ipcMain } from 'electron'
import { readFile } from 'fs/promises'
import { basename, extname } from 'path'
import { createHash } from 'crypto'
import { logger } from './utils/Logger'

export interface FileInfo {
  path: string
  name: string
  size: number
  type: string
  data?: string // Base64 for images
  content?: string // Text content for text files
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
const TEXT_EXTENSIONS = [
  '.txt',
  '.md',
  '.json',
  '.js',
  '.ts',
  '.py',
  '.java',
  '.cpp',
  '.c',
  '.h',
  '.css',
  '.html',
  '.xml',
  '.yaml',
  '.yml'
]

export async function handleFileSelect(): Promise<FileInfo[]> {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] },
      {
        name: 'Text Files',
        extensions: [
          'txt',
          'md',
          'json',
          'js',
          'ts',
          'py',
          'java',
          'cpp',
          'c',
          'h',
          'css',
          'html',
          'xml',
          'yaml',
          'yml'
        ]
      },
      { name: 'All Files', extensions: ['*'] }
    ]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return []
  }

  const files: FileInfo[] = []

  for (const filePath of result.filePaths) {
    try {
      const buffer = await readFile(filePath)
      const ext = extname(filePath).toLowerCase()
      const name = basename(filePath)
      const size = buffer.length

      const fileInfo: FileInfo = {
        path: filePath,
        name,
        size,
        type: getFileType(ext)
      }

      if (IMAGE_EXTENSIONS.includes(ext)) {
        // Convert image to base64
        fileInfo.data = `data:image/${ext.slice(1)};base64,${buffer.toString('base64')}`
      } else if (TEXT_EXTENSIONS.includes(ext)) {
        // Read text content
        fileInfo.content = buffer.toString('utf-8')
      }

      files.push(fileInfo)
    } catch (error) {
      logger.error(`Failed to read file ${filePath}`, 'FileHandler', error)
    }
  }

  return files
}

export async function handleFilePaste(dataUrl: string): Promise<FileInfo> {
  // Extract mime type and base64 data
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/)
  if (!matches) {
    throw new Error('Invalid data URL')
  }

  const mimeType = matches[1]
  const base64Data = matches[2]
  const buffer = Buffer.from(base64Data, 'base64')

  // Generate unique filename
  const hash = createHash('md5').update(buffer).digest('hex').slice(0, 8)
  const ext = mimeType.split('/')[1] || 'png'
  const name = `pasted-${hash}.${ext}`

  return {
    path: '',
    name,
    size: buffer.length,
    type: 'image',
    data: dataUrl
  }
}

function getFileType(ext: string): string {
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image'
  if (TEXT_EXTENSIONS.includes(ext)) return 'text'
  return 'file'
}

// Export handlers for registration
export function registerFileHandlers() {
  ipcMain.handle('file:select', handleFileSelect)
  ipcMain.handle('file:paste', async (_, dataUrl: string) => {
    return handleFilePaste(dataUrl)
  })
}
