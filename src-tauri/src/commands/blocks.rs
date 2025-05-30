use chrono::Utc;
use serde_json::Value;
use std::fs;
use std::sync::atomic::Ordering;
use tauri::State;

use crate::error::{AppError, Result};
use crate::models::{AppState, Block, BlockKind};
use crate::repository::{BlockRepository, FileBlockRepository};
use crate::storage;

#[tauri::command]
pub fn get_all_blocks(state: State<AppState>) -> Result<Vec<Block>> {
    if let Some(repo) = &*state.repository.lock().unwrap() {
        repo.all()
    } else {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub fn get_all_files(state: State<AppState>) -> Result<Vec<Block>> {
    if let Some(repo) = &*state.repository.lock().unwrap() {
        repo.all_files()
    } else {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub fn get_all_channels(state: State<AppState>) -> Result<Vec<Block>> {
    if let Some(repo) = &*state.repository.lock().unwrap() {
        repo.all_channels()
    } else {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub fn create_channel(
    title: String,
    description: String,
    state: State<AppState>,
) -> Result<Block> {
    let mut repo_lock = state.repository.lock().unwrap();
    let repo = repo_lock.as_mut().ok_or(AppError::NoWorkspaceSelected)?;

    let block_id = state.next_id.fetch_add(1, Ordering::SeqCst);
    let block = Block::new_channel(block_id, title, description);

    repo.save(&block)?;

    Ok(block)
}

#[tauri::command]
pub fn get_block(block_id: u64, state: State<AppState>) -> Result<Block> {
    let repo_lock = state.repository.lock().unwrap();
    let repo = repo_lock.as_ref().ok_or(AppError::NoWorkspaceSelected)?;
    repo.get(block_id)
}

#[tauri::command]
pub fn get_blocks_in_channel(
    channel_id: u64,
    state: State<AppState>,
) -> Result<Vec<Block>> {
    let repo_lock = state.repository.lock().unwrap();
    let repo = repo_lock.as_ref().ok_or(AppError::NoWorkspaceSelected)?;

    let channel = repo.get(channel_id)?;

    if !matches!(channel.kind, BlockKind::Channel(_)) {
        return Err(AppError::NotAChannel(channel_id));
    }

    let mut blocks = Vec::new();
    for &block_id in &channel.connections {
        if let Ok(block) = repo.get(block_id) {
            blocks.push(block);
        }
    }

    blocks.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(blocks)
}

#[tauri::command]
pub fn connect_blocks(
    source_id: u64,
    target_id: u64,
    state: State<AppState>,
) -> Result<()> {
    let mut repo_lock = state.repository.lock().unwrap();
    let repo = repo_lock.as_mut().ok_or(AppError::NoWorkspaceSelected)?;

    // Verify both blocks exist
    let mut source_block = repo.get(source_id)?;
    repo.get(target_id)?;

    if !source_block.connections.contains(&target_id) {
        source_block.connections.push(target_id);
        source_block.updated_at = Utc::now();
        repo.save(&source_block)?;
    }

    Ok(())
}

#[tauri::command]
pub fn disconnect_blocks(
    source_id: u64,
    target_id: u64,
    state: State<AppState>,
) -> Result<()> {
    let mut repo_lock = state.repository.lock().unwrap();
    let repo = repo_lock.as_mut().ok_or(AppError::NoWorkspaceSelected)?;

    // Verify both blocks exist
    let mut source_block = repo.get(source_id)?;
    repo.get(target_id)?;

    if let Some(pos) = source_block
        .connections
        .iter()
        .position(|&id| id == target_id)
    {
        source_block.connections.remove(pos);
        source_block.updated_at = Utc::now();
        repo.save(&source_block)?;
    }

    Ok(())
}

#[tauri::command]
pub fn delete_block(block_id: u64, state: State<AppState>) -> Result<()> {
    let mut repo_lock = state.repository.lock().unwrap();
    let repo = repo_lock.as_mut().ok_or(AppError::NoWorkspaceSelected)?;

    // Verify the block exists
    repo.get(block_id)?;

    // Remove this block from all connections in other blocks
    let all_blocks = repo.all()?;
    for mut other_block in all_blocks {
        if other_block.id == block_id {
            continue;
        }

        if let Some(pos) = other_block
            .connections
            .iter()
            .position(|&id| id == block_id)
        {
            other_block.connections.remove(pos);
            other_block.updated_at = Utc::now();
            repo.save(&other_block)?;
        }
    }

    repo.delete(block_id)
}

#[tauri::command]
pub fn update_block_content(
    block_id: u64,
    new_content: Value,
    state: State<AppState>,
) -> Result<Block> {
    let mut repo_lock = state.repository.lock().unwrap();
    let repo = repo_lock.as_mut().ok_or(AppError::NoWorkspaceSelected)?;

    // Verify the block exists
    let mut block = repo.get(block_id)?;

    let new_kind: BlockKind = serde_json::from_value(new_content)?;
    block.kind = new_kind;
    block.updated_at = Utc::now();

    repo.save(&block)?;

    Ok(block)
}
