use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

use crate::error::{AppError, Result};
use crate::models::{Block, BlockKind};
use crate::storage;

pub trait BlockRepository {
    fn all(&self) -> Result<Vec<Block>>;
    fn all_files(&self) -> Result<Vec<Block>>;
    fn all_channels(&self) -> Result<Vec<Block>>;
    fn get(&self, id: u64) -> Result<Block>;
    fn save(&mut self, block: &Block) -> Result<()>;
    fn delete(&mut self, id: u64) -> Result<()>;
}

pub struct FileBlockRepository {
    data_dir: PathBuf,
    cache: HashMap<u64, Block>,
}

impl FileBlockRepository {
    pub fn new(data_dir: PathBuf, cache: HashMap<u64, Block>) -> Self {
        Self { data_dir, cache }
    }

    fn blocks_dir(&self) -> PathBuf {
        self.data_dir.join("blocks")
    }
}

impl BlockRepository for FileBlockRepository {
    fn all(&self) -> Result<Vec<Block>> {
        Ok(self.cache.values().cloned().collect())
    }

    fn all_files(&self) -> Result<Vec<Block>> {
        Ok(
            self
                .cache
                .values()
                .filter(|b| matches!(b.kind, BlockKind::File(_)))
                .cloned()
                .collect(),
        )
    }

    fn all_channels(&self) -> Result<Vec<Block>> {
        Ok(
            self
                .cache
                .values()
                .filter(|b| matches!(b.kind, BlockKind::Channel(_)))
                .cloned()
                .collect(),
        )
    }

    fn get(&self, id: u64) -> Result<Block> {
        self
            .cache
            .get(&id)
            .cloned()
            .ok_or(AppError::BlockNotFound(id))
    }

    fn save(&mut self, block: &Block) -> Result<()> {
        storage::save_block(block, &self.data_dir, &mut self.cache)
    }

    fn delete(&mut self, id: u64) -> Result<()> {
        if !self.cache.contains_key(&id) {
            return Err(AppError::BlockNotFound(id));
        }
        let path = self.blocks_dir().join(format!("{}.json", id));
        if path.exists() {
            fs::remove_file(path)?;
        }
        self.cache.remove(&id);
        Ok(())
    }
}
