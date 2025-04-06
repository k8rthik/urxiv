use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::AtomicU64;
use std::sync::Mutex;

// Block structure with simplified types
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Block {
    pub id: u64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub block_type: String,         // "channel" or "file"
    pub content: serde_json::Value, // Flexible content structure based on type
    pub connections: Vec<u64>,      // IDs of blocks connected to this one
}

// App state
pub struct AppState {
    pub workspace_dir: Mutex<Option<PathBuf>>,
    pub data_dir: Mutex<Option<PathBuf>>,
    pub next_id: AtomicU64,
    pub blocks_cache: Mutex<HashMap<u64, Block>>,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            workspace_dir: Mutex::new(None),
            data_dir: Mutex::new(None),
            next_id: AtomicU64::new(1),
            blocks_cache: Mutex::new(HashMap::new()),
        }
    }
}
