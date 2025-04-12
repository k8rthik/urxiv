// src-tauri/src/commands/workspace_commands.rs
use crate::app_state::AppState;
use crate::domain::block::Block;
use std::path::PathBuf;
use tauri::State;

#[tauri::command]
pub fn select_workspace(path: String, state: State<AppState>) -> Result<(), String> {
    let workspace_service = state.workspace_service();
    workspace_service
        .select_workspace(PathBuf::from(path))
        .map_err(Into::into)
}

#[tauri::command]
pub fn get_workspace_status(state: State<AppState>) -> Result<bool, String> {
    let workspace_service = state.workspace_service();
    workspace_service.has_workspace().map_err(Into::into)
}

#[tauri::command]
pub fn index_workspace_files(state: State<AppState>) -> Result<Vec<Block>, String> {
    let workspace_service = state.workspace_service();
    workspace_service
        .index_workspace_files()
        .map_err(Into::into)
}
