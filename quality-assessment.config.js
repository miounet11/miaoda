/**
 * Quality Assessment Configuration for MiaoDa Chat
 * Used by quality-mcp MCP server for code analysis
 */

module.exports = {
  // Project-specific settings
  project: {
    name: 'miaoda-chat',
    version: '1.0.1',
    description: 'Modern AI Chat Client built with Electron + Vue 3 + TypeScript',
    type: 'desktop-application'
  },

  // Analysis targets
  analysis: {
    // Directories to analyze
    includePaths: [
      'src/main',
      'src/renderer/src',
      'src/preload'
    ],
    
    // Directories to exclude
    excludePaths: [
      'node_modules',
      'dist',
      'out',
      '.git',
      'coverage',
      '__tests__',
      '*.test.*'
    ],
    
    // File extensions to analyze
    fileExtensions: [
      '.ts',
      '.tsx', 
      '.js',
      '.jsx',
      '.vue'
    ],
    
    // Maximum file size for analysis (in bytes)
    maxFileSize: 1000000 // 1MB
  },

  // Quality rules and thresholds
  quality: {
    // Duplicate code detection
    duplicateCode: {
      enabled: true,
      minLines: 5,           // Minimum lines for duplicate detection
      minTokens: 50,         // Minimum tokens for duplicate detection
      similarityThreshold: 0.8, // 80% similarity threshold
      excludePatterns: [
        'console.log',
        'import.*from',
        'export.*{}'
      ]
    },

    // Complexity analysis
    complexity: {
      enabled: true,
      cyclomaticThreshold: 10,    // Maximum cyclomatic complexity
      cognitiveThreshold: 15,     // Maximum cognitive complexity
      nestingDepthThreshold: 4    // Maximum nesting depth
    },

    // Code smells detection
    codeSmells: {
      enabled: true,
      largeMethods: {
        threshold: 50  // Lines per method/function
      },
      largeClasses: {
        threshold: 500 // Lines per class/component
      },
      longParameterLists: {
        threshold: 5   // Max parameters per function
      }
    },

    // Architecture violations
    architecture: {
      enabled: true,
      // Layer dependencies (main -> renderer should be avoided)
      forbiddenDependencies: [
        {
          from: 'src/main/**',
          to: 'src/renderer/**',
          reason: 'Main process should not depend on renderer'
        },
        {
          from: 'src/preload/**',
          to: 'src/renderer/**',
          reason: 'Preload should not depend on renderer'
        }
      ]
    },

    // TypeScript specific rules
    typescript: {
      enabled: true,
      strictMode: true,
      noImplicitAny: true,
      noUnusedLocals: true,
      noUnusedParameters: true
    },

    // Vue.js specific rules
    vue: {
      enabled: true,
      compositionApiPreferred: true,
      singleFileComponentStructure: true,
      propsValidation: true
    }
  },

  // Reporting configuration
  reporting: {
    formats: ['json', 'markdown'],
    outputDir: './quality-reports',
    
    // Severity levels
    severity: {
      high: {
        duplicateCode: true,
        securityIssues: true,
        architectureViolations: true
      },
      medium: {
        complexity: true,
        codeSmells: true,
        performanceIssues: true
      },
      low: {
        codingStandards: true,
        documentation: true,
        minorRefactoring: true
      }
    },

    // Report sections
    sections: {
      summary: true,
      duplicateCode: true,
      complexity: true,
      codeSmells: true,
      architecture: true,
      recommendations: true,
      metrics: true
    }
  },

  // Integration settings
  integration: {
    // MCP server settings
    mcp: {
      timeout: 30000,      // 30 seconds timeout
      maxConcurrency: 3,   // Max concurrent analysis tasks
      chunkSize: 100       // Files per chunk
    },

    // Tool preferences (when multiple tools available)
    tools: {
      duplicateDetection: 'dcd',    // Prefer DCD over Simian
      complexity: 'builtin',       // Use built-in complexity analysis
      linting: 'eslint'            // Use ESLint for code standards
    }
  },

  // Custom rules specific to this project
  customRules: {
    // Electron-specific rules
    electron: {
      noRendererInMain: true,
      ipcSecurityCheck: true,
      nodeIntegrationDisabled: true
    },

    // Vue 3 + TypeScript best practices
    vueTypescript: {
      defineComponentUsage: true,
      compositionApiConsistency: true,
      propsInterfaceDefinition: true
    },

    // Pinia store patterns
    pinia: {
      storeStructure: true,
      actionTypeInference: true,
      gettersCaching: true
    }
  }
};