// src-tauri/src/services/block_service.rs
use crate::domain::block::{Block, BlockType, ChannelContent, FileContent};
use crate::errors::{AppError, AppResult, BlockError};
use crate::repositories::block_repository::BlockRepository;
use chrono::Utc;
use std::sync::{
    atomic::{AtomicU64, Ordering},
    Arc,
};

pub struct BlockService {
    repository: Arc<dyn BlockRepository>,
    next_id: AtomicU64,
}

impl BlockService {
    pub fn new(repository: Arc<dyn BlockRepository>) -> AppResult<Self> {
        let highest_id = repository.get_highest_id()?;
        Ok(Self {
            repository,
            next_id: AtomicU64::new(highest_id + 1),
        })
    }

    pub fn get_block(&self, id: u64) -> AppResult<Block> {
        self.repository.get(id)
    }

    pub fn get_all_blocks(&self) -> AppResult<Vec<Block>> {
        self.repository.list()
    }

    pub fn get_all_files(&self) -> AppResult<Vec<Block>> {
        self.repository.list_by_type("file")
    }

    pub fn get_all_channels(&self) -> AppResult<Vec<Block>> {
        self.repository.list_by_type("channel")
    }

    pub fn create_channel(&self, title: String, description: String) -> AppResult<Block> {
        let block_id = self.next_id.fetch_add(1, Ordering::SeqCst);
        let now = Utc::now();

        let channel_content = ChannelContent { title, description };

        let content = serde_json::to_value(channel_content)?;

        let block = Block {
            id: block_id,
            created_at: now,
            updated_at: now,
            block_type: BlockType::Channel,
            content,
            connections: Vec::new(),
        };

        self.repository.save(&block)?;

        Ok(block)
    }

    pub fn create_file_block(
        &self,
        path: String,
        filename: String,
        file_type: String,
        full_path: String,
    ) -> AppResult<Block> {
        let block_id = self.next_id.fetch_add(1, Ordering::SeqCst);
        let now = Utc::now();

        let file_content = FileContent {
            path,
            filename,
            file_type,
            full_path,
        };

        let content = serde_json::to_value(file_content)?;

        let block = Block {
            id: block_id,
            created_at: now,
            updated_at: now,
            block_type: BlockType::File,
            content,
            connections: Vec::new(),
        };

        self.repository.save(&block)?;

        Ok(block)
    }

    pub fn update_block_content(
        &self,
        block_id: u64,
        new_content: serde_json::Value,
    ) -> AppResult<Block> {
        let mut block = self.repository.get(block_id)?;

        block.content = new_content;
        block.updated_at = Utc::now();

        self.repository.save(&block)?;

        Ok(block)
    }

    pub fn delete_block(&self, block_id: u64) -> AppResult<()> {
        // First, check if the block exists
        self.repository.get(block_id)?;

        // Get all blocks to check for connections
        let all_blocks = self.repository.list()?;

        // Update connections in other blocks
        for mut other_block in all_blocks {
            if other_block.id != block_id {
                let had_connection = other_block.connections.contains(&block_id);

                if had_connection {
                    // Remove the connection
                    other_block.connections.retain(|&id| id != block_id);
                    other_block.updated_at = Utc::now();

                    // Save the updated block
                    self.repository.save(&other_block)?;
                }
            }
        }

        // Finally, delete the block
        self.repository.delete(block_id)
    }

    pub fn get_blocks_in_channel(&self, channel_id: u64) -> AppResult<Vec<Block>> {
        let channel = self.repository.get(channel_id)?;

        // Verify it's a channel
        if channel.block_type != BlockType::Channel {
            return Err(
                BlockError::InvalidType(format!("Block {} is not a channel", channel_id)).into(),
            );
        }

        let mut blocks = Vec::new();

        // Get all connected blocks
        for &block_id in &channel.connections {
            match self.repository.get(block_id) {
                Ok(block) => blocks.push(block),
                Err(_) => continue, // Skip blocks that no longer exist
            }
        }

        // Sort by updated_at
        blocks.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

        Ok(blocks)
    }

    pub fn connect_blocks(&self, source_id: u64, target_id: u64) -> AppResult<()> {
        // Verify both blocks exist
        let mut source_block = self.repository.get(source_id)?;
        self.repository.get(target_id)?; // Just to verify target exists

        // Add connection if it doesn't exist already
        if !source_block.connections.contains(&target_id) {
            source_block.connections.push(target_id);
            source_block.updated_at = Utc::now();

            // Save the updated source block
            self.repository.save(&source_block)?;
        }

        Ok(())
    }

    pub fn disconnect_blocks(&self, source_id: u64, target_id: u64) -> AppResult<()> {
        // Get the source block
        let mut source_block = self.repository.get(source_id)?;

        // Remove the connection if it exists
        if let Some(pos) = source_block
            .connections
            .iter()
            .position(|&id| id == target_id)
        {
            source_block.connections.remove(pos);
            source_block.updated_at = Utc::now();

            // Save the updated source block
            self.repository.save(&source_block)?;
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::repositories::block_repository::BlockRepository;
    use crate::storage::memory_storage::InMemoryStorage;
    use std::collections::HashMap;
    use std::sync::{Arc, Mutex};

    struct MockBlockRepository {
        blocks: Mutex<HashMap<u64, Block>>,
        highest_id: AtomicU64,
    }

    impl MockBlockRepository {
        fn new() -> Self {
            Self {
                blocks: Mutex::new(HashMap::new()),
                highest_id: AtomicU64::new(0),
            }
        }

        fn with_blocks(blocks: Vec<Block>) -> Self {
            let highest_id = blocks.iter().map(|b| b.id).max().unwrap_or(0);

            let mut repo = Self::new();
            repo.highest_id = AtomicU64::new(highest_id);

            let mut blocks_map = repo.blocks.lock().unwrap();
            for block in blocks {
                blocks_map.insert(block.id, block);
            }

            repo
        }
    }

    impl BlockRepository for MockBlockRepository {
        fn get(&self, id: u64) -> AppResult<Block> {
            let blocks = self.blocks.lock().unwrap();
            blocks
                .get(&id)
                .cloned()
                .ok_or_else(|| BlockError::NotFound(id).into())
        }

        fn list(&self) -> AppResult<Vec<Block>> {
            let blocks = self.blocks.lock().unwrap();
            let block_list = blocks.values().cloned().collect();
            Ok(block_list)
        }

        fn list_by_type(&self, block_type: &str) -> AppResult<Vec<Block>> {
            let blocks = self.blocks.lock().unwrap();
            let filtered: Vec<Block> = blocks
                .values()
                .filter(|b| b.block_type.to_string() == block_type)
                .cloned()
                .collect();
            Ok(filtered)
        }

        fn save(&self, block: &Block) -> AppResult<()> {
            let mut blocks = self.blocks.lock().unwrap();
            blocks.insert(block.id, block.clone());
            Ok(())
        }

        fn delete(&self, id: u64) -> AppResult<()> {
            let mut blocks = self.blocks.lock().unwrap();
            blocks.remove(&id);
            Ok(())
        }

        fn get_highest_id(&self) -> AppResult<u64> {
            Ok(self.highest_id.load(Ordering::SeqCst))
        }
    }

    #[test]
    fn test_create_channel() {
        let repo = Arc::new(MockBlockRepository::new());
        let service = BlockService::new(repo).unwrap();

        let channel = service
            .create_channel("Test Channel".to_string(), "Test Description".to_string())
            .unwrap();

        assert_eq!(channel.id, 1);
        assert_eq!(channel.block_type, BlockType::Channel);

        let content = channel.get_channel_content().unwrap();
        assert_eq!(content.title, "Test Channel");
        assert_eq!(content.description, "Test Description");
    }

    #[test]
    fn test_connect_blocks() {
        let channel = Block {
            id: 1,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            block_type: BlockType::Channel,
            content: serde_json::json!({
                "title": "Test Channel",
                "description": "Test Description"
            }),
            connections: Vec::new(),
        };

        let file = Block {
            id: 2,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            block_type: BlockType::File,
            content: serde_json::json!({
                "path": "test.txt",
                "filename": "test.txt",
                "file_type": "text",
                "full_path": "/test.txt"
            }),
            connections: Vec::new(),
        };

        let repo = Arc::new(MockBlockRepository::with_blocks(vec![
            channel.clone(),
            file.clone(),
        ]));

        let service = BlockService::new(repo.clone()).unwrap();

        // Connect blocks
        service.connect_blocks(1, 2).unwrap();

        // Verify connection
        let updated_channel = service.get_block(1).unwrap();
        assert!(updated_channel.connections.contains(&2));
    }
}
