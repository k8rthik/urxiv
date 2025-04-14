// src-tauri/src/lib.rs
mod app_state;
mod commands;
mod domain;
mod errors;
mod repositories;
mod services;
mod storage;

use app_state::AppState;
use repositories::block_repository::FileSystemBlockRepository;
use repositories::workspace_repository::FileSystemWorkspaceRepository;
use services::block_service::BlockService;
use services::workspace_service::WorkspaceService;
use std::sync::Arc;
use storage::FileSystemStorage;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Set up app data directory
            let app_data_dir = app
                .app_handle()
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            if !app_data_dir.exists() {
                std::fs::create_dir_all(&app_data_dir)
                    .expect("Failed to create app data directory");
            }

            // Create storage
            let app_storage = Arc::new(FileSystemStorage::new(app_data_dir.clone()));

            // Initialize storage directories
            let blocks_dir = app_data_dir.join("blocks");
            if !blocks_dir.exists() {
                std::fs::create_dir_all(&blocks_dir).expect("Failed to create blocks directory");
            }

            // Create repositories
            let block_repository = Arc::new(FileSystemBlockRepository::new(app_storage.clone()));
            let workspace_repository =
                Arc::new(FileSystemWorkspaceRepository::new(app_storage.clone()));

            // Create services
            let block_service = Arc::new(
                BlockService::new(block_repository).expect("Failed to initialize block service"),
            );

            let workspace_service = Arc::new(WorkspaceService::new(
                workspace_repository,
                block_service.clone(),
                app_storage.clone(),
            ));

            // Create app state
            let app_state = AppState::new(block_service, workspace_service);

            // Make state available to the application
            app.manage(app_state);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::block_commands::get_all_blocks,
            commands::block_commands::get_all_files,
            commands::block_commands::get_all_channels,
            commands::block_commands::create_channel,
            commands::block_commands::get_block,
            commands::block_commands::get_blocks_in_channel,
            commands::block_commands::connect_blocks,
            commands::block_commands::disconnect_blocks,
            commands::block_commands::delete_block,
            commands::block_commands::update_block_content,
            commands::workspace_commands::select_workspace,
            commands::workspace_commands::get_workspace_status,
            commands::workspace_commands::index_workspace_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
