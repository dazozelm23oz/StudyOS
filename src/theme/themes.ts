import { Theme } from '../types';

export const BUILT_IN_THEMES: Theme[] = [
  {
    id: 'cyberdeck-hud',
    name: 'Cyberdeck HUD',
    description: 'Flagship futuristic high-contrast cockpit with glowing cyan and neon amber telemetry accents.',
    is_built_in: true,
    is_dark: true,
    colors: {
      canvas: '#07090e',
      surface: '#0d111a',
      surfaceElevated: '#141b29',
      surfaceHover: '#1c2638',
      border: '#1f2d42',
      borderGlow: 'rgba(0, 229, 255, 0.25)',
      primary: '#00e5ff',
      primaryGlow: 'rgba(0, 229, 255, 0.4)',
      secondary: '#0ea5e9',
      accent: '#f59e0b',
      accentGlow: 'rgba(245, 158, 11, 0.4)',
      textMain: '#f1f5f9',
      textMuted: '#94a3b8',
      textFaint: '#475569',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
  },
  {
    id: 'void-black',
    name: 'Void Black',
    description: 'Minimalist OLED deep void with sharp borders and ultraviolet micro-glows.',
    is_built_in: true,
    is_dark: true,
    colors: {
      canvas: '#000000',
      surface: '#080808',
      surfaceElevated: '#121212',
      surfaceHover: '#1c1c1c',
      border: '#262626',
      borderGlow: 'rgba(168, 85, 247, 0.25)',
      primary: '#a855f7',
      primaryGlow: 'rgba(168, 85, 247, 0.45)',
      secondary: '#8b5cf6',
      accent: '#38bdf8',
      accentGlow: 'rgba(56, 189, 248, 0.4)',
      textMain: '#fafafa',
      textMuted: '#a1a1aa',
      textFaint: '#52525b',
      success: '#22c55e',
      warning: '#eab308',
      danger: '#f43f5e',
    },
  },
  {
    id: 'cyber-amber',
    name: 'Cyber Amber',
    description: 'Deus Ex inspired tactical aviation amber on deep obsidian titanium.',
    is_built_in: true,
    is_dark: true,
    colors: {
      canvas: '#090805',
      surface: '#120f09',
      surfaceElevated: '#1a160d',
      surfaceHover: '#272013',
      border: '#3b2f19',
      borderGlow: 'rgba(245, 158, 11, 0.3)',
      primary: '#f59e0b',
      primaryGlow: 'rgba(245, 158, 11, 0.5)',
      secondary: '#d97706',
      accent: '#fbbf24',
      accentGlow: 'rgba(251, 191, 36, 0.4)',
      textMain: '#fef3c7',
      textMuted: '#d97706',
      textFaint: '#78350f',
      success: '#84cc16',
      warning: '#f59e0b',
      danger: '#dc2626',
    },
  },
  {
    id: 'deep-nebula',
    name: 'Deep Nebula',
    description: 'Deep cosmic indigo atmosphere with radiant magenta and starlight highlights.',
    is_built_in: true,
    is_dark: true,
    colors: {
      canvas: '#08071a',
      surface: '#0f0e2b',
      surfaceElevated: '#18163f',
      surfaceHover: '#242157',
      border: '#2e2b6e',
      borderGlow: 'rgba(236, 72, 153, 0.3)',
      primary: '#ec4899',
      primaryGlow: 'rgba(236, 72, 153, 0.45)',
      secondary: '#a855f7',
      accent: '#06b6d4',
      accentGlow: 'rgba(6, 182, 212, 0.4)',
      textMain: '#fdf4ff',
      textMuted: '#c084fc',
      textFaint: '#6b21a8',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#f43f5e',
    },
  },
];

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const colors = theme.colors;

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

  if (theme.is_dark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
