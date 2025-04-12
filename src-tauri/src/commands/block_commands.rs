// src-tauri/src/commands/block_commands.rs
use crate::app_state::AppState;
use crate::domain::block::Block;
use tauri::State;

#[tauri::command]
pub fn get_all_blocks(state: State<AppState>) -> Result<Vec<Block>, String> {
    let block_service = state.block_service();
    block_service.get_all_blocks().map_err(Into::into)
}

#[tauri::command]
pub fn get_all_files(state: State<AppState>) -> Result<Vec<Block>, String> {
    let block_service = state.block_service();
    block_service.get_all_files().map_err(Into::into)
}

#[tauri::command]
pub fn get_all_channels(state: State<AppState>) -> Result<Vec<Block>, String> {
    let block_service = state.block_service();
    block_service.get_all_channels().map_err(Into::into)
}

#[tauri::command]
pub fn create_channel(
    title: String,
    description: String,
    state: State<AppState>,
) -> Result<Block, String> {
    let block_service = state.block_service();
    block_service
        .create_channel(title, description)
        .map_err(Into::into)
}

#[tauri::command]
pub fn get_block(block_id: u64, state: State<AppState>) -> Result<Block, String> {
    let block_service = state.block_service();
    block_service.get_block(block_id).map_err(Into::into)
}

#[tauri::command]
pub fn get_blocks_in_channel(
    channel_id: u64,
    state: State<AppState>,
) -> Result<Vec<Block>, String> {
    let block_service = state.block_service();
    block_service
        .get_blocks_in_channel(channel_id)
        .map_err(Into::into)
}

#[tauri::command]
pub fn connect_blocks(
    source_id: u64,
    target_id: u64,
    state: State<AppState>,
) -> Result<(), String> {
    let block_service = state.block_service();
    block_service
        .connect_blocks(source_id, target_id)
        .map_err(Into::into)
}

#[tauri::command]
pub fn disconnect_blocks(
    source_id: u64,
    target_id: u64,
    state: State<AppState>,
) -> Result<(), String> {
    let block_service = state.block_service();
    block_service
        .disconnect_blocks(source_id, target_id)
        .map_err(Into::into)
}

#[tauri::command]
pub fn delete_block(block_id: u64, state: State<AppState>) -> Result<(), String> {
    let block_service = state.block_service();
    block_service.delete_block(block_id).map_err(Into::into)
}

#[tauri::command]
pub fn update_block_content(
    block_id: u64,
    new_content: serde_json::Value,
    state: State<AppState>,
) -> Result<Block, String> {
    let block_service = state.block_service();
    block_service
        .update_block_content(block_id, new_content)
        .map_err(Into::into)
}
