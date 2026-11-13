use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashSet;
use std::fs::{self, File};
use std::io::Read;
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TocItem {
    pub title: String,
    pub page: u32,
    pub children: Vec<TocItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportPdfResult {
    pub title: String,
    pub stored_path: String,
    pub original_filename: String,
    pub file_hash: String,
    pub page_count: u32,
    pub toc: Vec<TocItem>,
    pub is_duplicate: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExtractedUnitResult {
    pub title: String,
    pub stored_path: String,
    pub file_hash: String,
    pub page_count: u32,
    pub page_ranges: String,
}

/// Parses page range string syntax, e.g. "1-5, 7, 10-12" into a sorted list of 1-based page numbers.
pub fn parse_page_ranges(range_str: &str, max_pages: u32) -> Result<Vec<u32>, String> {
    let mut pages = HashSet::new();
    let parts = range_str.split(',');

    for part in parts {
        let trimmed = part.trim();
        if trimmed.is_empty() {
            continue;
        }

        if let Some((start_str, end_str)) = trimmed.split_once('-') {
            let start: u32 = start_str
                .trim()
                .parse()
                .map_err(|_| format!("Invalid start page: '{}'", start_str))?;
            let end: u32 = end_str
                .trim()
                .parse()
                .map_err(|_| format!("Invalid end page: '{}'", end_str))?;

            if start == 0 || end == 0 {
                return Err("Page numbers must be 1-based (greater than 0)".to_string());
            }

            let (low, high) = if start <= end {
                (start, end)
            } else {
                (end, start)
            };

            for p in low..=high {
                if max_pages > 0 && p > max_pages {
                    return Err(format!(
                        "Page {} exceeds total document pages ({})",
                        p, max_pages
                    ));
                }
                pages.insert(p);
            }
        } else {
            let p: u32 = trimmed
                .parse()
                .map_err(|_| format!("Invalid page number: '{}'", trimmed))?;
            if p == 0 {
                return Err("Page numbers must be 1-based (greater than 0)".to_string());
            }
            if max_pages > 0 && p > max_pages {
                return Err(format!(
                    "Page {} exceeds total document pages ({})",
                    p, max_pages
                ));
            }
            pages.insert(p);
        }
    }

    if pages.is_empty() {
        return Err("No valid pages found in range".to_string());
    }

    let mut sorted: Vec<u32> = pages.into_iter().collect();
    sorted.sort_unstable();
    Ok(sorted)
}

/// Calculate SHA-256 hash of a file
pub fn calculate_file_hash(path: &Path) -> Result<String, String> {
    let mut file = File::open(path).map_err(|e| format!("Failed to open file: {}", e))?;
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 8192];

    loop {
        let count = file
            .read(&mut buffer)
            .map_err(|e| format!("Failed to read file: {}", e))?;
        if count == 0 {
            break;
        }
        hasher.update(&buffer[..count]);
    }

    Ok(format!("{:x}", hasher.finalize()))
}

fn decode_pdf_string(bytes: &[u8]) -> String {
    if bytes.len() >= 2 && bytes[0] == 0xFE && bytes[1] == 0xFF {
        // UTF-16BE encoding with BOM
        let u16_chars: Vec<u16> = bytes[2..]
            .chunks_exact(2)
            .map(|chunk| u16::from_be_bytes([chunk[0], chunk[1]]))
            .collect();
        String::from_utf16_lossy(&u16_chars)
    } else {
        String::from_utf8_lossy(bytes).trim().to_string()
    }
}

fn resolve_dest_page(
    doc: &lopdf::Document,
    dest_obj: &lopdf::Object,
    page_map: &std::collections::HashMap<(u32, u16), u32>,
) -> Option<u32> {
    let resolved = match dest_obj {
        lopdf::Object::Reference(r) => doc.get_object(*r).ok()?,
        other => other,
    };

    match resolved {
        lopdf::Object::Array(arr) => {
            if let Some(first) = arr.first() {
                match first {
                    lopdf::Object::Reference(p_ref) => page_map.get(p_ref).copied(),
                    lopdf::Object::Integer(idx) => Some((*idx as u32) + 1),
                    _ => None,
                }
            } else {
                None
            }
        }
        lopdf::Object::Integer(idx) => Some((*idx as u32) + 1),
        _ => None,
    }
}

fn traverse_outline_level(
    doc: &lopdf::Document,
    start_ref: (u32, u16),
    page_map: &std::collections::HashMap<(u32, u16), u32>,
    visited: &mut HashSet<(u32, u16)>,
    depth: usize,
) -> Vec<TocItem> {
    if depth > 5 {
        return Vec::new();
    }

    let mut items = Vec::new();
    let mut current_ref = Some(start_ref);

    while let Some(item_ref) = current_ref {
        if visited.contains(&item_ref) {
            break;
        }
        visited.insert(item_ref);

        if let Ok(lopdf::Object::Dictionary(item_dict)) = doc.get_object(item_ref) {
            let title = match item_dict.get(b"Title") {
                Ok(lopdf::Object::String(bytes, _)) => decode_pdf_string(bytes),
                _ => "Untitled Section".to_string(),
            };

            // 1. Check direct /Dest
            let mut page = 1;
            if let Ok(dest_obj) = item_dict.get(b"Dest") {
                if let Some(p) = resolve_dest_page(doc, dest_obj, page_map) {
                    page = p;
                }
            } else if let Ok(action_obj) = item_dict.get(b"A") {
                // 2. Check Action /A
                let action_dict = match action_obj {
                    lopdf::Object::Reference(r) => doc.get_object(*r).ok(),
                    _ => Some(action_obj),
                };
                if let Some(lopdf::Object::Dictionary(ad)) = action_dict {
                    if let Ok(action_type) = ad.get(b"S") {
                        if action_type.as_name().map(|n| n == b"GoTo").unwrap_or(false) {
                            if let Ok(dest_obj) = ad.get(b"D") {
                                if let Some(p) = resolve_dest_page(doc, dest_obj, page_map) {
                                    page = p;
                                }
                            }
                        }
                    }
                }
            }

            // 3. Recursively check for sub-children
            let children = if let Ok(lopdf::Object::Reference(child_ref)) = item_dict.get(b"First") {
                traverse_outline_level(doc, *child_ref, page_map, visited, depth + 1)
            } else {
                Vec::new()
            };

            items.push(TocItem {
                title,
                page,
                children,
            });

            current_ref = match item_dict.get(b"Next") {
                Ok(lopdf::Object::Reference(r)) => Some(*r),
                _ => None,
            };
        } else {
            break;
        }
    }

    items
}

/// Extracts outlines / bookmarks from a PDF document using lopdf
pub fn extract_bookmarks(doc: &lopdf::Document) -> Vec<TocItem> {
    let pages = doc.get_pages();
    let page_map: std::collections::HashMap<(u32, u16), u32> = pages.into_iter().map(|(num, r)| (r, num)).collect();

    // Check catalog dictionary for Outlines reference
    let catalog = match doc.catalog() {
        Ok(c) => c,
        Err(_) => return Vec::new(),
    };

    let outlines_dict = match catalog.get(b"Outlines") {
        Ok(lopdf::Object::Reference(r)) => match doc.get_object(*r) {
            Ok(lopdf::Object::Dictionary(d)) => d,
            _ => return Vec::new(),
        },
        Ok(lopdf::Object::Dictionary(d)) => d,
        _ => return Vec::new(),
    };

    let first_ref = match outlines_dict.get(b"First") {
        Ok(lopdf::Object::Reference(r)) => *r,
        _ => return Vec::new(),
    };

    let mut visited = HashSet::new();
    traverse_outline_level(doc, first_ref, &page_map, &mut visited, 0)
}

/// Ingests a PDF file into `./data/library/<subject_id>/<hash>.pdf`
pub fn ingest_pdf(source_path_str: &str, subject_id: &str) -> Result<ImportPdfResult, String> {
    let source_path = Path::new(source_path_str);
    if !source_path.exists() {
        return Err(format!("Source PDF does not exist: {}", source_path_str));
    }

    let file_hash = calculate_file_hash(source_path)?;
    let original_filename = source_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("document.pdf")
        .to_string();

    let target_dir = PathBuf::from("data")
        .join("library")
        .join(subject_id);
    fs::create_dir_all(&target_dir)
        .map_err(|e| format!("Failed to create library directory: {}", e))?;

    let target_path = target_dir.join(format!("{}.pdf", file_hash));
    let is_duplicate = target_path.exists();

    if !is_duplicate {
        fs::copy(source_path, &target_path)
            .map_err(|e| format!("Failed to copy PDF to managed library: {}", e))?;
    }

    // Load document to extract metadata
    let doc = lopdf::Document::load(&target_path)
        .map_err(|e| format!("Failed to parse PDF: {}", e))?;

    let page_count = doc.get_pages().len() as u32;

    let mut title = original_filename.clone();
    if let Ok(info) = doc.trailer.get(b"Info") {
        if let Ok(info_deref) = doc.dereference(info) {
            if let Ok(dict) = info_deref.1.as_dict() {
                if let Ok(lopdf::Object::String(bytes, _)) = dict.get(b"Title") {
                    let extracted = String::from_utf8_lossy(bytes).trim().to_string();
                    if !extracted.is_empty() {
                        title = extracted;
                    }
                }
            }
        }
    }

    let toc = extract_bookmarks(&doc);

    Ok(ImportPdfResult {
        title,
        stored_path: target_path.to_string_lossy().to_string(),
        original_filename,
        file_hash,
        page_count,
        toc,
        is_duplicate,
    })
}

/// Extracts specified page ranges from source PDF into a new PDF
pub fn slice_pdf_pages(
    source_path_str: &str,
    subject_id: &str,
    range_str: &str,
    unit_title: &str,
) -> Result<ExtractedUnitResult, String> {
    let source_path = Path::new(source_path_str);
    if !source_path.exists() {
        return Err(format!("Source PDF not found: {}", source_path_str));
    }

    let mut doc = lopdf::Document::load(source_path)
        .map_err(|e| format!("Failed to load source PDF: {}", e))?;

    let total_pages = doc.get_pages().len() as u32;
    let selected_pages = parse_page_ranges(range_str, total_pages)?;

    // Retain only the selected pages in a new document
    let pages_map = doc.get_pages();
    let mut pages_to_keep = Vec::new();
    for p in &selected_pages {
        if let Some(&page_id) = pages_map.get(p) {
            pages_to_keep.push((page_id, *p));
        }
    }

    if pages_to_keep.is_empty() {
        return Err("No valid pages selected for extraction".to_string());
    }

    // Create target directory
    let target_dir = PathBuf::from("data")
        .join("library")
        .join(subject_id);
    fs::create_dir_all(&target_dir)
        .map_err(|e| format!("Failed to create target directory: {}", e))?;

    let sanitized_title: String = unit_title
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
        .collect();

    let output_filename = format!(
        "unit_{}_{}.pdf",
        sanitized_title,
        chrono::Utc::now().timestamp_millis()
    );
    let output_path = target_dir.join(&output_filename);

    // Filter pages and save
    let page_numbers_to_keep: Vec<u32> = pages_to_keep.iter().map(|(_, num)| *num).collect();
    let pages_to_delete: Vec<u32> = (1..=total_pages)
        .filter(|p| !page_numbers_to_keep.contains(p))
        .collect();

    doc.delete_pages(&pages_to_delete);
    doc.prune_objects();

    let mut out_file = File::create(&output_path)
        .map_err(|e| format!("Failed to create extracted unit file: {}", e))?;
    doc.save_to(&mut out_file)
        .map_err(|e| format!("Failed to save extracted PDF: {}", e))?;

    let file_hash = calculate_file_hash(&output_path)?;

    Ok(ExtractedUnitResult {
        title: unit_title.to_string(),
        stored_path: output_path.to_string_lossy().to_string(),
        file_hash,
        page_count: selected_pages.len() as u32,
        page_ranges: range_str.to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_single_pages() {
        let res = parse_page_ranges("1, 3, 5", 10).unwrap();
        assert_eq!(res, vec![1, 3, 5]);
    }

    #[test]
    fn test_parse_ranges_and_singles() {
        let res = parse_page_ranges("1-3, 5, 8-10", 20).unwrap();
        assert_eq!(res, vec![1, 2, 3, 5, 8, 9, 10]);
    }

    #[test]
    fn test_parse_reversed_range() {
        let res = parse_page_ranges("5-2", 10).unwrap();
        assert_eq!(res, vec![2, 3, 4, 5]);
    }

    #[test]
    fn test_page_out_of_bounds() {
        let err = parse_page_ranges("1-15", 10).unwrap_err();
        assert!(err.contains("exceeds total document pages"));
    }

    #[test]
    fn test_zero_page_error() {
        let err = parse_page_ranges("0-5", 10).unwrap_err();
        assert!(err.contains("1-based"));
    }

    #[test]
    fn test_stress_slice_500_page_pdf() {
        use lopdf::{dictionary, Document, Object};
        let mut doc = Document::with_version("1.5");
        let pages_id = doc.new_object_id();
        let mut page_ids = Vec::new();

        for _ in 1..=500 {
            let page_id = doc.add_object(dictionary! {
                "Type" => "Page",
                "Parent" => pages_id,
                "MediaBox" => vec![0.into(), 0.into(), 595.into(), 842.into()],
            });
            page_ids.push(page_id.into());
        }

        doc.objects.insert(
            pages_id,
            Object::Dictionary(dictionary! {
                "Type" => "Pages",
                "Kids" => page_ids,
                "Count" => 500,
            }),
        );

        let catalog_id = doc.add_object(dictionary! {
            "Type" => "Catalog",
            "Pages" => pages_id,
        });
        doc.trailer.set("Root", catalog_id);

        let temp_dir = std::env::temp_dir();
        let temp_src = temp_dir.join(format!("studyos_stress_500_{}.pdf", uuid::Uuid::new_v4()));
        doc.save(&temp_src).expect("Failed to save 500-page dummy PDF");

        // Verify document has 500 pages
        let loaded = Document::load(&temp_src).expect("Failed to load 500-page dummy PDF");
        assert_eq!(loaded.get_pages().len(), 500);

        // Slice pages: 1-50, 100-150, 400-500 (202 pages total)
        let res = slice_pdf_pages(
            &temp_src.to_string_lossy(),
            "stress_test_subject",
            "1-50, 100-150, 400-500",
            "Stress Test Unit",
        )
        .expect("Slicing 500-page PDF failed");

        assert_eq!(res.page_count, 202);
        assert!(Path::new(&res.stored_path).exists());

        // Verify sliced PDF is readable and has exactly 202 pages
        let sliced_doc = Document::load(&res.stored_path).expect("Failed to load sliced output");
        assert_eq!(sliced_doc.get_pages().len(), 202);

        // Clean up temporary test files
        let _ = fs::remove_file(&temp_src);
        let _ = fs::remove_file(&res.stored_path);
    }
}
