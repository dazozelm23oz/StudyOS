import React from 'react';
import { Palette, Check, Sparkles, Download, Upload } from 'lucide-react';
import { Theme } from '../types';
import { BUILT_IN_THEMES, applyTheme } from '../theme/themes';

interface ThemeStudioViewProps {
  currentTheme: Theme;
  onThemeSelect: (theme: Theme) => void;
}

export const ThemeStudioView: React.FC<ThemeStudioViewProps> = ({ currentTheme, onThemeSelect }) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="hud-panel p-6">
        <div className="flex items-center space-x-2 text-primary font-mono text-xs uppercase mb-1">
          <Palette className="w-4 h-4" />
          <span>VISUAL INTERFACE ENGINE</span>
        </div>
        <h1 className="text-2xl font-bold font-mono tracking-tight text-text-main">
          Theme Studio & Appearance
        </h1>
        <p className="text-xs text-text-muted mt-1 font-mono">
          Customizable CSS-variable design system. Zero default framework styles. Fully exportable JSON themes.
        </p>
      </div>

      {/* Preset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BUILT_IN_THEMES.map((theme) => {
          const isSelected = currentTheme.id === theme.id;
          return (
            <div
              key={theme.id}
              onClick={() => {
                onThemeSelect(theme);
                applyTheme(theme);
              }}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary bg-surface shadow-hud-glow'
                  : 'border-border bg-surface/60 hover:bg-surface hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-sm font-bold text-text-main flex items-center space-x-2">
                  <span>{theme.name}</span>
                  {theme.is_built_in && (
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary">
                      Preset
                    </span>
                  )}
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-canvas">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </div>

              <p className="text-xs text-text-muted font-mono mb-4 leading-relaxed">
                {theme.description}
              </p>

              {/* Color Swatch Preview Palette */}
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-canvas border border-border">
                <div
                  className="w-6 h-6 rounded border border-white/10"
                  style={{ backgroundColor: theme.colors.canvas }}
                  title="Canvas"
                />
                <div
                  className="w-6 h-6 rounded border border-white/10"
                  style={{ backgroundColor: theme.colors.surface }}
                  title="Surface"
                />
                <div
                  className="w-6 h-6 rounded border border-white/10"
                  style={{ backgroundColor: theme.colors.border }}
                  title="Border"
                />
                <div
                  className="w-6 h-6 rounded shadow-sm"
                  style={{ backgroundColor: theme.colors.primary }}
                  title="Primary"
                />
                <div
                  className="w-6 h-6 rounded shadow-sm"
                  style={{ backgroundColor: theme.colors.accent }}
                  title="Accent"
                />
                <div
                  className="w-6 h-6 rounded shadow-sm"
                  style={{ backgroundColor: theme.colors.success }}
                  title="Success"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* JSON Import/Export Actions */}
      <div className="hud-panel p-5 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
        <div>
          <div className="text-text-main font-bold">Theme Portability</div>
          <div className="text-text-faint text-[11px] mt-0.5">
            Export current color matrix as JSON or import user themes
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentTheme, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute('href', dataStr);
              downloadAnchor.setAttribute('download', `${currentTheme.id}-theme.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="px-3.5 py-2 rounded-lg bg-canvas border border-border hover:border-primary text-text-main flex items-center space-x-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>EXPORT JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
