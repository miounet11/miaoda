# Calculator Plugin

A simple calculator plugin for MiaoDa Chat that provides mathematical tools.

## Features

- **calculate**: Evaluate mathematical expressions
- **factorial**: Calculate factorials
- **fibonacci**: Generate Fibonacci sequences
- **prime_check**: Check if a number is prime

## Installation

1. Copy this plugin folder to your MiaoDa Chat plugins directory:
   - macOS: `~/Library/Application Support/miaoda-chat/plugins/`
   - Windows: `%APPDATA%/miaoda-chat/plugins/`
   - Linux: `~/.config/miaoda-chat/plugins/`

2. Restart MiaoDa Chat or reload plugins from settings

## Usage

Once installed and enabled, the AI assistant can use these tools:

```
User: Calculate 2^10
Assistant: [Uses calculator:calculate tool with expression "2**10"]
Result: 1024

User: Is 17 prime?
Assistant: [Uses calculator:prime_check tool with number 17]
Result: Yes, 17 is prime

User: What are the first 10 Fibonacci numbers?
Assistant: [Uses calculator:fibonacci tool with n=10]
Result: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34
```

## Development

To create your own plugin:

1. Create a new folder with a unique name
2. Add a `manifest.json` file with plugin metadata
3. Create an `index.js` file that exports a plugin class
4. Implement the required lifecycle methods (`activate`, `deactivate`)
5. Add tool methods if your plugin provides tools

See the Calculator Plugin source code for a complete example.