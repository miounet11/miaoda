# Changelog

All notable changes to MiaoDa Chat will be documented in this file.

## [4.1.0] - 2025-08-22

### 🎨 Major UI/UX Overhaul - Grok Monochromatic Design

#### Added
- **Complete Grok-style monochromatic color system** - Pure black and white aesthetic
- **Advanced grayscale hierarchy** - 9-step gradation system for visual organization
- **Force color override system** - Comprehensive CSS overrides to eliminate all colorful elements
- **Enhanced accessibility compliance** - WCAG AAA contrast ratios (21:1 for primary text)
- **High contrast mode support** - Automatic enhancement for accessibility needs
- **Reduced motion support** - Respects user preferences for motion sensitivity

#### Changed
- **Complete color palette transformation** - All blues, purples, and gradients converted to monochromatic
- **Button system redesign** - All interactive elements now use black/white/gray variations
- **Chat interface overhaul** - Messages, bubbles, and UI elements follow monochromatic theme
- **Sidebar aesthetic update** - Clean black and white sidebar with enhanced typography hierarchy
- **Dark mode enhancement** - Perfect inversion system maintaining contrast and usability

#### Improved
- **Language consistency** - Fixed mixed Chinese/English text throughout interface
- **Input area localization** - Proper Chinese translations for all input controls
- **AI response language** - Added Chinese system prompts to ensure Chinese responses by default
- **Typography hierarchy** - Enhanced font weights and sizes for better information organization
- **Interactive feedback** - Subtle hover states and animations using grayscale variations
- **Shadow system** - Monochromatic shadows for depth perception without color distraction

#### Technical Enhancements
- **CSS Architecture Improvement** - New modular color system with proper import hierarchy
- **Performance Optimization** - Reduced CSS complexity and improved rendering performance  
- **Print Compatibility** - Optimized styles for print media
- **Component Consistency** - Unified styling approach across all Vue components

### 🌐 Internationalization Improvements

#### Fixed
- **Sidebar text translation** - All hardcoded English text converted to proper Chinese i18n
- **Empty state messages** - Proper Chinese translations for no-conversation states
- **Menu item localization** - Settings, Analytics, Export buttons now fully Chinese
- **Input hints** - Enter, Shift+Enter, and search shortcuts properly localized
- **Chat title display** - "New Chat" now displays as "新建聊天" in Chinese interface

### 🤖 AI Integration Enhancement

#### Added
- **Chinese system prompts** - Both OpenAI and Anthropic providers now default to Chinese responses
- **Language preference enforcement** - AI responds in Chinese unless specifically requested otherwise
- **Contextual assistance** - Improved AI understanding of Chinese user context

### 🏗️ Code Quality & Architecture

#### Technical Improvements
- **Modern CSS methodology** - CSS custom properties and systematic color management
- **Component refactoring** - Enhanced Vue 3 components with proper TypeScript integration
- **State management optimization** - Improved Pinia stores for better performance
- **Error handling enhancement** - Better error boundaries and user feedback

#### Files Added
- `src/renderer/src/styles/grok-monochrome.css` - Core monochromatic color system
- `src/renderer/src/styles/color-override-monochrome.css` - Force override system

#### Files Modified
- `src/renderer/src/assets/css/main.css` - Updated import hierarchy for color system
- `src/renderer/src/locales/zh-CN.ts` - Enhanced Chinese translations
- `src/renderer/src/components/chat/ChatSidebar.vue` - Complete i18n integration
- `src/main/llm/provider.ts` - Added Chinese system prompts for AI providers

### 🎯 User Experience Enhancements

#### Visual Improvements
- **Clean, distraction-free interface** - Grok-inspired minimalist design
- **Enhanced readability** - Optimal contrast ratios and typography choices
- **Consistent interaction patterns** - Unified hover states and visual feedback
- **Professional appearance** - Sophisticated black and white aesthetic

#### Usability Improvements  
- **Faster visual processing** - Reduced cognitive load with monochromatic design
- **Better focus management** - Enhanced focus indicators and keyboard navigation
- **Improved accessibility** - Color-independent information presentation
- **Seamless dark mode** - Perfect light/dark mode transitions

---

## [4.0.1] - Previous Release

### Features
- Modern AI Chat Client with Electron + Vue 3 + TypeScript
- Multiple LLM provider support (OpenAI, Anthropic Claude, Google, Ollama)
- MCP tool integration and extensible plugin system
- Advanced search capabilities with full-text indexing
- Multi-window support and tabbed interface
- Voice input/output functionality
- Export capabilities (Markdown, JSON, HTML, TXT)
- Real-time streaming responses
- Local SQLite database for chat history

### Technical Stack
- **Frontend**: Vue 3 (Composition API) + TypeScript + Tailwind CSS + Pinia
- **Desktop**: Electron with better-sqlite3 database  
- **Build Tools**: Vite + electron-vite + electron-builder
- **Testing**: Vitest + @vue/test-utils + happy-dom
- **LLM Integration**: OpenAI, Anthropic, Google GenAI, Ollama SDKs

---

## Installation & Usage

### Requirements
- Node.js >= 20.0.0
- pnpm >= 8.0.0

### Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build:mac    # macOS
pnpm run build:win    # Windows  
pnpm run build:linux  # Linux
```

### Features Highlights
- 🎨 **Grok-inspired monochromatic design** - Professional black and white aesthetic
- 🌐 **Full Chinese localization** - Complete interface translation and AI Chinese responses
- 🤖 **Multi-LLM support** - OpenAI, Claude, Google, Ollama, and custom providers
- 🔧 **MCP integration** - Model Context Protocol for advanced tool usage
- 📱 **Responsive design** - Optimized for desktop with mobile-friendly elements
- ♿ **Accessibility first** - WCAG AAA compliance with high contrast support
- 🌓 **Perfect dark mode** - Seamless light/dark theme switching
- 🔍 **Advanced search** - Full-text search with semantic capabilities
- 💾 **Local data storage** - SQLite database for privacy and performance
- 🎙️ **Voice features** - Speech-to-text and text-to-speech integration

---

*For complete documentation, visit the [project repository](https://github.com/miounet11/miaodachat)*