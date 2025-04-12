// src-tauri/src/domain/block.rs
use chrono::{DateTime, Utc};
use serde::de::{self, Visitor};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BlockType {
    Channel,
    File,
}

impl BlockType {
    pub fn to_string(&self) -> String {
        match self {
            BlockType::Channel => "channel".to_string(),
            BlockType::File => "file".to_string(),
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "channel" => Some(BlockType::Channel),
            "file" => Some(BlockType::File),
            _ => None,
        }
    }
}

// Serialization implementation for BlockType
impl Serialize for BlockType {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

// Deserialization implementation for BlockType
impl<'de> Deserialize<'de> for BlockType {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct BlockTypeVisitor;

        impl<'de> Visitor<'de> for BlockTypeVisitor {
            type Value = BlockType;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a string representing a block type")
            }

            fn visit_str<E>(self, value: &str) -> Result<BlockType, E>
            where
                E: de::Error,
            {
                BlockType::from_str(value)
                    .ok_or_else(|| de::Error::custom(format!("unknown block type: {}", value)))
            }
        }

        deserializer.deserialize_str(BlockTypeVisitor)
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Block {
    pub id: u64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,

    #[serde(rename = "block_type")]
    pub block_type: BlockType,

    pub content: serde_json::Value,
    pub connections: Vec<u64>,
}

// Specialized content types
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

impl Block {
    pub fn get_channel_content(&self) -> Option<ChannelContent> {
        if self.block_type == BlockType::Channel {
            serde_json::from_value::<ChannelContent>(self.content.clone()).ok()
        } else {
            None
        }
    }

    pub fn get_file_content(&self) -> Option<FileContent> {
        if self.block_type == BlockType::File {
            serde_json::from_value::<FileContent>(self.content.clone()).ok()
        } else {
            None
        }
    }

    pub fn set_channel_content(
        &mut self,
        content: ChannelContent,
    ) -> Result<(), serde_json::Error> {
        if self.block_type == BlockType::Channel {
            self.content = serde_json::to_value(content)?;
            Ok(())
        } else {
            Err(serde_json::Error::custom("Block is not a channel"))
        }
    }

    pub fn set_file_content(&mut self, content: FileContent) -> Result<(), serde_json::Error> {
        if self.block_type == BlockType::File {
            self.content = serde_json::to_value(content)?;
            Ok(())
        } else {
            Err(serde_json::Error::custom("Block is not a file"))
        }
    }

    pub fn update_content(&mut self, content: serde_json::Value) {
        self.content = content;
        self.updated_at = Utc::now();
    }
}
