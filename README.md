# 🐱 MiaoDa Chat v4.1.0

> **Professional AI Chat Client with Grok-Inspired Monochromatic Design**

A modern, sophisticated AI chat application built with Electron + Vue 3 + TypeScript, featuring a distinctive black and white aesthetic inspired by Grok's clean design philosophy.

![Version](https://img.shields.io/badge/version-4.1.0-black)
![License](https://img.shields.io/badge/license-MIT-white)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgray)

## ✨ Key Features

### 🎨 **Grok-Inspired Monochromatic Design**
- **Pure Black & White Aesthetic** - Distraction-free interface with sophisticated grayscale hierarchy
- **Professional Appearance** - Clean, minimal design focused on content and functionality
- **Perfect Dark Mode** - Seamless light/dark theme transitions with optimal contrast
- **WCAG AAA Compliance** - 21:1 contrast ratios ensuring excellent accessibility

### 🤖 **Multi-LLM Support**
- **OpenAI GPT** (GPT-4, GPT-4o, GPT-3.5-turbo)
- **Anthropic Claude** (Claude 3.5 Sonnet, Claude 3 Opus/Haiku)
- **Google Gemini** (Gemini 1.5 Pro/Flash)
- **Ollama** (Local models)
- **Custom Providers** - Add your own API-compatible services

### 🌐 **Complete Chinese Localization**
- **Full Interface Translation** - Every UI element in Chinese
- **AI Chinese Responses** - Default system prompts ensure Chinese responses
- **Cultural Context** - Optimized for Chinese user experience and workflow

### 🔧 **Advanced Features**
- **MCP Integration** - Model Context Protocol for enhanced tool usage
- **Plugin System** - Extensible architecture for custom functionality
- **Voice I/O** - Speech-to-text and text-to-speech capabilities
- **Multi-Window Support** - Tabbed interface with window management
- **Advanced Search** - Full-text search with semantic understanding
- **Export Options** - Markdown, JSON, HTML, TXT formats
- **Local Storage** - SQLite database for privacy and performance

## 🚀 Installation

### Prerequisites
- Node.js >= 20.0.0
- Package manager: pnpm (recommended) or npm

### Quick Start (pnpm)
```bash
# Clone repository
git clone https://github.com/miounet11/miaodachat.git
cd miaodachat/miaoda-chat

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

### Quick Start (npm)
```bash
# Clone repository
git clone https://github.com/miounet11/miaodachat.git
cd miaodachat/miaoda-chat

# Install dependencies
npm ci

# Start development server
npm run dev
```

### Build for Production
```bash
# Using pnpm
pnpm run build
pnpm run build:mac   # macOS
pnpm run build:win   # Windows
pnpm run build:linux # Linux

# Using npm
npm run build
```

### Typecheck & Lint
```bash
# TypeScript typecheck
npm run typecheck   # or pnpm run typecheck

# ESLint
npm run lint        # or pnpm run lint
```

## 🎯 What's New in v4.1.0

### 🖤 Monochromatic Design Revolution
- **Complete Color Elimination** - All blues, purples, and colorful elements converted to sophisticated black/white/gray palette
- **Grok Aesthetic Replication** - Inspired by Grok's clean, distraction-free interface design
- **Enhanced Visual Hierarchy** - Typography and spacing create clear information organization without color dependency

### 🌐 Internationalization Excellence  
- **Perfect Chinese Interface** - Every text element properly localized
- **Smart AI Language Detection** - Automatic Chinese responses with fallback options
- **Cultural Optimization** - Interface patterns designed for Chinese user expectations

### ♿ Accessibility Leadership
- **WCAG AAA Standard** - Exceeding accessibility requirements with 21:1 contrast ratios
- **High Contrast Support** - Automatic enhancement for users with visual needs
- **Motion Sensitivity** - Respects user preferences for reduced motion
- **Keyboard Navigation** - Full application accessibility via keyboard

## 📱 Screenshots

*Coming soon - showcasing the new monochromatic design*

## 🏗️ Technical Architecture

### Frontend Stack
- **Vue 3** - Composition API with TypeScript
- **Tailwind CSS** - Utility-first styling with custom monochromatic theme
- **Pinia** - Modern state management
- **Radix Vue** - Accessible component primitives

### Desktop Platform
- **Electron** - Cross-platform desktop application
- **better-sqlite3** - High-performance local database
- **electron-vite** - Modern build tooling

### AI Integration
- **Multiple SDKs** - Native integration with OpenAI, Anthropic, Google APIs
- **Streaming Support** - Real-time response streaming
- **Context Management** - Advanced conversation handling

## 🛠️ Development

### Available Scripts
```bash
pnpm run dev         # Development server
pnpm run build       # Production build
pnpm run lint        # Code linting
pnpm run typecheck   # TypeScript validation
pnpm run test        # Run tests
pnpm run format      # Code formatting
```

### Project Structure
```
miaoda-chat/
├── src/
│   ├── main/              # Electron main process
│   │   ├── llm/          # LLM provider integrations
│   │   ├── mcp/          # Model Context Protocol
│   │   └── db/           # Database layer
│   ├── renderer/src/      # Vue 3 frontend
│   │   ├── components/   # Vue components
│   │   ├── styles/       # Monochromatic CSS system
│   │   ├── stores/       # Pinia state stores
│   │   └── locales/      # i18n translations
│   └── preload/          # Electron preload scripts
└── docs/                 # Documentation
```

## 🎨 Design Philosophy

**MiaoDa Chat v4.1.0** embraces a **"Clarity Through Simplicity"** approach:

- **Monochromatic Excellence** - Eliminate visual distractions to focus on conversation quality
- **Professional Sophistication** - Black and white design conveys authority and trustworthiness  
- **Accessibility First** - Every user can access full functionality regardless of visual capabilities
- **Performance Optimized** - Clean CSS architecture ensures fast rendering and low memory usage

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Grok** - Design inspiration for the monochromatic aesthetic
- **Vue.js Team** - For the excellent Vue 3 framework
- **Electron Team** - For enabling cross-platform desktop applications
- **Open Source Community** - For the countless libraries and tools

## 📞 Support

- **Issues** - [GitHub Issues](https://github.com/miounet11/miaodachat/issues)
- **Discussions** - [GitHub Discussions](https://github.com/miounet11/miaodachat/discussions)
- **Email** - support@miaodachat.com

---

**Made with ❤️ by MiaoDa Team**

*Bringing sophisticated AI conversation to your desktop with professional design and uncompromising accessibility.*

## 📦 Push to GitHub

If this is a new repo:
```bash
git init
git add -A
git commit -m "chore: initial cleanup and stabilization"
git branch -M main
git remote add origin <your_repo_url>
git push -u origin main
```

If the remote exists:
```bash
git add -A
git commit -m "docs: update README and installation; stabilize types"
git push
```