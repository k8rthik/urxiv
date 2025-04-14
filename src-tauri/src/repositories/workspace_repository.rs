// src-tauri/src/repositories/workspace_repository.rs
use crate::domain::workspace::Workspace;
use crate::errors::AppResult;
use crate::storage::Storage;
use std::sync::{Arc, Mutex};

pub trait WorkspaceRepository: Send + Sync {
    fn get_current(&self) -> AppResult<Option<Workspace>>;
    fn set_current(&self, workspace: Workspace) -> AppResult<()>;
    fn clear_current(&self) -> AppResult<()>;
}

pub struct FileSystemWorkspaceRepository {
    storage: Arc<dyn Storage>,
    current: Mutex<Option<Workspace>>,
}

impl FileSystemWorkspaceRepository {
    pub fn new(storage: Arc<dyn Storage>) -> Self {
        let current = Self::load_workspace(storage.clone());

        Self {
            storage,
            current: Mutex::new(current),
        }
    }

    fn load_workspace(storage: Arc<dyn Storage>) -> Option<Workspace> {
        if storage.exists("workspace.json") {
            if let Ok(data) = storage.read("workspace.json") {
                if let Ok(workspace) = serde_json::from_slice::<Workspace>(&data) {
                    return Some(workspace);
                }
            }
        }

        None
    }
}

impl WorkspaceRepository for FileSystemWorkspaceRepository {
    fn get_current(&self) -> AppResult<Option<Workspace>> {
        let current = self.current.lock()?;
        Ok(current.clone())
    }

    fn set_current(&self, workspace: Workspace) -> AppResult<()> {
        // Save workspace to storage
        let json = serde_json::to_vec_pretty(&workspace)?;
        self.storage.write("workspace.json", &json)?;

        // Update in-memory state
        let mut current = self.current.lock()?;
        *current = Some(workspace);

        Ok(())
    }

    fn clear_current(&self) -> AppResult<()> {
        // Delete workspace from storage
        if self.storage.exists("workspace.json") {
            self.storage.delete("workspace.json")?;
        }

        // Clear in-memory state
        let mut current = self.current.lock()?;
        *current = None;

        Ok(())
    }
}
