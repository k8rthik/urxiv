use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::Ordering;
use tauri::State;
use walkdir::WalkDir;

use crate::error::{AppError, Result};
use crate::models::{AppState, Block};
use crate::repository::{BlockRepository, FileBlockRepository};
use crate::storage;

#[tauri::command]
pub fn select_workspace(path: String, state: State<AppState>) -> Result<()> {
    let path = PathBuf::from(path);

    // Create data directory inside the workspace
    let data_dir = path.join(".urxiv");
    storage::initialize_dirs(&data_dir)?;

    // Set workspace and data directory
    *state.workspace_dir.lock().unwrap() = Some(path.clone());
    *state.data_dir.lock().unwrap() = Some(data_dir.clone());

    // Initialize blocks cache
    let blocks_dir = data_dir.join("blocks");
    let highest_id = storage::find_highest_block_id(&blocks_dir);
    let blocks_cache = storage::load_blocks_cache(&blocks_dir);
    let mut repository = FileBlockRepository::new(data_dir.clone(), blocks_cache);

    // Update state
    let all_blocks = repository.all()?;
    *state.blocks_cache.lock().unwrap() =
        all_blocks.iter().cloned().map(|b| (b.id, b)).collect();
    *state.repository.lock().unwrap() = Some(repository);
    state.next_id.store(highest_id + 1, Ordering::SeqCst);

    Ok(())
}

#[tauri::command]
pub fn get_workspace_status(state: State<AppState>) -> Result<bool> {
    Ok(state.workspace_dir.lock().unwrap().is_some())
}

#[tauri::command]
pub fn index_workspace_files(state: State<AppState>) -> Result<Vec<Block>> {
    let workspace_dir = match state.workspace_dir.lock().unwrap().clone() {
        Some(dir) => dir,
        None => return Err(AppError::NoWorkspaceSelected),
    };

    let mut repo_lock = state.repository.lock().unwrap();
    let repo = repo_lock.as_mut().ok_or(AppError::NoWorkspaceSelected)?;

    let mut indexed_blocks = Vec::new();

    // Create a set of all existing file paths in our blocks
    let existing_files: HashMap<String, u64> = repo
        .all_files()?
        .into_iter()
        .filter_map(|b| match b.kind {
            BlockKind::File(f) => Some((f.path, b.id)),
            _ => None,
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
                    if let Ok(block) = repo.get(*block_id) {
                        indexed_blocks.push(block);
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
            let block_id = state.next_id.fetch_add(1, Ordering::SeqCst);

            // Extract filename
            let filename = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("Unknown")
                .to_string();

            let block = Block::new_file(
                block_id,
                path_str,
                filename,
                file_type,
                path.to_string_lossy().to_string(),
            );

            // Save the block
            repo.save(&block)?;
            indexed_blocks.push(block);
        }
    }

    Ok(indexed_blocks)
}
