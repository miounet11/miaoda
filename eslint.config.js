import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

export default [
  // 基础配置
  js.configs.recommended,

  // Vue 配置
  ...vue.configs['flat/essential'],

  // TypeScript 配置
  {
    files: ['**/*.{ts,tsx,vue}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // TypeScript 规则
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',

      // 禁用基础规则，由 TypeScript 规则替代
      'no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },

  // Vue 文件特殊配置
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: typescriptParser,
        extraFileExtensions: ['.vue'],
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'error',
      'vue/require-v-for-key': 'error',
      'vue/no-use-v-if-with-v-for': 'error',
    },
  },

  // Electron 主进程配置
  {
    files: ['src/main/**/*.ts'],
    languageOptions: {
      globals: {
        // Node.js 全局变量
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        performance: 'readonly',
        NodeJS: 'readonly',
        // Electron 全局变量
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
      },
    },
    rules: {
      'no-console': 'off', // Electron 主进程可以使用 console
      '@typescript-eslint/no-var-requires': 'off', // Node.js 环境可以使用 require
      'no-undef': 'off', // Node.js 全局变量
    },
  },

  // Node.js 脚本文件配置
  {
    files: ['scripts/**/*.js', 'scripts/**/*.cjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      'no-console': 'off', // 脚本文件可以使用 console
      'no-undef': 'off', // Node.js 全局变量
    },
  },

  // 渲染进程配置
  {
    files: ['src/renderer/**/*.ts', 'src/renderer/**/*.vue'],
    languageOptions: {
      globals: {
        // 浏览器环境全局变量
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        performance: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        // Electron 渲染进程变量
        NodeJS: 'readonly',
      },
    },
    rules: {
      'no-console': 'warn', // 渲染进程不建议使用 console
      'no-undef': 'off', // 浏览器全局变量
    },
  },

  // 测试文件配置
  {
    files: ['src/test/**/*.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts'],
    languageOptions: {
      globals: {
        // Node.js 测试环境全局变量
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        performance: 'readonly',
        NodeJS: 'readonly',
        // Vitest/Jest 全局变量
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        vitest: 'readonly',
      },
    },
    rules: {
      'no-console': 'off', // 测试中可以使用 console
      'no-undef': 'off', // 测试环境全局变量
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
    },
  },

  // 全局忽略配置
  {
    ignores: [
      'node_modules/**',
      'out/**',
      'dist/**',
      'build/**',
      '**/*.config.js',
      '**/*.config.ts',
      'public/**',
      'example-plugins/**',
      'scripts/**',
    ],
  },

  // 通用规则
  {
    rules: {
      // 代码质量
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',

      // 代码风格
      'semi': ['error', 'never'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'comma-dangle': ['error', 'always-multiline'],
      'indent': ['error', 2, { SwitchCase: 1 }],
      'max-len': ['error', { code: 100, ignoreUrls: true, ignoreStrings: true }],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',

      // 最佳实践
      'eqeqeq': ['error', 'always'],
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'warn',
      'no-eval': 'error',
      'no-implied-eval': 'error',

      // 潜在错误
      'no-undef': 'error',
      'no-unused-vars': 'warn',
      'no-unreachable': 'error',
      'valid-typeof': 'error',
    },
  },
]
