pub mod audio;
pub mod pdf_engine;

use pdf_engine::{ExtractedUnitResult, ImportPdfResult};
use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BackupSnapshotInfo {
    pub name: String,
    pub path: String,
    pub timestamp: String,
    pub file_count: usize,
    pub size_bytes: u64,
}

#[command]
fn trigger_backup(destination: Option<String>) -> Result<String, String> {
    let mut cmd = Command::new("bash");
    cmd.arg("scripts/backup.sh");
    if let Some(dest) = destination {
        cmd.arg(dest);
    }

    match cmd.output() {
        Ok(output) => {
            if output.status.success() {
                Ok(String::from_utf8_lossy(&output.stdout).to_string())
            } else {
                let err = String::from_utf8_lossy(&output.stderr).to_string();
                let out = String::from_utf8_lossy(&output.stdout).to_string();
                Err(format!("Backup failed: {}\n{}", out, err))
            }
        }
        Err(e) => Err(format!("Failed to execute backup script: {}", e)),
    }
}

#[command]
fn trigger_git_sync(message: String) -> Result<String, String> {
    let mut cmd = Command::new("bash");
    cmd.arg("scripts/git_sync.sh").arg(message);

    match cmd.output() {
        Ok(output) => {
            if output.status.success() {
                Ok(String::from_utf8_lossy(&output.stdout).to_string())
            } else {
                let err = String::from_utf8_lossy(&output.stderr).to_string();
                let out = String::from_utf8_lossy(&output.stdout).to_string();
                Err(format!("Git sync warning/error: {}\n{}", out, err))
            }
        }
        Err(e) => Err(format!("Failed to execute git sync: {}", e)),
    }
}

#[command]
fn list_backup_snapshots(destination: Option<String>) -> Result<Vec<BackupSnapshotInfo>, String> {
    let dest_str = destination.unwrap_or_else(|| "/mnt/StudyBackups".to_string());
    let dest_path = std::path::Path::new(&dest_str);

    if !dest_path.exists() {
        return Ok(Vec::new());
    }

    let mut snapshots = Vec::new();
    let entries = std::fs::read_dir(dest_path).map_err(|e| e.to_string())?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
            if file_name.starts_with("Study ") {
                let metadata = entry.metadata().ok();
                let modified = metadata
                    .and_then(|m| m.modified().ok())
                    .map(|t| {
                        let datetime: chrono::DateTime<chrono::Utc> = t.into();
                        datetime.to_rfc3339()
                    })
                    .unwrap_or_default();

                let (count, size) = count_dir_stats(&path);

                snapshots.push(BackupSnapshotInfo {
                    name: file_name.to_string(),
                    path: path.to_string_lossy().to_string(),
                    timestamp: modified,
                    file_count: count,
                    size_bytes: size,
                });
            }
        }
    }

    snapshots.sort_by(|a, b| b.name.cmp(&a.name));
    Ok(snapshots)
}

fn count_dir_stats(dir: &std::path::Path) -> (usize, u64) {
    let mut count = 0;
    let mut total_size = 0;
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_file() {
                count += 1;
                if let Ok(meta) = entry.metadata() {
                    total_size += meta.len();
                }
            } else if p.is_dir() {
                let (sub_count, sub_size) = count_dir_stats(&p);
                count += sub_count;
                total_size += sub_size;
            }
        }
    }
    (count, total_size)
}

#[command]
fn export_zip_archive(output_path: String) -> Result<String, String> {
    let mut cmd = Command::new("zip");
    cmd.arg("-r").arg(&output_path).arg("data");

    match cmd.output() {
        Ok(out) => {
            if out.status.success() {
                Ok(format!("Archive created successfully at: {}", output_path))
            } else {
                Err(format!("Zip failed: {}", String::from_utf8_lossy(&out.stderr)))
            }
        }
        Err(e) => Err(format!("Failed to run zip command: {}", e)),
    }
}

#[command]
fn restore_zip_archive(zip_path: String) -> Result<String, String> {
    if !std::path::Path::new(&zip_path).exists() {
        return Err(format!("Zip file not found at: {}", zip_path));
    }

    let mut cmd = Command::new("unzip");
    cmd.arg("-o").arg(&zip_path).arg("-d").arg(".");

    match cmd.output() {
        Ok(out) => {
            if out.status.success() {
                Ok("Data archive restored successfully.".to_string())
            } else {
                Err(format!("Unzip failed: {}", String::from_utf8_lossy(&out.stderr)))
            }
        }
        Err(e) => Err(format!("Failed to run unzip command: {}", e)),
    }
}

#[command]
fn restore_backup_snapshot(snapshot_path: String) -> Result<String, String> {
    let snap_data = std::path::Path::new(&snapshot_path).join("data");
    if !snap_data.exists() {
        return Err(format!(
            "No data/ directory found in snapshot at: {}",
            snapshot_path
        ));
    }

    let mut cmd = Command::new("cp");
    cmd.arg("-r")
        .arg(snap_data.to_string_lossy().to_string())
        .arg(".");

    match cmd.output() {
        Ok(out) => {
            if out.status.success() {
                Ok(format!(
                    "Successfully restored data from snapshot: {}",
                    snapshot_path
                ))
            } else {
                Err(format!(
                    "Restore copy failed: {}",
                    String::from_utf8_lossy(&out.stderr)
                ))
            }
        }
        Err(e) => Err(format!("Failed to execute restore: {}", e)),
    }
}

#[command]
fn import_pdf(source_path: String, subject_id: String) -> Result<ImportPdfResult, String> {
    pdf_engine::ingest_pdf(&source_path, &subject_id)
}

#[command]
fn extract_pdf_pages(
    source_path: String,
    subject_id: String,
    page_ranges: String,
    unit_title: String,
) -> Result<ExtractedUnitResult, String> {
    pdf_engine::slice_pdf_pages(&source_path, &subject_id, &page_ranges, &unit_title)
}

#[command]
fn validate_page_ranges(range_str: String, max_pages: u32) -> Result<Vec<u32>, String> {
    pdf_engine::parse_page_ranges(&range_str, max_pages)
}

use tauri::Manager;
#[cfg(target_os = "linux")]
use webkit2gtk::{SettingsExt, WebViewExt};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(target_os = "linux")]
            {
                for (_label, window) in app.webview_windows() {
                    let _ = window.with_webview(|webview| {
                        let wk_view = webview.inner();
                        if let Some(settings) = wk_view.settings() {
                            settings.set_enable_webaudio(true);
                            settings.set_enable_media(true);
                            settings.set_media_playback_requires_user_gesture(false);
                            settings.set_media_playback_allows_inline(true);
                        }
                    });
                }
            }
            Ok(())
        })
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .manage(audio::AudioState::default())
        .invoke_handler(tauri::generate_handler![
            trigger_backup,
            trigger_git_sync,
            list_backup_snapshots,
            export_zip_archive,
            restore_zip_archive,
            restore_backup_snapshot,
            import_pdf,
            extract_pdf_pages,
            validate_page_ranges,
            audio::start_rain,
            audio::stop_audio,
            audio::set_audio_volume,
            audio::play_local_file
        ])
        .run(tauri::generate_context!())
        .expect("error while building StudyOS native runtime");
}
