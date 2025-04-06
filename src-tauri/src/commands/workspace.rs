use chrono::Utc;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::Ordering;
use tauri::State;
use walkdir::WalkDir;

use crate::models::{AppState, Block};
use crate::storage;

#[tauri::command]
pub fn select_workspace(path: String, state: State<AppState>) -> Result<(), String> {
    let path = PathBuf::from(path);

    // Create data directory inside the workspace
    let data_dir = path.join(".urxiv");
    storage::initialize_dirs(&data_dir).map_err(|e| e.to_string())?;

    // Set workspace and data directory
    *state.workspace_dir.lock().unwrap() = Some(path.clone());
    *state.data_dir.lock().unwrap() = Some(data_dir.clone());

    // Initialize blocks cache
    let blocks_dir = data_dir.join("blocks");
    let highest_id = storage::find_highest_block_id(&blocks_dir);
    let blocks_cache = storage::load_blocks_cache(&blocks_dir);

    // Update state
    *state.blocks_cache.lock().unwrap() = blocks_cache;
    state.next_id.store(highest_id + 1, Ordering::SeqCst);

    Ok(())
}

#[tauri::command]
pub fn get_workspace_status(state: State<AppState>) -> Result<bool, String> {
    Ok(state.workspace_dir.lock().unwrap().is_some())
}

#[tauri::command]
pub fn index_workspace_files(state: State<AppState>) -> Result<Vec<Block>, String> {
    let workspace_dir = match state.workspace_dir.lock().unwrap().clone() {
        Some(dir) => dir,
        None => return Err("No workspace selected".to_string()),
    };

    let data_dir = state.data_dir.lock().unwrap().clone().unwrap();
    let mut blocks_cache = state.blocks_cache.lock().unwrap();
    let mut indexed_blocks = Vec::new();

    // Create a set of all existing file paths in our blocks
    let existing_files: HashMap<String, u64> = blocks_cache
        .values()
        .filter(|block| block.block_type == "file")
        .filter_map(|block| {
            block
                .content
                .get("path")
                .and_then(|p| p.as_str())
                .map(|path| (path.to_string(), block.id))
        })
        .collect();

    // Walk through all files in the workspace
    for entry in WalkDir::new(&workspace_dir)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
    {
        let path = entry.path();

        // Skip hidden files and directories
        if path.components().any(|c| {
            c.as_os_str()
                .to_str()
                .map(|s| s.starts_with('.'))
                .unwrap_or(false)
        }) {
            continue;
        }

        // Skip files we've already indexed
        if let Some(rel_path) = path.strip_prefix(&workspace_dir).ok() {
            let path_str = rel_path.to_string_lossy().to_string();

            if existing_files.contains_key(&path_str) {
                // Already indexed this file
                if let Some(block_id) = existing_files.get(&path_str) {
                    if let Some(block) = blocks_cache.get(block_id) {
                        indexed_blocks.push(block.clone());
                    }
                }
                continue;
            }

            // Get file type
            let file_type = storage::get_file_type(path);

            // Skip files we don't care about
            if file_type == "other" {
                continue;
            }

            // Create a new block for this file
            let now = Utc::now();
            let block_id = state.next_id.fetch_add(1, Ordering::SeqCst);

            // Extract filename
            let filename = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("Unknown")
                .to_string();

            let content = serde_json::json!({
                "path": path_str,
                "filename": filename,
                "file_type": file_type,
                "full_path": path.to_string_lossy().to_string()
            });

            let block = Block {
                id: block_id,
                created_at: now,
                updated_at: now,
                block_type: "file".to_string(),
                content,
                connections: Vec::new(),
            };

            // Save the block
            storage::save_block(&block, &data_dir, &mut blocks_cache)?;
            indexed_blocks.push(block);
        }
    }

    Ok(indexed_blocks)
}
