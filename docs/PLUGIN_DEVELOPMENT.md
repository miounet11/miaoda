# Plugin Development Guide

This guide explains how to create plugins for MiaoDa Chat.

## Plugin Structure

Each plugin must have the following structure:

```
my-plugin/
├── manifest.json    # Plugin metadata (required)
├── index.js         # Main entry point (required)
├── README.md        # Plugin documentation (recommended)
└── assets/          # Additional resources (optional)
```

## Manifest File

The `manifest.json` file describes your plugin:

```json
{
  "id": "unique-plugin-id",
  "name": "My Plugin Name",
  "version": "1.0.0",
  "description": "Brief description of what the plugin does",
  "author": "Your Name",
  "homepage": "https://github.com/yourname/plugin",
  "capabilities": {
    "tools": true,      // Provides AI tools
    "commands": false,  // Provides commands (future)
    "themes": false,    // Provides themes (future)
    "ui": false        // Provides UI components (future)
  },
  "main": "index.js",
  "permissions": []     // Required permissions
}
```

## Plugin Class

Your `index.js` must export a class with these methods:

```javascript
class MyPlugin {
  constructor(api) {
    this.api = api  // Plugin API provided by MiaoDa Chat
  }

  async activate() {
    // Called when plugin is enabled
    console.log('Plugin activated!')
  }

  async deactivate() {
    // Called when plugin is disabled
    // Clean up resources here
  }

  // If capabilities.tools is true:
  getTools() {
    return [
      {
        name: 'tool_name',
        description: 'What this tool does',
        inputSchema: {
          type: 'object',
          properties: {
            param1: {
              type: 'string',
              description: 'Parameter description'
            }
          },
          required: ['param1']
        }
      }
    ]
  }

  async executeTool(toolName, args) {
    // Execute the tool and return results
    switch (toolName) {
      case 'tool_name':
        return { result: 'Tool output' }
      default:
        throw new Error(`Unknown tool: ${toolName}`)
    }
  }
}

module.exports = MyPlugin
```

## Plugin API

The plugin API provides access to MiaoDa Chat features:

### Workspace API

```javascript
// Listen for chat events
const disposable = this.api.workspace.onDidOpenChat((chatId) => {
  console.log(`Chat opened: ${chatId}`)
})

// Get active chat
const activeChat = this.api.workspace.getActiveChat()
```

### Messages API

```javascript
// Listen for messages
this.api.messages.onDidReceiveMessage((message) => {
  console.log('New message:', message)
})

// Send a message
await this.api.messages.sendMessage(chatId, 'Hello from plugin!')
```

### Storage API

```javascript
// Store plugin data
this.api.storage.set('myKey', { data: 'value' })

// Retrieve data
const data = this.api.storage.get('myKey')

// Delete data
this.api.storage.delete('myKey')
```

### UI API

```javascript
// Show notifications
this.api.ui.showMessage('Operation completed!', 'info')
this.api.ui.showMessage('Something went wrong', 'error')

// Get user input
const input = await this.api.ui.showInputBox({
  prompt: 'Enter your name',
  placeholder: 'John Doe'
})
```

## Tool Development

Tools allow the AI assistant to perform actions. Each tool must:

1. Have a unique name within your plugin
2. Provide a clear description
3. Define input schema using JSON Schema
4. Return structured data

Example tool that fetches weather:

```javascript
getTools() {
  return [{
    name: 'get_weather',
    description: 'Get current weather for a location',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City name or coordinates'
        },
        units: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: 'Temperature units'
        }
      },
      required: ['location']
    }
  }]
}

async executeTool(toolName, args) {
  if (toolName === 'get_weather') {
    // Fetch weather data
    const weather = await fetchWeather(args.location, args.units)
    return {
      location: args.location,
      temperature: weather.temp,
      conditions: weather.conditions,
      humidity: weather.humidity
    }
  }
}
```

## Best Practices

1. **Error Handling**: Always handle errors gracefully
   ```javascript
   try {
     const result = await riskyOperation()
     return { success: true, data: result }
   } catch (error) {
     return { success: false, error: error.message }
   }
   ```

2. **Resource Cleanup**: Clean up in `deactivate()`
   ```javascript
   async deactivate() {
     this.disposables.forEach(d => d.dispose())
     await this.closeConnections()
   }
   ```

3. **Permissions**: Only request necessary permissions
4. **Performance**: Avoid blocking operations
5. **Security**: Validate all inputs and sanitize outputs

## Testing Your Plugin

1. Create your plugin in the `example-plugins` directory
2. Run MiaoDa Chat in development mode: `npm run dev`
3. Copy your plugin to the plugins directory
4. Enable it from the settings

## Publishing

To share your plugin:

1. Create a GitHub repository
2. Include clear installation instructions
3. Add examples of how to use your tools
4. Submit to the MiaoDa Chat plugin registry (coming soon)

## Examples

See the `example-plugins` directory for complete examples:

- `calculator-plugin`: Mathematical tools
- `web-tools-plugin`: Web fetching and parsing tools

## Need Help?

- Check existing plugins for examples
- Open an issue on GitHub
- Join our community discussions