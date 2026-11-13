import React, { useState, useEffect } from 'react';
import { Settings, User, HardDrive, ShieldAlert, Check, RefreshCw, Folder } from 'lucide-react';
import { Profile } from '../types';
import { dbService } from '../services/db';

export const SettingsView: React.FC = () => {
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

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="hud-panel p-6">
        <div className="flex items-center space-x-2 text-primary font-mono text-xs uppercase mb-1">
          <Settings className="w-4 h-4" />
          <span>SYSTEM VAULT & SETTINGS</span>
        </div>
        <h1 className="text-2xl font-bold font-mono tracking-tight text-text-main">
          Academic Profile & Storage Configuration
        </h1>
        <p className="text-xs text-text-muted mt-1 font-mono">
          Zero hardcoded profile data. Everything is persisted locally in SQLite.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Form */}
        <form onSubmit={handleSave} className="hud-panel p-6 space-y-4">
          <div className="font-mono text-sm font-bold text-text-main flex items-center space-x-2 mb-2">
            <User className="w-4 h-4 text-primary" />
            <span>Student Identity</span>
          </div>

          <div>
            <label className="block text-xs font-mono text-text-muted mb-1">Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="e.g. Alex Mercer"
              className="w-full bg-canvas border border-border focus:border-primary rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1">Major / Degree</label>
              <input
                type="text"
                value={profile.major}
                onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                placeholder="e.g. Computer Science"
                className="w-full bg-canvas border border-border focus:border-primary rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1">University</label>
              <input
                type="text"
                value={profile.university}
                onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                placeholder="e.g. MIT / Oxford"
                className="w-full bg-canvas border border-border focus:border-primary rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1">Current Academic Year</label>
              <input
                type="text"
                value={profile.current_year}
                onChange={(e) => setProfile({ ...profile, current_year: e.target.value })}
                placeholder="e.g. 2025/2026"
                className="w-full bg-canvas border border-border focus:border-primary rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1">Current Semester</label>
              <input
                type="text"
                value={profile.current_semester}
                onChange={(e) => setProfile({ ...profile, current_semester: e.target.value })}
                placeholder="e.g. Semester 1"
                className="w-full bg-canvas border border-border focus:border-primary rounded-lg px-3 py-2 text-xs font-mono text-text-main focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-canvas font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-hud-glow flex items-center space-x-1.5 transition"
            >
              {saved ? <Check className="w-4 h-4 stroke-[3]" /> : null}
              <span>{saved ? 'SAVED TO DB' : 'SAVE PROFILE'}</span>
            </button>
          </div>
        </form>

        {/* Storage & Hardlink Backup Config */}
        <div className="hud-panel p-6 space-y-4">
          <div className="font-mono text-sm font-bold text-text-main flex items-center space-x-2 mb-2">
            <HardDrive className="w-4 h-4 text-accent" />
            <span>ext4 Snapshot Storage (§9b)</span>
          </div>

          <div className="p-3 rounded-lg bg-canvas border border-border space-y-2 text-xs font-mono">
            <div className="text-text-muted">Target Destination:</div>
            <div className="text-primary font-bold">{backupDest}</div>
            <div className="text-[11px] text-text-faint">
              Uses rsync --link-dest for near-zero-byte hardlink snapshots. Excludes node_modules/ and target/ build caches.
            </div>
          </div>

          <div className="p-3 rounded-lg bg-canvas border border-border space-y-2 text-xs font-mono">
            <div className="text-text-muted">Local Data Portability Folder:</div>
            <div className="text-text-main font-bold">./data/</div>
            <div className="text-[11px] text-text-faint">
              Entire database, imported textbooks, notes, and local audio live in this portable folder.
            </div>
          </div>

          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs font-mono space-y-1">
            <div className="text-primary font-bold">Sync Policy Active</div>
            <div className="text-text-muted text-[11px]">
              Every phase and task boundary automatically triggers an ext4 snapshot and Git commit+push.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
