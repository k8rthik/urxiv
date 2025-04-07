use models::AppState;
use tauri::Manager;
mod commands;
mod models;
mod storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Create app state
            let app_state = AppState::new();
            app.manage(app_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Workspace commands
            commands::workspace::select_workspace,
            commands::workspace::get_workspace_status,
            commands::workspace::index_workspace_files,
            // Block commands
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
            // Annotation commands - new functionality
            commands::annotation::create_annotation,
            commands::annotation::index_file,
            commands::annotation::index_directory,
            commands::annotation::get_file_content,
            commands::annotation::get_file_annotations,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
