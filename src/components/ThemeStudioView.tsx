import React, { useState } from 'react';
import { Palette, Check, Sparkles, Download, Upload, Sliders, Maximize2, Layers } from 'lucide-react';
import { Theme, ThemeLayout } from '../types';
import { BUILT_IN_THEMES, applyTheme, DEFAULT_LAYOUT } from '../theme/themes';

interface ThemeStudioViewProps {
  currentTheme: Theme;
  onThemeSelect: (theme: Theme) => void;
}

export const ThemeStudioView: React.FC<ThemeStudioViewProps> = ({ currentTheme, onThemeSelect }) => {
  const [layout, setLayout] = useState<ThemeLayout>(currentTheme.layout || DEFAULT_LAYOUT);

  const updateLayout = (partial: Partial<ThemeLayout>) => {
    const updated = { ...layout, ...partial };
    setLayout(updated);
    const updatedTheme = { ...currentTheme, layout: updated };
    onThemeSelect(updatedTheme);
    applyTheme(updatedTheme);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.colors) {
          onThemeSelect(parsed);
          applyTheme(parsed);
          if (parsed.layout) setLayout(parsed.layout);
        }
      } catch (err) {
        alert('Invalid theme JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="hud-panel p-6">
        <div className="flex items-center space-x-2 text-primary font-mono text-xs uppercase mb-1 font-bold">
          <Palette className="w-4 h-4" />
          <span>DESIGN SYSTEM ENGINE</span>
        </div>
        <h1 className="text-2xl font-bold font-mono tracking-tight text-text-main">
          Theme Studio & Aesthetic Customization
        </h1>
        <p className="text-xs text-text-muted mt-1 font-mono">
          Deep customization beyond hex codes: UI Density, Corner Radius, and Surface Opacity.
        </p>
      </div>

      {/* Preset Cards */}
      <div className="space-y-3">
        <div className="font-mono text-xs font-bold text-text-faint uppercase tracking-wider">
          CURATED ACADEMIC PRESETS
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BUILT_IN_THEMES.map((theme) => {
            const isSelected = currentTheme.id === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => {
                  onThemeSelect(theme);
                  applyTheme(theme);
                  if (theme.layout) setLayout(theme.layout);
                }}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-surface shadow-md'
                    : 'border-border bg-surface hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-sm font-bold text-text-main flex items-center space-x-2">
                    <span>{theme.name}</span>
                    {theme.is_built_in && (
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary font-semibold">
                        Preset
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-canvas shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-text-muted font-sans mb-4 leading-relaxed">
                  {theme.description}
                </p>

                {/* Color Swatch Preview Palette */}
                <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-canvas border border-border">
                  <div
                    className="w-6 h-6 rounded-lg border border-white/10"
                    style={{ backgroundColor: theme.colors.canvas }}
                    title="Canvas"
                  />
                  <div
                    className="w-6 h-6 rounded-lg border border-white/10"
                    style={{ backgroundColor: theme.colors.surface }}
                    title="Surface"
                  />
                  <div
                    className="w-6 h-6 rounded-lg border border-white/10"
                    style={{ backgroundColor: theme.colors.border }}
                    title="Border"
                  />
                  <div
                    className="w-6 h-6 rounded-lg shadow-sm"
                    style={{ backgroundColor: theme.colors.primary }}
                    title="Primary"
                  />
                  <div
                    className="w-6 h-6 rounded-lg shadow-sm"
                    style={{ backgroundColor: theme.colors.accent }}
                    title="Accent"
                  />
                  <div
                    className="w-6 h-6 rounded-lg shadow-sm"
                    style={{ backgroundColor: theme.colors.success }}
                    title="Success"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deep Layout & Geometry Customization Settings */}
      <div className="hud-panel p-6 space-y-5">
        <div className="font-mono text-sm font-bold text-text-main flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-primary" />
          <span>Layout Geometry & Density Controls</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          {/* UI Density */}
          <div className="space-y-2">
            <label className="text-text-muted font-semibold block">UI Density</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-canvas border border-border">
              {(['compact', 'comfortable', 'spacious'] as const).map((density) => (
                <button
                  key={density}
                  onClick={() => updateLayout({ density })}
                  className={`py-2 rounded-lg text-xs capitalize transition ${
                    layout.density === density
                      ? 'bg-primary text-canvas font-bold shadow-sm'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {density}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-text-faint">Paddings, list spacing, and content flow</div>
          </div>

          {/* Corner Radius */}
          <div className="space-y-2">
            <label className="text-text-muted font-semibold block">Corner Radius</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-canvas border border-border">
              {(['sharp', 'rounded', 'pill'] as const).map((rad) => (
                <button
                  key={rad}
                  onClick={() => updateLayout({ borderRadius: rad })}
                  className={`py-2 rounded-lg text-xs capitalize transition ${
                    layout.borderRadius === rad
                      ? 'bg-primary text-canvas font-bold shadow-sm'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {rad}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-text-faint">Panel and button border curvature</div>
          </div>

          {/* Card Opacity */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-text-muted font-semibold">Card Opacity</label>
              <span className="text-primary font-bold">{Math.round(layout.cardOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="85"
              max="100"
              step="1"
              value={Math.round(layout.cardOpacity * 100)}
              onChange={(e) => updateLayout({ cardOpacity: Number(e.target.value) / 100 })}
              className="w-full accent-primary bg-canvas cursor-pointer"
            />
            <div className="text-[11px] text-text-faint">Solid cards ensure high contrast text</div>
          </div>
        </div>
      </div>

      {/* JSON Import/Export Actions */}
      <div className="hud-panel p-5 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
        <div>
          <div className="text-text-main font-bold">Theme & Layout Portability</div>
          <div className="text-text-muted text-xs mt-0.5">
            Export complete theme JSON (colors + density + radius + opacity) or import shared presets
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <label className="px-4 py-2 rounded-xl bg-canvas border border-border hover:border-primary text-text-main flex items-center space-x-1.5 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-accent" />
            <span>IMPORT JSON</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            onClick={() => {
              const fullTheme = { ...currentTheme, layout };
              const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullTheme, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute('href', dataStr);
              downloadAnchor.setAttribute('download', `${currentTheme.id}-full-theme.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="px-4 py-2 rounded-xl bg-primary text-canvas font-bold flex items-center space-x-1.5 transition shadow-sm hover:brightness-110"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT FULL THEME</span>
          </button>
        </div>
      </div>
    </div>
  );
};
