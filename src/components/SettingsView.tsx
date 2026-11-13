import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  HardDrive,
  Check,
  Layout,
  Sliders,
  Archive,
  Download,
  Upload,
  RotateCcw,
  RefreshCw,
  FolderOpen,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { Profile, DockPosition, BackupSnapshotInfo } from '../types';
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

  // Backup Snapshots & Zip State
  const [snapshots, setSnapshots] = useState<BackupSnapshotInfo[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState<boolean>(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
    loadSnapshots();
  }, []);

  const loadProfile = async () => {
    const p = await dbService.getProfile();
    if (p) setProfile(p);
  };

  const loadSnapshots = async () => {
    setLoadingSnapshots(true);
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        const list = await invoke<BackupSnapshotInfo[]>('list_backup_snapshots', {
          destination: backupDest,
        });
        setSnapshots(list || []);
      } else {
        // Simulated snapshots in browser mode
        setSnapshots([
          {
            name: 'Study 13_11_26 04-21 AM',
            path: '/mnt/StudyBackups/Study 13_11_26 04-21 AM',
            timestamp: new Date().toISOString(),
            file_count: 209,
            size_bytes: 8450000,
          },
          {
            name: 'Study 13_11_26 04-04 AM',
            path: '/mnt/StudyBackups/Study 13_11_26 04-04 AM',
            timestamp: new Date(Date.now() - 17 * 60000).toISOString(),
            file_count: 209,
            size_bytes: 8420000,
          },
          {
            name: 'Study 13_11_26 03-42 AM',
            path: '/mnt/StudyBackups/Study 13_11_26 03-42 AM',
            timestamp: new Date(Date.now() - 39 * 60000).toISOString(),
            file_count: 198,
            size_bytes: 8100000,
          },
        ]);
      }
    } catch (err: any) {
      console.warn('Failed to load snapshots:', err);
    } finally {
      setLoadingSnapshots(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await dbService.saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleTab = (tabId: string) => {
    if (tabId === 'settings') return;

    if (visibleTabs.includes(tabId)) {
      if (visibleTabs.length <= 2) return;
      onVisibleTabsChange(visibleTabs.filter((t) => t !== tabId));
    } else {
      onVisibleTabsChange([...visibleTabs, tabId]);
    }
  };

  const handleExportZip = async () => {
    try {
      const outputFilename = `StudyOS_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
      const outputPath = `/home/ziadm/${outputFilename}`;

      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('export_zip_archive', { outputPath });
        setActionStatus(`ZIP archive created at: ${outputPath}`);
      } else {
        setActionStatus(`Simulated ZIP export: ${outputPath}`);
      }
      setTimeout(() => setActionStatus(null), 5000);
    } catch (e: any) {
      alert('Zip export failed: ' + e?.toString());
    }
  };

  const handleRestoreZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Restoring will overwrite current database and library files with the archive. Continue?')) {
      return;
    }

    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('restore_zip_archive', { zipPath: (file as any).path || file.name });
        setActionStatus('ZIP archive restored successfully! Please restart the app.');
      } else {
        setActionStatus('Simulated ZIP restore successful.');
      }
      setTimeout(() => setActionStatus(null), 6000);
    } catch (e: any) {
      alert('Restore failed: ' + e?.toString());
    }
  };

  const handleRestoreSnapshot = async (snapshotPath: string, name: string) => {
    if (!confirm(`Restore whole system data from snapshot "${name}"? Current data will be replaced.`)) {
      return;
    }

    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('restore_backup_snapshot', { snapshotPath });
        setActionStatus(`Restored data from snapshot: ${name}`);
      } else {
        setActionStatus(`Simulated restore from: ${name}`);
      }
      setTimeout(() => setActionStatus(null), 5000);
    } catch (e: any) {
      alert('Snapshot restore failed: ' + e?.toString());
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-canvas text-text-main select-none">
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
          Configure navigation dock position, toggle sidebar tabs, inspect backups, and export archives.
        </p>
      </div>

      {actionStatus && (
        <div className="hud-panel p-4 bg-primary/10 border-primary/40 flex items-center space-x-3 text-xs font-mono text-primary font-bold animate-fadeIn">
          <FileCheck className="w-5 h-5" />
          <span>{actionStatus}</span>
        </div>
      )}

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
                    {pos === 'left' && 'Vertical Left'}
                    {pos === 'bottom' && 'Horizontal Dock'}
                    {pos === 'right' && 'Vertical Right'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tab Visibility Checklist */}
          <div className="pt-4 border-t border-border space-y-3">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-text-muted">
              Configure Visible Sidebar Modules
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
              {ALL_NAV_ITEMS.map((item) => {
                const isVisible = visibleTabs.includes(item.id);
                const isMandatory = item.isMandatory;

                return (
                  <button
                    key={item.id}
                    onClick={() => toggleTab(item.id)}
                    disabled={isMandatory}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition ${
                      isVisible
                        ? 'bg-canvas border-border text-text-main'
                        : 'bg-surface/50 border-border/50 text-text-faint'
                    } ${isMandatory ? 'opacity-70 cursor-not-allowed' : 'hover:border-primary/50'}`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="text-primary">{item.icon}</div>
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

      {/* Manual Zip Backup & Portable Archives */}
      <div className="hud-panel p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="font-mono text-sm font-bold text-text-main flex items-center space-x-2">
            <Archive className="w-4 h-4 text-secondary" />
            <span>Portable Archive Compression (.ZIP)</span>
          </div>
          <span className="text-[10px] font-mono text-text-muted">Direct Full-Database Portability</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-canvas border border-border space-y-2">
            <div className="font-mono text-xs font-bold text-text-main flex items-center space-x-2">
              <Download className="w-4 h-4 text-primary" />
              <span>Export Full Zip Archive</span>
            </div>
            <p className="text-[11px] font-mono text-text-muted">
              Compresses SQLite database (`studyos.db`) and all ingested PDFs (`library/`) into an offline portable zip file.
            </p>
            <button
              onClick={handleExportZip}
              className="px-4 py-2 rounded-lg bg-primary text-canvas font-mono font-bold text-xs uppercase hover:brightness-110 transition shadow-sm"
            >
              Export Archive (.ZIP)
            </button>
          </div>

          <div className="p-4 rounded-xl bg-canvas border border-border space-y-2">
            <div className="font-mono text-xs font-bold text-text-main flex items-center space-x-2">
              <Upload className="w-4 h-4 text-secondary" />
              <span>Restore from Zip Archive</span>
            </div>
            <p className="text-[11px] font-mono text-text-muted">
              Select a previously exported StudyOS zip file to replace the local database and library.
            </p>
            <label className="inline-block px-4 py-2 rounded-lg bg-secondary text-canvas font-mono font-bold text-xs uppercase hover:brightness-110 transition shadow-sm cursor-pointer">
              <input type="file" accept=".zip" onChange={handleRestoreZip} className="hidden" />
              Upload & Restore (.ZIP)
            </label>
          </div>
        </div>
      </div>

      {/* Backup History Viewer (Showing Past Hardlink Snapshots) */}
      <div className="hud-panel p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="font-mono text-sm font-bold text-text-main flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-accent" />
            <span>ext4 Hardlink Snapshot History ({backupDest})</span>
          </div>
          <button
            onClick={loadSnapshots}
            disabled={loadingSnapshots}
            className="px-3 py-1.5 rounded-lg bg-canvas border border-border hover:border-primary text-text-muted hover:text-text-main text-xs font-mono font-semibold flex items-center space-x-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingSnapshots ? 'animate-spin' : ''}`} />
            <span>Refresh Snapshots</span>
          </button>
        </div>

        <div className="divide-y divide-border/60 max-h-80 overflow-y-auto">
          {snapshots.length === 0 ? (
            <div className="py-8 text-center font-mono text-xs text-text-muted">
              No previous ext4 snapshots found in {backupDest}.
            </div>
          ) : (
            snapshots.map((snap) => (
              <div
                key={snap.name}
                className="py-3 px-2 flex items-center justify-between hover:bg-canvas/50 rounded-lg transition font-mono text-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-accent">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-text-main">{snap.name}</div>
                    <div className="text-[10px] text-text-faint">
                      {snap.file_count} files • {formatBytes(snap.size_bytes)} • {new Date(snap.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRestoreSnapshot(snap.path, snap.name)}
                  className="px-3 py-1.5 rounded-lg bg-canvas border border-border hover:border-accent text-accent font-bold uppercase text-[10px] transition shadow-sm"
                >
                  Restore Snapshot
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
