import React, { useState } from 'react';
import { Palette, Check, Download, Upload, Sliders, Plus, Sparkles, X, Type, Layers } from 'lucide-react';
import { Theme, ThemeLayout, ThemeColors } from '../types';
import { BUILT_IN_THEMES, applyTheme, DEFAULT_LAYOUT } from '../theme/themes';
import { dbService } from '../services/db';

interface ThemeStudioViewProps {
  currentTheme: Theme;
  onThemeSelect: (theme: Theme) => void;
}

export const ThemeStudioView: React.FC<ThemeStudioViewProps> = ({ currentTheme, onThemeSelect }) => {
  const [layout, setLayout] = useState<ThemeLayout>(currentTheme.layout || DEFAULT_LAYOUT);
  const [showCreator, setShowCreator] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeDesc, setNewThemeDesc] = useState('');
  const [newColors, setNewColors] = useState<ThemeColors>({ ...currentTheme.colors });

  const updateLayout = (partial: Partial<ThemeLayout>) => {
    const updated = { ...layout, ...partial };
    setLayout(updated);
    const updatedTheme = { ...currentTheme, layout: updated };
    onThemeSelect(updatedTheme);
    applyTheme(updatedTheme);
  };

  const handleCreateTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThemeName.trim()) return;

    const created: Theme = {
      id: 'custom-' + Date.now(),
      name: newThemeName.trim(),
      description: newThemeDesc.trim() || 'Custom user created study theme.',
      is_built_in: false,
      is_dark: currentTheme.is_dark,
      colors: { ...newColors },
      layout: { ...layout },
    };

    await dbService.saveTheme(created);
    onThemeSelect(created);
    applyTheme(created);
    setShowCreator(false);
    setNewThemeName('');
    setNewThemeDesc('');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.colors) {
          const themeToSave = {
            ...parsed,
            id: parsed.id || 'imported-' + Date.now(),
            is_built_in: false,
          };
          await dbService.saveTheme(themeToSave);
          onThemeSelect(themeToSave);
          applyTheme(themeToSave);
          if (themeToSave.layout) setLayout(themeToSave.layout);
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
      <div className="hud-panel p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-primary font-mono text-xs uppercase mb-1 font-bold">
            <Palette className="w-4 h-4" />
            <span>DESIGN SYSTEM STUDIO</span>
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-text-main">
            Theme Engine & Customization
          </h1>
          <p className="text-xs text-text-muted mt-1 font-mono">
            Full control over color tokens, layout geometry, UI scaling, and custom presets.
          </p>
        </div>

        <button
          onClick={() => setShowCreator(true)}
          className="px-4 py-2.5 rounded-xl bg-primary text-canvas font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-sm flex items-center space-x-2 self-start sm:self-auto transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>CREATE NEW THEME</span>
        </button>
      </div>

      {/* Preset Cards Catalog (including 5+ new presets) */}
      <div className="space-y-3">
        <div className="font-mono text-xs font-bold text-text-faint uppercase tracking-wider">
          CURATED ACADEMIC PRESET CATALOG
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-surface shadow-md'
                    : 'border-border bg-surface hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-sm font-bold text-text-main flex items-center space-x-2">
                    <span>{theme.name}</span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-canvas shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-text-muted font-sans mb-3 leading-relaxed line-clamp-2">
                  {theme.description}
                </p>

                {/* Color Swatch Preview Palette */}
                <div className="flex items-center space-x-1.5 p-2 rounded-lg bg-canvas border border-border">
                  <div
                    className="w-5 h-5 rounded-md border border-white/10"
                    style={{ backgroundColor: theme.colors.canvas }}
                    title="Canvas"
                  />
                  <div
                    className="w-5 h-5 rounded-md border border-white/10"
                    style={{ backgroundColor: theme.colors.surface }}
                    title="Surface"
                  />
                  <div
                    className="w-5 h-5 rounded-md border border-white/10"
                    style={{ backgroundColor: theme.colors.border }}
                    title="Border"
                  />
                  <div
                    className="w-5 h-5 rounded-md shadow-sm"
                    style={{ backgroundColor: theme.colors.primary }}
                    title="Primary"
                  />
                  <div
                    className="w-5 h-5 rounded-md shadow-sm"
                    style={{ backgroundColor: theme.colors.accent }}
                    title="Accent"
                  />
                  <div
                    className="w-5 h-5 rounded-md shadow-sm"
                    style={{ backgroundColor: theme.colors.success }}
                    title="Success"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deep Layout & Typography Customization Settings */}
      <div className="hud-panel p-6 space-y-5">
        <div className="font-mono text-sm font-bold text-text-main flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-primary" />
          <span>Geometry, UI Scale & Typography Controls</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-mono text-xs">
          {/* UI Scale Slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-text-muted font-semibold">UI Scale</label>
              <span className="text-primary font-bold">{Math.round((layout.uiScale || 1.0) * 100)}%</span>
            </div>
            <input
              type="range"
              min="85"
              max="130"
              step="5"
              value={Math.round((layout.uiScale || 1.0) * 100)}
              onChange={(e) => updateLayout({ uiScale: Number(e.target.value) / 100 })}
              className="w-full accent-primary bg-canvas cursor-pointer"
            />
            <div className="text-[11px] text-text-faint">Scales base typography & window elements</div>
          </div>

          {/* Typography Selector */}
          <div className="space-y-2">
            <label className="text-text-muted font-semibold block">Typography Font</label>
            <select
              value={layout.fontFamily || 'Inter'}
              onChange={(e) => updateLayout({ fontFamily: e.target.value as any })}
              className="w-full bg-canvas border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-text-main focus:outline-none focus:border-primary"
            >
              <option value="Inter">Inter (Academic Modern)</option>
              <option value="JetBrains Mono">JetBrains Mono (Technical)</option>
              <option value="Space Grotesk">Space Grotesk (Futuristic)</option>
              <option value="System Sans">System Sans (Native OS)</option>
            </select>
            <div className="text-[11px] text-text-faint">Applied globally to all interfaces</div>
          </div>

          {/* UI Density */}
          <div className="space-y-2">
            <label className="text-text-muted font-semibold block">UI Density</label>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-canvas border border-border">
              {(['compact', 'comfortable', 'spacious'] as const).map((density) => (
                <button
                  key={density}
                  onClick={() => updateLayout({ density })}
                  className={`py-1.5 rounded text-[11px] capitalize transition ${
                    layout.density === density
                      ? 'bg-primary text-canvas font-bold shadow-sm'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {density}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-text-faint">Paddings and gap spacing</div>
          </div>

          {/* Corner Radius */}
          <div className="space-y-2">
            <label className="text-text-muted font-semibold block">Corner Radius</label>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-canvas border border-border">
              {(['sharp', 'rounded', 'pill'] as const).map((rad) => (
                <button
                  key={rad}
                  onClick={() => updateLayout({ borderRadius: rad })}
                  className={`py-1.5 rounded text-[11px] capitalize transition ${
                    layout.borderRadius === rad
                      ? 'bg-primary text-canvas font-bold shadow-sm'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {rad}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-text-faint">Border curvature of panels</div>
          </div>
        </div>
      </div>

      {/* JSON Import/Export Actions */}
      <div className="hud-panel p-5 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
        <div>
          <div className="text-text-main font-bold">Theme Matrix Portability</div>
          <div className="text-text-muted text-xs mt-0.5">
            Export full theme JSON (colors + typography + layout + scale) or import custom themes
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

      {/* Custom Theme Creation Modal */}
      {showCreator && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTheme}
            className="max-w-2xl w-full bg-surface border border-border rounded-2xl p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="font-mono text-base font-bold text-text-main flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>Custom Theme Creator</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCreator(false)}
                className="text-text-muted hover:text-text-main"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-text-muted mb-1 font-semibold">Theme Name</label>
                <input
                  type="text"
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                  placeholder="e.g. Kyoto Night"
                  required
                  className="w-full bg-canvas border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-text-muted mb-1 font-semibold">Description</label>
                <input
                  type="text"
                  value={newThemeDesc}
                  onChange={(e) => setNewThemeDesc(e.target.value)}
                  placeholder="Brief aesthetic description..."
                  className="w-full bg-canvas border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-primary"
                />
              </div>

              {/* Color Matrix Pickers */}
              <div className="space-y-2 pt-2">
                <div className="font-bold text-text-main">Color Tokens (Click to adjust)</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Canvas (BG)', key: 'canvas' },
                    { label: 'Surface (Cards)', key: 'surface' },
                    { label: 'Border', key: 'border' },
                    { label: 'Primary Accent', key: 'primary' },
                    { label: 'Secondary Accent', key: 'secondary' },
                    { label: 'Warm Accent', key: 'accent' },
                    { label: 'Main Text', key: 'textMain' },
                    { label: 'Muted Text', key: 'textMuted' },
                    { label: 'Faint Text', key: 'textFaint' },
                    { label: 'Success', key: 'success' },
                    { label: 'Warning', key: 'warning' },
                    { label: 'Danger', key: 'danger' },
                  ].map((item) => (
                    <div key={item.key} className="p-2.5 rounded-lg bg-canvas border border-border flex items-center justify-between">
                      <span className="text-[11px] text-text-muted">{item.label}</span>
                      <input
                        type="color"
                        value={(newColors as any)[item.key]}
                        onChange={(e) =>
                          setNewColors({
                            ...newColors,
                            [item.key]: e.target.value,
                            ...(item.key === 'primary' ? { primaryGlow: e.target.value + '55' } : {}),
                            ...(item.key === 'accent' ? { accentGlow: e.target.value + '55' } : {}),
                          })
                        }
                        className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-border font-mono text-xs">
              <button
                type="button"
                onClick={() => setShowCreator(false)}
                className="px-4 py-2 rounded-lg bg-canvas border border-border text-text-muted hover:text-text-main"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-primary text-canvas font-bold hover:brightness-110 shadow-sm"
              >
                Save & Apply Theme
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
