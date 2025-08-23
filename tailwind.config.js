/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Legacy compatibility colors (mapped to monochromatic)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },

        // New monochromatic color system
        mono: {
          white: 'hsl(var(--mono-white))',
          50: 'hsl(var(--mono-50))',
          100: 'hsl(var(--mono-100))',
          200: 'hsl(var(--mono-200))',
          300: 'hsl(var(--mono-300))',
          400: 'hsl(var(--mono-400))',
          500: 'hsl(var(--mono-500))',
          600: 'hsl(var(--mono-600))',
          700: 'hsl(var(--mono-700))',
          800: 'hsl(var(--mono-800))',
          900: 'hsl(var(--mono-900))',
          black: 'hsl(var(--mono-black))'
        },

        // Semantic color tokens
        text: {
          primary: 'hsl(var(--text-primary))',
          secondary: 'hsl(var(--text-secondary))',
          tertiary: 'hsl(var(--text-tertiary))',
          muted: 'hsl(var(--text-muted))',
          disabled: 'hsl(var(--text-disabled))',
          inverse: 'hsl(var(--text-inverse))'
        },

        bg: {
          canvas: 'hsl(var(--bg-canvas))',
          surface: 'hsl(var(--bg-surface))',
          elevated: 'hsl(var(--bg-elevated))',
          subtle: 'hsl(var(--bg-subtle))',
          muted: 'hsl(var(--bg-muted))',
          strong: 'hsl(var(--bg-strong))',
          inverse: 'hsl(var(--bg-inverse))'
        },

        interactive: {
          default: 'hsl(var(--interactive-default))',
          hover: 'hsl(var(--interactive-hover))',
          active: 'hsl(var(--interactive-active))',
          focus: 'hsl(var(--interactive-focus))',
          disabled: 'hsl(var(--interactive-disabled))',
          selected: 'hsl(var(--interactive-selected))'
        },

        borders: {
          default: 'hsl(var(--border-default))',
          muted: 'hsl(var(--border-muted))',
          strong: 'hsl(var(--border-strong))',
          focus: 'hsl(var(--border-focus))',
          disabled: 'hsl(var(--border-disabled))'
        },

        status: {
          neutral: 'hsl(var(--status-neutral))',
          emphasis: 'hsl(var(--status-emphasis))',
          subtle: 'hsl(var(--status-subtle))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'slide-in': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' }
        },
        'fade-in': {
          from: { opacity: 0 },
          to: { opacity: 1 }
        }
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out'
      }
    }
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')]
}
