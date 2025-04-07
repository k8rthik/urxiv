use chrono::Utc;
use std::fs;
use std::io::Read;
use std::path::Path;
use std::sync::atomic::Ordering;
use tauri::State;

use crate::models::{AppState, Block};
use crate::storage;

#[tauri::command]
pub fn create_annotation(
    text_content: String,
    source_file_id: Option<u64>,
    position: Option<u64>,
    selected_text: Option<String>,
    parent_channel_id: Option<u64>,
    state: State<AppState>,
) -> Result<Block, String> {
    // Get data directory
    let data_dir = match state.data_dir.lock().unwrap().clone() {
        Some(dir) => dir,
        None => return Err("No workspace selected".to_string()),
    };

    let block_id = state.next_id.fetch_add(1, Ordering::SeqCst);
    let now = Utc::now();

    // Build content object
    let mut content = serde_json::Map::new();
    content.insert("text".to_string(), serde_json::Value::String(text_content));

    if let Some(file_id) = source_file_id {
        content.insert(
            "source_file_id".to_string(),
            serde_json::Value::Number(file_id.into()),
        );

        // Try to get the source file name from the blocks cache
        let blocks_cache = state.blocks_cache.lock().unwrap();
        if let Some(source_file) = blocks_cache.get(&file_id) {
            if let Some(filename) = source_file.content.get("filename").and_then(|f| f.as_str()) {
                content.insert(
                    "source_file_name".to_string(),
                    serde_json::Value::String(filename.to_string()),
                );
            }
        }
        drop(blocks_cache);
    }

    if let Some(pos) = position {
        content.insert(
            "position".to_string(),
            serde_json::Value::Number(pos.into()),
        );
    }

    if let Some(sel_text) = selected_text {
        content.insert(
            "selected_text".to_string(),
            serde_json::Value::String(sel_text),
        );
    }

    // Add annotation type (default to "note")
    content.insert(
        "annotation_type".to_string(),
        serde_json::Value::String("note".to_string()),
    );

    let block = Block {
        id: block_id,
        created_at: now,
        updated_at: now,
        block_type: "annotation".to_string(),
        content: serde_json::Value::Object(content),
        connections: Vec::new(),
    };

    // Save the annotation block
    let mut blocks_cache = state.blocks_cache.lock().unwrap();
    storage::save_block(&block, &data_dir, &mut blocks_cache)?;
    drop(blocks_cache);

    // If this annotation should be connected to a source file, connect them
    if let Some(file_id) = source_file_id {
        crate::commands::blocks::connect_blocks(file_id, block_id, state.clone())?;
    }

    // If this annotation should be added to a channel, connect them
    if let Some(channel_id) = parent_channel_id {
        crate::commands::blocks::connect_blocks(channel_id, block_id, state.clone())?;
    }

    Ok(block)
}

#[tauri::command]
pub fn index_file(
    file_path: String,
    parent_channel_id: Option<u64>,
    state: State<AppState>,
) -> Result<Block, String> {
    // Get data directory
    let data_dir = match state.data_dir.lock().unwrap().clone() {
        Some(dir) => dir,
        None => return Err("No workspace selected".to_string()),
    };

    // Check if file exists
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("File not found: {}", file_path));
    }

    // Get file metadata
    let filename = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Unknown");

    let path_without_filename = path.parent().and_then(|p| p.to_str()).unwrap_or("");

    // Determine file type
    let file_type = storage::get_file_type(path);

    let block_id = state.next_id.fetch_add(1, Ordering::SeqCst);
    let now = Utc::now();

    // Create content for the file block
    let content = serde_json::json!({
        "filename": filename,
        "path": path_without_filename,
        "full_path": file_path,
        "file_type": file_type,
        "indexed_at": now.to_rfc3339()
    });

    let block = Block {
        id: block_id,
        created_at: now,
        updated_at: now,
        block_type: "file".to_string(),
        content,
        connections: Vec::new(),
    };

    // Save the file block
    let mut blocks_cache = state.blocks_cache.lock().unwrap();
    storage::save_block(&block, &data_dir, &mut blocks_cache)?;
    drop(blocks_cache);

    // If this file should be added to a channel, connect them
    if let Some(channel_id) = parent_channel_id {
        crate::commands::blocks::connect_blocks(channel_id, block_id, state.clone())?;
    }

    Ok(block)
}

#[tauri::command]
pub fn index_directory(
    directory_path: String,
    recursive: bool,
    parent_channel_id: Option<u64>,
    state: State<AppState>,
) -> Result<Vec<Block>, String> {
    let path = Path::new(&directory_path);
    if !path.exists() || !path.is_dir() {
        return Err(format!("Directory not found: {}", directory_path));
    }

    let mut indexed_files = Vec::new();

    // Simple directory traversal (consider using walkdir crate for production code)
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let entry_path = entry.path();

            if entry_path.is_file() {
                // Only index certain file types
                if let Some(ext) = entry_path.extension().and_then(|e| e.to_str()) {
                    match ext.to_lowercase().as_str() {
                        "pdf" | "epub" | "txt" | "md" | "markdown" | "rs" | "js" | "ts" | "py"
                        | "java" | "c" | "cpp" | "h" | "html" | "css" | "jsx" | "tsx" => {
                            // Index this file
                            match index_file(
                                entry_path.to_string_lossy().to_string(),
                                parent_channel_id,
                                state.clone(),
                            ) {
                                Ok(block) => indexed_files.push(block),
                                Err(e) => eprintln!("Error indexing file: {}", e),
                            }
                        }
                        _ => continue, // Skip other file types
                    }
                }
            } else if recursive && entry_path.is_dir() {
                // Recursively index subdirectory
                match index_directory(
                    entry_path.to_string_lossy().to_string(),
                    true,
                    parent_channel_id,
                    state.clone(),
                ) {
                    Ok(sub_files) => indexed_files.extend(sub_files),
                    Err(e) => eprintln!("Error indexing directory: {}", e),
                }
            }
        }
    }

    Ok(indexed_files)
}

#[tauri::command]
pub fn get_file_content(file_path: String) -> Result<Vec<u8>, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("File not found: {}", file_path));
    }

    let mut file = fs::File::open(path).map_err(|e| e.to_string())?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;

    Ok(buffer)
}

#[tauri::command]
pub fn get_file_annotations(file_id: u64, state: State<AppState>) -> Result<Vec<Block>, String> {
    let blocks_cache = state.blocks_cache.lock().unwrap();

    // Verify the file exists
    if !blocks_cache.contains_key(&file_id) {
        return Err(format!("File {} not found", file_id));
    }

    // Get all blocks that are connected to this file and are annotations
    let mut annotations = Vec::new();

    for block in blocks_cache.values() {
        if block.block_type == "annotation" && block.connections.contains(&file_id) {
            annotations.push(block.clone());
        }
    }

    // Sort by position if available, otherwise by updated_at
    annotations.sort_by(|a, b| {
        if let (Some(pos_a), Some(pos_b)) = (
            a.content.get("position").and_then(|p| p.as_u64()),
            b.content.get("position").and_then(|p| p.as_u64()),
        ) {
            pos_a.cmp(&pos_b)
        } else {
            b.updated_at.cmp(&a.updated_at)
        }
    });

    Ok(annotations)
}
