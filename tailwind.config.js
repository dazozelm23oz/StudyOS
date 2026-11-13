/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        'surface-hover': 'var(--color-surface-hover)',
        border: 'var(--color-border)',
        'border-glow': 'var(--color-border-glow)',
        primary: 'var(--color-primary)',
        'primary-glow': 'var(--color-primary-glow)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        'accent-glow': 'var(--color-accent-glow)',
        'text-main': 'var(--color-text-main)',
        'text-muted': 'var(--color-text-muted)',
        'text-faint': 'var(--color-text-faint)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
      },
      boxShadow: {
        'hud-glow': '0 0 20px var(--color-primary-glow)',
        'accent-glow': '0 0 20px var(--color-accent-glow)',
        'neon-panel': '0 0 15px rgba(0, 0, 0, 0.5), inset 0 0 1px var(--color-border-glow)',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Space Mono"', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
