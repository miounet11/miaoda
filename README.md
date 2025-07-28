# MiaoDa Chat

A modern, extensible AI chat client combining the best features of DeepChat and ChatBox. Built with Electron, Vue 3, and TypeScript.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

## Features

### 🚀 Core Features
- **Multi-LLM Support**: OpenAI, Anthropic Claude, and Ollama
- **Local Data Storage**: All your data stays on your device
- **Real-time Streaming**: See AI responses as they're generated
- **File Attachments**: Share images and text files in conversations
- **Keyboard Shortcuts**: Boost productivity with customizable shortcuts
- **Modern UI**: Clean, intuitive interface inspired by Claude AI and Grok

### 🛠️ Advanced Features
- **MCP Tool Integration**: Enable AI to use filesystem, code execution, and custom tools
- **Plugin System**: Extend functionality with custom plugins
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Quick Start

```bash
# Clone the repository
git clone https://github.com/miounet11/miaodachat.git
cd miaodachat/miaoda-chat

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

## Configuration

### LLM Providers

Configure your preferred AI provider in Settings:
- **OpenAI**: Requires API key from [OpenAI](https://platform.openai.com)
- **Anthropic**: Requires API key from [Anthropic](https://console.anthropic.com)
- **Ollama**: Requires [Ollama](https://ollama.ai) running locally

### MCP Tools

Enable AI tools in Settings > LLM Provider > Enable MCP Tools

## Plugin System

MiaoDa Chat supports custom plugins. See [Plugin Development Guide](docs/PLUGIN_DEVELOPMENT.md) for details.

### Example Plugins
- **Calculator Plugin**: Mathematical calculations
- **Web Tools Plugin**: URL fetching and parsing

Install example plugins:
```bash
node scripts/install-example-plugins.js
```

## Development

### Tech Stack
- **Frontend**: Vue 3, TypeScript, Tailwind CSS
- **Backend**: Electron, SQLite
- **LLM Integration**: OpenAI, Anthropic, Ollama SDKs
- **Build Tools**: Vite, electron-vite

### Project Structure
```
miaoda-chat/
├── src/
│   ├── main/           # Electron main process
│   │   ├── llm/        # LLM providers
│   │   ├── mcp/        # MCP integration
│   │   └── plugins/    # Plugin system
│   ├── preload/        # Preload scripts
│   └── renderer/       # Vue 3 frontend
└── example-plugins/    # Example plugins
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- Inspired by [DeepChat](https://github.com/thinkinaixyz/deepchat) and [ChatBox](https://github.com/Bin-Huang/chatbox)
- Built with [Electron](https://www.electronjs.org/) and [Vue](https://vuejs.org/)

---

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>