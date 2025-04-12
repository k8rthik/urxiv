// src-tauri/src/app_state.rs
use crate::services::block_service::BlockService;
use crate::services::workspace_service::WorkspaceService;
use std::sync::Arc;

pub struct AppState {
    block_service: Arc<BlockService>,
    workspace_service: Arc<WorkspaceService>,
}

impl AppState {
    pub fn new(block_service: Arc<BlockService>, workspace_service: Arc<WorkspaceService>) -> Self {
        Self {
            block_service,
            workspace_service,
        }
    }

    pub fn block_service(&self) -> Arc<BlockService> {
        self.block_service.clone()
    }

    pub fn workspace_service(&self) -> Arc<WorkspaceService> {
        self.workspace_service.clone()
    }
}
