// src-tauri/src/domain/workspace.rs
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workspace {
    pub path: PathBuf,
    pub data_dir: PathBuf,
    pub last_opened: chrono::DateTime<chrono::Utc>,
}

impl Workspace {
    pub fn new(path: PathBuf) -> Self {
        let data_dir = path.join(".urxiv");

        Self {
            path,
            data_dir,
            last_opened: chrono::Utc::now(),
        }
    }

    pub fn blocks_dir(&self) -> PathBuf {
        self.data_dir.join("blocks")
    }
}
