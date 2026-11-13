pub mod pdf_engine;

use pdf_engine::{ExtractedUnitResult, ImportPdfResult};
use std::process::Command;
use tauri::command;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            trigger_backup,
            trigger_git_sync,
            import_pdf,
            extract_pdf_pages,
            validate_page_ranges
        ])
        .run(tauri::generate_context!())
        .expect("error while building StudyOS native runtime");
}
