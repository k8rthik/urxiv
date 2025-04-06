use std::sync::Mutex;

mod commands;
mod models;
mod storage;

use models::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Create app state
            let app_state = AppState::new();
            app.manage(app_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::workspace::select_workspace,
            commands::workspace::get_workspace_status,
            commands::workspace::index_workspace_files,
            commands::blocks::get_all_blocks,
            commands::blocks::get_all_files,
            commands::blocks::get_all_channels,
            commands::blocks::create_channel,
            commands::blocks::get_block,
            commands::blocks::get_blocks_in_channel,
            commands::blocks::connect_blocks,
            commands::blocks::disconnect_blocks,
            commands::blocks::delete_block,
            commands::blocks::update_block_content,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
