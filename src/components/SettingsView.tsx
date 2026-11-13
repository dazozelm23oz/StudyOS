import React, { useState, useEffect } from 'react';
import { Settings, User, HardDrive, Check, Layout, CheckSquare, Square, Sliders } from 'lucide-react';
import { Profile, DockPosition } from '../types';
import { dbService } from '../services/db';
import { ALL_NAV_ITEMS, NavTab } from './Sidebar';

interface SettingsViewProps {
  dockPosition: DockPosition;
  onDockPositionChange: (pos: DockPosition) => void;
  visibleTabs: string[];
  onVisibleTabsChange: (tabs: string[]) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  dockPosition,
  onDockPositionChange,
  visibleTabs,
  onVisibleTabsChange,
}) => {
  const [profile, setProfile] = useState<Profile>({
    id: 'user-profile',
    name: '',
    major: '',
    university: '',
    current_year: '',
    current_semester: '',
    semester_start: '',
    semester_end: '',
    custom_fields: {},
  });
  const [saved, setSaved] = useState(false);
  const [backupDest, setBackupDest] = useState('/mnt/StudyBackups');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const p = await dbService.getProfile();
    if (p) setProfile(p);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await dbService.saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleTab = (tabId: string) => {
    // Settings is mandatory and cannot be hidden
    if (tabId === 'settings') return;

    if (visibleTabs.includes(tabId)) {
      if (visibleTabs.length <= 2) return;
      onVisibleTabsChange(visibleTabs.filter((t) => t !== tabId));
    } else {
      onVisibleTabsChange([...visibleTabs, tabId]);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="hud-panel p-6">
        <div className="flex items-center space-x-2 text-primary font-mono text-xs uppercase mb-1 font-bold">
          <Settings className="w-4 h-4" />
          <span>SYSTEM VAULT & WORKSPACE CUSTOMIZATION</span>
        </div>
        <h1 className="text-2xl font-bold font-mono tracking-tight text-text-main">
          Settings, Layout Engine & Profile Vault
        </h1>
        <p className="text-xs text-text-muted mt-1 font-mono">
          Configure navigation dock position, toggle sidebar tabs, and customize academic profile.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Navigation Dock & Layout Positioning */}
        <div className="hud-panel p-6 space-y-5">
          <div className="font-mono text-sm font-bold text-text-main flex items-center space-x-2">
            <Layout className="w-4 h-4 text-primary" />
            <span>Navigation Dock Position</span>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono text-xs">
            {(['left', 'bottom', 'right'] as const).map((pos) => {
              const isSelected = dockPosition === pos;
              return (
                <button
                  key={pos}
                  onClick={() => onDockPositionChange(pos)}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 transition ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                      : 'border-border bg-canvas text-text-muted hover:text-text-main hover:border-primary/40'
                  }`}
                >
                  <div className="capitalize text-xs font-bold">{pos} Dock</div>
                  <div className="text-[11px] text-text-faint">
                    {pos === 'left' && 'Vertical left sidebar'}
                    {pos === 'right' && 'Vertical right sidebar'}
                    {pos === 'bottom' && 'Horizontal bottom dock'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tab Visibility Checklist */}
          <div className="space-y-3 pt-3 border-t border-border/80">
            <div className="font-mono text-xs font-bold text-text-main flex items-center justify-between">
              <span>VISIBLE NAVIGATION TABS</span>
              <span className="text-text-faint text-[11px]">
                {visibleTabs.length} of {ALL_NAV_ITEMS.length} visible
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_NAV_ITEMS.map((item) => {
                const isMandatory = item.id === 'settings';
                const isChecked = isMandatory || visibleTabs.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleTab(item.id)}
                    disabled={isMandatory}
                    className={`p-2.5 rounded-lg border text-left font-mono text-xs flex items-center justify-between transition ${
                      isChecked
                        ? 'border-border bg-canvas text-text-main font-semibold'
                        : 'border-border/50 bg-canvas/40 text-text-faint'
                    } ${isMandatory ? 'opacity-80 cursor-default' : ''}`}
                  >
                    <div className="flex items-center space-x-2.5">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-text-faint" />
                      )}
                      <span>{item.label}</span>
                    </div>
                    {isMandatory && (
                      <span className="text-[10px] text-primary uppercase font-bold">Mandatory</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Student Profile Identity */}
        <form onSubmit={handleSave} className="hud-panel p-6 space-y-4">
          <div className="font-mono text-sm font-bold text-text-main flex items-center space-x-2 mb-2">
            <User className="w-4 h-4 text-primary" />
            <span>Student Academic Identity</span>
          </div>

          <div>
            <label className="block text-xs font-mono text-text-muted mb-1 font-semibold">Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="e.g. Ziad Abdalla"
              className="w-full bg-canvas border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs font-mono text-text-main focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1 font-semibold">Major / Degree</label>
              <input
                type="text"
                value={profile.major}
                onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                placeholder="e.g. Computer Science"
                className="w-full bg-canvas border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs font-mono text-text-main focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1 font-semibold">University</label>
              <input
                type="text"
                value={profile.university}
                onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                placeholder="e.g. Faculty of Engineering"
                className="w-full bg-canvas border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs font-mono text-text-main focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1 font-semibold">Academic Year</label>
              <input
                type="text"
                value={profile.current_year}
                onChange={(e) => setProfile({ ...profile, current_year: e.target.value })}
                placeholder="e.g. 2025/2026"
                className="w-full bg-canvas border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs font-mono text-text-main focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1 font-semibold">Current Semester</label>
              <input
                type="text"
                value={profile.current_semester}
                onChange={(e) => setProfile({ ...profile, current_semester: e.target.value })}
                placeholder="e.g. Semester 1"
                className="w-full bg-canvas border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs font-mono text-text-main focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-primary text-canvas font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-sm flex items-center space-x-2 transition"
            >
              {saved ? <Check className="w-4 h-4 stroke-[3]" /> : null}
              <span>{saved ? 'SAVED TO DB' : 'SAVE PROFILE'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Storage & Auto-Backup Specs */}
      <div className="hud-panel p-6 space-y-4">
        <div className="font-mono text-sm font-bold text-text-main flex items-center space-x-2">
          <HardDrive className="w-4 h-4 text-accent" />
          <span>ext4 Hardlink Backup Storage (§9b)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-canvas border border-border space-y-1.5">
            <div className="text-text-muted font-semibold">Hardlink Target:</div>
            <div className="text-primary font-bold">{backupDest}</div>
            <div className="text-[11px] text-text-faint">
              rsync --link-dest generates deduplicated instant snapshots.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-canvas border border-border space-y-1.5">
            <div className="text-text-muted font-semibold">Data Portability Folder:</div>
            <div className="text-text-main font-bold">./data/</div>
            <div className="text-[11px] text-text-faint">
              Contains SQLite DB, local PDFs, and audio presets.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 space-y-1.5">
            <div className="text-primary font-bold">Sync Policy Active</div>
            <div className="text-text-muted text-[11px]">
              Automated ext4 snapshots and Git commits run at every development milestone.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
