// src-tauri/src/repositories/block_repository.rs
use crate::domain::block::Block;
use crate::errors::{AppResult, BlockError};
use crate::storage::Storage;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

pub trait BlockRepository: Send + Sync {
    fn get(&self, id: u64) -> AppResult<Block>;
    fn list(&self) -> AppResult<Vec<Block>>;
    fn list_by_type(&self, block_type: &str) -> AppResult<Vec<Block>>;
    fn save(&self, block: &Block) -> AppResult<()>;
    fn delete(&self, id: u64) -> AppResult<()>;
    fn get_highest_id(&self) -> AppResult<u64>;
}

pub struct FileSystemBlockRepository {
    storage: Arc<dyn Storage>,
    cache: Mutex<HashMap<u64, Block>>,
}

impl FileSystemBlockRepository {
    pub fn new(storage: Arc<dyn Storage>) -> Self {
        let cache = Self::load_cache(storage.clone());

        Self {
            storage,
            cache: Mutex::new(cache),
        }
    }

    fn load_cache(storage: Arc<dyn Storage>) -> HashMap<u64, Block> {
        let mut cache = HashMap::new();

        // List all block files
        if let Ok(keys) = storage.list_keys("blocks") {
            for key in keys {
                if key.ends_with(".json") {
                    if let Ok(data) = storage.read(&key) {
                        if let Ok(block) = serde_json::from_slice::<Block>(&data) {
                            cache.insert(block.id, block);
                        }
                    }
                }
            }
        }

        cache
    }

    fn get_block_key(&self, id: u64) -> String {
        format!("blocks/{}.json", id)
    }
}

impl BlockRepository for FileSystemBlockRepository {
    fn get(&self, id: u64) -> AppResult<Block> {
        let cache = self.cache.lock()?;

        cache
            .get(&id)
            .cloned()
            .ok_or_else(|| BlockError::NotFound(id).into())
    }

    fn list(&self) -> AppResult<Vec<Block>> {
        let cache = self.cache.lock()?;
        let blocks = cache.values().cloned().collect();
        Ok(blocks)
    }

    fn list_by_type(&self, block_type: &str) -> AppResult<Vec<Block>> {
        let cache = self.cache.lock()?;

        let blocks: Vec<Block> = cache
            .values()
            .filter(|block| block.block_type.to_string() == block_type)
            .cloned()
            .collect();

        Ok(blocks)
    }

    fn save(&self, block: &Block) -> AppResult<()> {
        let json = serde_json::to_vec_pretty(block)?;
        let key = self.get_block_key(block.id);

        // Save to storage
        self.storage.write(&key, &json)?;

        // Update cache
        let mut cache = self.cache.lock()?;
        cache.insert(block.id, block.clone());

        Ok(())
    }

    fn delete(&self, id: u64) -> AppResult<()> {
        let key = self.get_block_key(id);

        // Remove from storage
        self.storage.delete(&key)?;

        // Remove from cache
        let mut cache = self.cache.lock()?;
        cache.remove(&id);

        Ok(())
    }

    fn get_highest_id(&self) -> AppResult<u64> {
        let cache = self.cache.lock()?;

        let highest_id = cache.keys().max().cloned().unwrap_or(0);

        Ok(highest_id)
    }
}
