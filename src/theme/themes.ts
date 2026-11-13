import { Theme, ThemeLayout } from '../types';

export const DEFAULT_LAYOUT: ThemeLayout = {
  density: 'comfortable',
  borderRadius: 'rounded',
  cardOpacity: 0.94,
  cardBlur: 12,
};

export const BUILT_IN_THEMES: Theme[] = [
  {
    id: 'academic-studio',
    name: 'Academic Studio (Default)',
    description: 'Modern, high-contrast academic dashboard with rich indigo accents, solid opaque cards, and crystal-clear typography.',
    is_built_in: true,
    is_dark: true,
    layout: {
      density: 'comfortable',
      borderRadius: 'rounded',
      cardOpacity: 0.96,
      cardBlur: 12,
    },
    colors: {
      canvas: '#0b0f19',
      surface: '#131b2e',
      surfaceElevated: '#1a243d',
      surfaceHover: '#233050',
      border: '#23314f',
      borderGlow: 'rgba(99, 102, 241, 0.25)',
      primary: '#6366f1',
      primaryGlow: 'rgba(99, 102, 241, 0.35)',
      secondary: '#38bdf8',
      accent: '#f59e0b',
      accentGlow: 'rgba(245, 158, 11, 0.3)',
      textMain: '#ffffff',
      textMuted: '#e2e8f0', // Crisp high-contrast light slate
      textFaint: '#94a3b8', // Legible secondary label text (WCAG AA compliant)
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
  },
  {
    id: 'nordic-slate',
    name: 'Nordic Slate',
    description: 'Calm Scandinavian minimalism with deep navy zinc, sky blue highlights, and exceptional readability.',
    is_built_in: true,
    is_dark: true,
    layout: {
      density: 'comfortable',
      borderRadius: 'rounded',
      cardOpacity: 0.95,
      cardBlur: 8,
    },
    colors: {
      canvas: '#080c14',
      surface: '#101726',
      surfaceElevated: '#172238',
      surfaceHover: '#202e4a',
      border: '#1f2d47',
      borderGlow: 'rgba(56, 189, 248, 0.2)',
      primary: '#38bdf8',
      primaryGlow: 'rgba(56, 189, 248, 0.3)',
      secondary: '#0ea5e9',
      accent: '#10b981',
      accentGlow: 'rgba(16, 185, 129, 0.3)',
      textMain: '#f8fafc',
      textMuted: '#e2e8f0',
      textFaint: '#94a3b8',
      success: '#34d399',
      warning: '#fbbf24',
      danger: '#f87171',
    },
  },
  {
    id: 'obsidian-violet',
    name: 'Obsidian Violet',
    description: 'Sleek dark violet glass on deep obsidian carbon with radiant magenta and starlight details.',
    is_built_in: true,
    is_dark: true,
    layout: {
      density: 'comfortable',
      borderRadius: 'pill',
      cardOpacity: 0.92,
      cardBlur: 16,
    },
    colors: {
      canvas: '#0d0c15',
      surface: '#161426',
      surfaceElevated: '#1f1c36',
      surfaceHover: '#2b274a',
      border: '#2f2a52',
      borderGlow: 'rgba(139, 92, 246, 0.25)',
      primary: '#8b5cf6',
      primaryGlow: 'rgba(139, 92, 246, 0.35)',
      secondary: '#ec4899',
      accent: '#06b6d4',
      accentGlow: 'rgba(6, 182, 212, 0.3)',
      textMain: '#faf5ff',
      textMuted: '#e9d5ff',
      textFaint: '#a855f7',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#f43f5e',
    },
  },
  {
    id: 'cyberdeck-hud',
    name: 'Cyberdeck HUD (High Contrast)',
    description: 'Futuristic telemetry aesthetic overhauled with solid surfaces, bright labels, and elegant borders.',
    is_built_in: true,
    is_dark: true,
    layout: {
      density: 'compact',
      borderRadius: 'sharp',
      cardOpacity: 0.96,
      cardBlur: 4,
    },
    colors: {
      canvas: '#06090e',
      surface: '#0f1624',
      surfaceElevated: '#172238',
      surfaceHover: '#21304d',
      border: '#243450',
      borderGlow: 'rgba(0, 229, 255, 0.25)',
      primary: '#00e5ff',
      primaryGlow: 'rgba(0, 229, 255, 0.35)',
      secondary: '#0ea5e9',
      accent: '#f59e0b',
      accentGlow: 'rgba(245, 158, 11, 0.3)',
      textMain: '#ffffff',
      textMuted: '#e2e8f0',
      textFaint: '#94a3b8',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
  },
];

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const colors = theme.colors;
  const layout = theme.layout || DEFAULT_LAYOUT;

  // Colors
  root.style.setProperty('--color-canvas', colors.canvas);
  root.style.setProperty('--color-surface', colors.surface);
  root.style.setProperty('--color-surface-elevated', colors.surfaceElevated);
  root.style.setProperty('--color-surface-hover', colors.surfaceHover);
  root.style.setProperty('--color-border', colors.border);
  root.style.setProperty('--color-border-glow', colors.borderGlow);
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-primary-glow', colors.primaryGlow);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-accent-glow', colors.accentGlow);
  root.style.setProperty('--color-text-main', colors.textMain);
  root.style.setProperty('--color-text-muted', colors.textMuted);
  root.style.setProperty('--color-text-faint', colors.textFaint);
  root.style.setProperty('--color-success', colors.success);
  root.style.setProperty('--color-warning', colors.warning);
  root.style.setProperty('--color-danger', colors.danger);

  // Border Radius
  const radiusMap = {
    sharp: '2px',
    rounded: '10px',
    pill: '20px',
  };
  root.style.setProperty('--ui-radius', radiusMap[layout.borderRadius] || '10px');

  // Density Scaling
  const paddingMap = {
    compact: '0.625rem',
    comfortable: '1rem',
    spacious: '1.5rem',
  };
  const gapMap = {
    compact: '0.5rem',
    comfortable: '1rem',
    spacious: '1.5rem',
  };
  root.style.setProperty('--ui-padding', paddingMap[layout.density] || '1rem');
  root.style.setProperty('--ui-gap', gapMap[layout.density] || '1rem');

  // Opacity & Blur
  root.style.setProperty('--card-opacity', layout.cardOpacity.toString());
  root.style.setProperty('--card-blur', `${layout.cardBlur}px`);

  if (theme.is_dark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
