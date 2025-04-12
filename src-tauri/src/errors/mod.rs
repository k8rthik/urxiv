// src-tauri/src/errors/mod.rs
use std::fmt;
use std::io;
use std::sync::PoisonError;
use thiserror::Error;

pub type AppResult<T> = Result<T, AppError>;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Block error: {0}")]
    BlockError(#[from] BlockError),

    #[error("Workspace error: {0}")]
    WorkspaceError(#[from] WorkspaceError),

    #[error("Storage error: {0}")]
    StorageError(#[from] StorageError),

    #[error("IO error: {0}")]
    IoError(#[from] io::Error),

    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    #[error("Unknown error: {0}")]
    Unknown(String),
}

#[derive(Debug, Error)]
pub enum BlockError {
    #[error("Block not found: {0}")]
    NotFound(u64),

    #[error("Invalid block data: {0}")]
    InvalidData(String),

    #[error("Invalid block type: {0}")]
    InvalidType(String),

    #[error("Failed to lock block cache")]
    LockError,
}

#[derive(Debug, Error)]
pub enum WorkspaceError {
    #[error("No workspace selected")]
    NoWorkspace,

    #[error("Workspace already exists: {0}")]
    AlreadyExists(String),

    #[error("Failed to lock workspace data")]
    LockError,

    #[error("Invalid workspace path: {0}")]
    InvalidPath(String),
}

#[derive(Debug, Error)]
pub enum StorageError {
    #[error("Failed to read '{0}': {1}")]
    ReadError(String, io::Error),

    #[error("Failed to write '{0}': {1}")]
    WriteError(String, io::Error),

    #[error("Failed to delete '{0}': {1}")]
    DeleteError(String, io::Error),

    #[error("Key not found: {0}")]
    KeyNotFound(String),
}

// Convert mutex poison errors to app errors
impl<T> From<PoisonError<T>> for AppError {
    fn from(_: PoisonError<T>) -> Self {
        AppError::Unknown("Thread panicked while holding a lock".to_string())
    }
}

// Implement conversion to Tauri command compatible errors
impl From<AppError> for String {
    fn from(error: AppError) -> Self {
        error.to_string()
    }
}
