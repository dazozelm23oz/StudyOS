import { Theme, ThemeLayout } from '../types';

export const DEFAULT_LAYOUT: ThemeLayout = {
  density: 'comfortable',
  borderRadius: 'rounded',
  cardOpacity: 0.96,
  cardBlur: 12,
  uiScale: 1.0,
  fontFamily: 'Inter',
  shadowStyle: 'medium',
};

export const BUILT_IN_THEMES: Theme[] = [
  {
    id: 'academic-studio',
    name: 'Academic Studio',
    description: 'Flagship high-contrast academic dashboard with royal indigo, sky blue, and amber details on dark slate.',
    is_built_in: true,
    is_dark: true,
    layout: { ...DEFAULT_LAYOUT },
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
      textMuted: '#e2e8f0',
      textFaint: '#94a3b8',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    description: 'Warm parchment and academic cream with deep navy and cyan contrast, engineered for daylight study.',
    is_built_in: true,
    is_dark: false,
    layout: { ...DEFAULT_LAYOUT, cardOpacity: 0.98 },
    colors: {
      canvas: '#fdf6e3',
      surface: '#f5efdc',
      surfaceElevated: '#eee8d5',
      surfaceHover: '#e0d8c3',
      border: '#d3cbb7',
      borderGlow: 'rgba(38, 139, 210, 0.2)',
      primary: '#268bd2',
      primaryGlow: 'rgba(38, 139, 210, 0.3)',
      secondary: '#2aa198',
      accent: '#b58900',
      accentGlow: 'rgba(181, 137, 0, 0.3)',
      textMain: '#073642',
      textMuted: '#586e75',
      textFaint: '#657b83',
      success: '#859900',
      warning: '#cb4b16',
      danger: '#dc322f',
    },
  },
  {
    id: 'midnight-oled',
    name: 'Midnight OLED',
    description: 'Pure obsidian pitch-black (#000000) for OLED displays with crisp electric cyan and ice-white text.',
    is_built_in: true,
    is_dark: true,
    layout: { ...DEFAULT_LAYOUT, cardOpacity: 1.0, cardBlur: 0 },
    colors: {
      canvas: '#000000',
      surface: '#0d0d0f',
      surfaceElevated: '#17171a',
      surfaceHover: '#242429',
      border: '#2a2a30',
      borderGlow: 'rgba(56, 189, 248, 0.25)',
      primary: '#38bdf8',
      primaryGlow: 'rgba(56, 189, 248, 0.4)',
      secondary: '#818cf8',
      accent: '#34d399',
      accentGlow: 'rgba(52, 211, 153, 0.35)',
      textMain: '#ffffff',
      textMuted: '#e4e4e7',
      textFaint: '#a1a1aa',
      success: '#22c55e',
      warning: '#facc15',
      danger: '#f87171',
    },
  },
  {
    id: 'forest-focus',
    name: 'Forest Focus',
    description: 'Deep pine woods and sage academia with soothing emerald hues and warm sunlight accents.',
    is_built_in: true,
    is_dark: true,
    layout: { ...DEFAULT_LAYOUT },
    colors: {
      canvas: '#05140f',
      surface: '#0d241c',
      surfaceElevated: '#143328',
      surfaceHover: '#1c4537',
      border: '#1f4d3d',
      borderGlow: 'rgba(16, 185, 129, 0.25)',
      primary: '#10b981',
      primaryGlow: 'rgba(16, 185, 129, 0.35)',
      secondary: '#34d399',
      accent: '#f59e0b',
      accentGlow: 'rgba(245, 158, 11, 0.3)',
      textMain: '#f0fdf4',
      textMuted: '#d1fae5',
      textFaint: '#86efac',
      success: '#10b981',
      warning: '#fbbf24',
      danger: '#f87171',
    },
  },
  {
    id: 'warm-academia',
    name: 'Warm Academia',
    description: 'Rich dark espresso, book-leather, and aged parchment with golden bronze highlights.',
    is_built_in: true,
    is_dark: true,
    layout: { ...DEFAULT_LAYOUT },
    colors: {
      canvas: '#120d0a',
      surface: '#1c1510',
      surfaceElevated: '#281f18',
      surfaceHover: '#382c22',
      border: '#3d3024',
      borderGlow: 'rgba(217, 119, 6, 0.25)',
      primary: '#d97706',
      primaryGlow: 'rgba(217, 119, 6, 0.35)',
      secondary: '#f59e0b',
      accent: '#eab308',
      accentGlow: 'rgba(234, 179, 8, 0.3)',
      textMain: '#fffbeb',
      textMuted: '#fef3c7',
      textFaint: '#d97706',
      success: '#84cc16',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
  },
  {
    id: 'cyber-sunset',
    name: 'Cyber Sunset',
    description: 'Deep twilight purple with energetic tangerine, rose-gold, and magenta luminescence.',
    is_built_in: true,
    is_dark: true,
    layout: { ...DEFAULT_LAYOUT, borderRadius: 'pill' },
    colors: {
      canvas: '#0f0817',
      surface: '#1a1026',
      surfaceElevated: '#27183b',
      surfaceHover: '#392254',
      border: '#3c2557',
      borderGlow: 'rgba(249, 115, 22, 0.25)',
      primary: '#f97316',
      primaryGlow: 'rgba(249, 115, 22, 0.35)',
      secondary: '#f43f5e',
      accent: '#a855f7',
      accentGlow: 'rgba(168, 85, 247, 0.3)',
      textMain: '#faf5ff',
      textMuted: '#f3e8ff',
      textFaint: '#c084fc',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#f43f5e',
    },
  },
  {
    id: 'nordic-slate',
    name: 'Nordic Slate',
    description: 'Calm Scandinavian minimalism with deep navy zinc, sky blue highlights, and exceptional readability.',
    is_built_in: true,
    is_dark: true,
    layout: { ...DEFAULT_LAYOUT },
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
    description: 'Dark violet carbon with radiant magenta and starlight details.',
    is_built_in: true,
    is_dark: true,
    layout: { ...DEFAULT_LAYOUT, borderRadius: 'pill' },
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

  // UI Scale
  const scale = layout.uiScale || 1.0;
  root.style.setProperty('--ui-scale', scale.toString());
  root.style.fontSize = `${16 * scale}px`;

  // Density & Scale applied to Padding, Margin, and Gap
  const basePadding = layout.density === 'compact' ? 10 : layout.density === 'spacious' ? 24 : 16;
  const baseGap = layout.density === 'compact' ? 8 : layout.density === 'spacious' ? 20 : 12;
  root.style.setProperty('--ui-padding', `${Math.round(basePadding * scale)}px`);
  root.style.setProperty('--ui-margin', `${Math.round(baseGap * scale)}px`);
  root.style.setProperty('--ui-gap', `${Math.round(baseGap * scale)}px`);

  // Opacity & Blur
  root.style.setProperty('--card-opacity', (layout.cardOpacity || 0.96).toString());
  root.style.setProperty('--card-blur', `${layout.cardBlur || 12}px`);

  // Font Family
  const fontMap = {
    Inter: '"Inter", system-ui, sans-serif',
    'JetBrains Mono': '"JetBrains Mono", monospace',
    'Space Grotesk': '"Space Grotesk", system-ui, sans-serif',
    'System Sans': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };
  root.style.fontFamily = fontMap[layout.fontFamily] || fontMap.Inter;

  // Dark/Light Class Toggle
  if (theme.is_dark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
