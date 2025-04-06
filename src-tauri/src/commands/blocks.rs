use chrono::Utc;
use std::fs;
use std::sync::atomic::Ordering;
use tauri::State;

use crate::models::{AppState, Block};
use crate::storage;

#[tauri::command]
pub fn get_all_blocks(state: State<AppState>) -> Result<Vec<Block>, String> {
    let blocks_cache = state.blocks_cache.lock().unwrap();
    Ok(blocks_cache.values().cloned().collect())
}

#[tauri::command]
pub fn get_all_files(state: State<AppState>) -> Result<Vec<Block>, String> {
    let blocks_cache = state.blocks_cache.lock().unwrap();
    let files: Vec<Block> = blocks_cache
        .values()
        .filter(|block| block.block_type == "file")
        .cloned()
        .collect();
    Ok(files)
}

#[tauri::command]
pub fn get_all_channels(state: State<AppState>) -> Result<Vec<Block>, String> {
    let blocks_cache = state.blocks_cache.lock().unwrap();
    let channels: Vec<Block> = blocks_cache
        .values()
        .filter(|block| block.block_type == "channel")
        .cloned()
        .collect();
    Ok(channels)
}

#[tauri::command]
pub fn create_channel(
    title: String,
    description: String,
    state: State<AppState>,
) -> Result<Block, String> {
    let data_dir = match state.data_dir.lock().unwrap().clone() {
        Some(dir) => dir,
        None => return Err("No workspace selected".to_string()),
    };

    let block_id = state.next_id.fetch_add(1, Ordering::SeqCst);
    let now = Utc::now();

    let content = serde_json::json!({
        "title": title,
        "description": description
    });

    let block = Block {
        id: block_id,
        created_at: now,
        updated_at: now,
        block_type: "channel".to_string(),
        content,
        connections: Vec::new(),
    };

    let mut blocks_cache = state.blocks_cache.lock().unwrap();
    storage::save_block(&block, &data_dir, &mut blocks_cache)?;

    Ok(block)
}

#[tauri::command]
pub fn get_block(block_id: u64, state: State<AppState>) -> Result<Block, String> {
    let blocks_cache = state.blocks_cache.lock().unwrap();

    if let Some(block) = blocks_cache.get(&block_id) {
        Ok(block.clone())
    } else {
        Err(format!("Block {} not found", block_id))
    }
}

#[tauri::command]
pub fn get_blocks_in_channel(
    channel_id: u64,
    state: State<AppState>,
) -> Result<Vec<Block>, String> {
    let blocks_cache = state.blocks_cache.lock().unwrap();

    let channel = match blocks_cache.get(&channel_id) {
        Some(block) => block,
        None => return Err(format!("Channel {} not found", channel_id)),
    };

    if channel.block_type != "channel" {
        return Err(format!("Block {} is not a channel", channel_id));
    }

    let mut blocks = Vec::new();
    for &block_id in &channel.connections {
        if let Some(block) = blocks_cache.get(&block_id) {
            blocks.push(block.clone());
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
) -> Result<(), String> {
    let data_dir = match state.data_dir.lock().unwrap().clone() {
        Some(dir) => dir,
        None => return Err("No workspace selected".to_string()),
    };

    let mut blocks_cache = state.blocks_cache.lock().unwrap();

    // Verify both blocks exist
    if !blocks_cache.contains_key(&source_id) {
        return Err(format!("Source block {} not found", source_id));
    }

    if !blocks_cache.contains_key(&target_id) {
        return Err(format!("Target block {} not found", target_id));
    }

    // Update source block's connections
    let mut source_block = blocks_cache.get(&source_id).unwrap().clone();

    if !source_block.connections.contains(&target_id) {
        source_block.connections.push(target_id);
        source_block.updated_at = Utc::now();
        storage::save_block(&source_block, &data_dir, &mut blocks_cache)?;
    }

    Ok(())
}

#[tauri::command]
pub fn disconnect_blocks(
    source_id: u64,
    target_id: u64,
    state: State<AppState>,
) -> Result<(), String> {
    let data_dir = match state.data_dir.lock().unwrap().clone() {
        Some(dir) => dir,
        None => return Err("No workspace selected".to_string()),
    };

    let mut blocks_cache = state.blocks_cache.lock().unwrap();

    // Verify both blocks exist
    if !blocks_cache.contains_key(&source_id) {
        return Err(format!("Source block {} not found", source_id));
    }

    // Update source block's connections
    let mut source_block = blocks_cache.get(&source_id).unwrap().clone();

    if let Some(pos) = source_block
        .connections
        .iter()
        .position(|&id| id == target_id)
    {
        source_block.connections.remove(pos);
        source_block.updated_at = Utc::now();
        storage::save_block(&source_block, &data_dir, &mut blocks_cache)?;
    }

    Ok(())
}

#[tauri::command]
pub fn delete_block(block_id: u64, state: State<AppState>) -> Result<(), String> {
    let data_dir = match state.data_dir.lock().unwrap().clone() {
        Some(dir) => dir,
        None => return Err("No workspace selected".to_string()),
    };

    let mut blocks_cache = state.blocks_cache.lock().unwrap();

    // Verify the block exists
    if !blocks_cache.contains_key(&block_id) {
        return Err(format!("Block {} not found", block_id));
    }

    // Remove this block from all connections in other blocks
    for other_id in blocks_cache.keys().cloned().collect::<Vec<u64>>() {
        if other_id == block_id {
            continue;
        }

        let mut other_block = blocks_cache.get(&other_id).unwrap().clone();

        if let Some(pos) = other_block
            .connections
            .iter()
            .position(|&id| id == block_id)
        {
            other_block.connections.remove(pos);
            other_block.updated_at = Utc::now();
            storage::save_block(&other_block, &data_dir, &mut blocks_cache)?;
        }
    }

    // Delete the block file
    let block_path = data_dir.join("blocks").join(format!("{}.json", block_id));
    if block_path.exists() {
        fs::remove_file(block_path).map_err(|e| e.to_string())?;
    }

    // Remove from cache
    blocks_cache.remove(&block_id);

    Ok(())
}

#[tauri::command]
pub fn update_block_content(
    block_id: u64,
    new_content: serde_json::Value,
    state: State<AppState>,
) -> Result<Block, String> {
    let data_dir = match state.data_dir.lock().unwrap().clone() {
        Some(dir) => dir,
        None => return Err("No workspace selected".to_string()),
    };

    let mut blocks_cache = state.blocks_cache.lock().unwrap();

    // Verify the block exists
    if !blocks_cache.contains_key(&block_id) {
        return Err(format!("Block {} not found", block_id));
    }

    let mut block = blocks_cache.get(&block_id).unwrap().clone();

    // Update block content
    block.content = new_content;
    block.updated_at = Utc::now();

    storage::save_block(&block, &data_dir, &mut blocks_cache)?;

    Ok(block)
}
