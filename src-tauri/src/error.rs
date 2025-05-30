use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error, Serialize)]
pub enum AppError {
    #[error("No workspace selected")] 
    NoWorkspaceSelected,
    #[error("Block {0} not found")]
    BlockNotFound(u64),
    #[error("Block {0} is not a channel")]
    NotAChannel(u64),
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    SerdeJson(#[from] serde_json::Error),
    #[error(transparent)]
    Other(#[from] anyhow::Error),
}

pub type Result<T> = std::result::Result<T, AppError>;
