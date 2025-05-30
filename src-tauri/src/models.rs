use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::AtomicU64;
use std::sync::Mutex;

use crate::repository::FileBlockRepository;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChannelContent {
    pub title: String,
    pub description: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FileContent {
    pub path: String,
    pub filename: String,
    pub file_type: String,
    pub full_path: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "type", content = "data")]
pub enum BlockKind {
    Channel(ChannelContent),
    File(FileContent),
}

impl BlockKind {
    pub fn as_str(&self) -> &'static str {
        match self {
            BlockKind::Channel(_) => "channel",
            BlockKind::File(_) => "file",
        }
    }
}

impl ChannelContent {
    pub fn new(title: String, description: String) -> Self {
        Self { title, description }
    }
}

impl FileContent {
    pub fn new(path: String, filename: String, file_type: String, full_path: String) -> Self {
        Self {
            path,
            filename,
            file_type,
            full_path,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Block {
    pub id: u64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub kind: BlockKind,
    pub connections: Vec<u64>,
}

impl Block {
    pub fn new_channel(id: u64, title: String, description: String) -> Self {
        let now = Utc::now();
        Block {
            id,
            created_at: now,
            updated_at: now,
            kind: BlockKind::Channel(ChannelContent::new(title, description)),
            connections: Vec::new(),
        }
    }

    pub fn new_file(
        id: u64,
        path: String,
        filename: String,
        file_type: String,
        full_path: String,
    ) -> Self {
        let now = Utc::now();
        Block {
            id,
            created_at: now,
            updated_at: now,
            kind: BlockKind::File(FileContent::new(path, filename, file_type, full_path)),
            connections: Vec::new(),
        }
    }
}

// App state
pub struct AppState {
    pub workspace_dir: Mutex<Option<PathBuf>>,
    pub data_dir: Mutex<Option<PathBuf>>,
    pub next_id: AtomicU64,
    pub blocks_cache: Mutex<HashMap<u64, Block>>,
    pub repository: Mutex<Option<FileBlockRepository>>,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            workspace_dir: Mutex::new(None),
            data_dir: Mutex::new(None),
            next_id: AtomicU64::new(1),
            blocks_cache: Mutex::new(HashMap::new()),
            repository: Mutex::new(None),
        }
    }
}
