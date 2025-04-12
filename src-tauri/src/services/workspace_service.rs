// src-tauri/src/services/workspace_service.rs
use crate::domain::block::{Block, BlockType};
use crate::domain::workspace::Workspace;
use crate::errors::{AppError, AppResult, WorkspaceError};
use crate::repositories::workspace_repository::WorkspaceRepository;
use crate::services::block_service::BlockService;
use crate::storage::{get_file_type, Storage};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use walkdir::WalkDir;

pub struct WorkspaceService {
    repository: Arc<dyn WorkspaceRepository>,
    block_service: Arc<BlockService>,
    storage: Arc<dyn Storage>,
}

impl WorkspaceService {
    pub fn new(
        repository: Arc<dyn WorkspaceRepository>,
        block_service: Arc<BlockService>,
        storage: Arc<dyn Storage>,
    ) -> Self {
        Self {
            repository,
            block_service,
            storage,
        }
    }

    pub fn has_workspace(&self) -> AppResult<bool> {
        let workspace = self.repository.get_current()?;
        Ok(workspace.is_some())
    }

    pub fn select_workspace(&self, path: PathBuf) -> AppResult<()> {
        let workspace = Workspace::new(path);

        // Initialize the workspace structure
        std::fs::create_dir_all(&workspace.data_dir)
            .map_err(|e| WorkspaceError::InvalidPath(e.to_string()))?;

        std::fs::create_dir_all(workspace.blocks_dir())
            .map_err(|e| WorkspaceError::InvalidPath(e.to_string()))?;

        // Save the workspace
        self.repository.set_current(workspace)?;

        Ok(())
    }

    pub fn index_workspace_files(&self) -> AppResult<Vec<Block>> {
        let workspace = self
            .repository
            .get_current()?
            .ok_or_else(|| WorkspaceError::NoWorkspace)?;

        let workspace_path = &workspace.path;
        let mut indexed_blocks = Vec::new();

        // Get all existing file blocks
        let existing_files = self.block_service.get_all_files()?;
        let file_path_map: std::collections::HashMap<String, u64> = existing_files
            .iter()
            .filter_map(|block| {
                if let Some(file_content) = block.get_file_content() {
                    Some((file_content.path, block.id))
                } else {
                    None
                }
            })
            .collect();

        // Add existing blocks to the result
        indexed_blocks.extend(existing_files);

        // Walk through filesystem
        for entry in WalkDir::new(workspace_path)
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

            // Get relative path for storage
            if let Ok(rel_path) = path.strip_prefix(workspace_path) {
                let path_str = rel_path.to_string_lossy().to_string();

                // Skip files we've already indexed
                if file_path_map.contains_key(&path_str) {
                    continue;
                }

                // Get file type
                let file_type = get_file_type(path);

                // Skip files we don't care about
                if file_type == "other" {
                    continue;
                }

                // Extract filename
                let filename = path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("Unknown")
                    .to_string();

                // Create a new block for this file
                let block = self.block_service.create_file_block(
                    path_str,
                    filename,
                    file_type,
                    path.to_string_lossy().to_string(),
                )?;

                indexed_blocks.push(block);
            }
        }

        Ok(indexed_blocks)
    }

    pub fn get_current_workspace(&self) -> AppResult<Workspace> {
        self.repository
            .get_current()?
            .ok_or_else(|| WorkspaceError::NoWorkspace.into())
    }
}
