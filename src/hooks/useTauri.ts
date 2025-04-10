// src/hooks/useTauri.ts
import { useTauriCore } from "./useTauriCore";
import { useWorkspace } from "./useWorkspace";
import { useBlocks } from "./useBlocks";
import { useChannels } from "./useChannels";
import { useFiles } from "./useFiles";

export function useTauri() {
  const core = useTauriCore();
  const workspace = useWorkspace();
  const blocks = useBlocks();
  const channels = useChannels();
  const files = useFiles();

  return {
    // Core functionality
    isReady: core.isReady,
    isInitializing: core.isInitializing,

    // Workspace functionality
    hasWorkspace: workspace.hasWorkspace,
    isLoading:
      workspace.isLoading ||
      blocks.isLoading ||
      channels.isLoading ||
      files.isLoading,
    selectWorkspace: workspace.selectWorkspace,
    indexWorkspace: workspace.indexWorkspace,

    // Block functionality
    getAllBlocks: blocks.getAllBlocks,
    getBlock: blocks.getBlock,
    updateBlockContent: blocks.updateBlockContent,
    deleteBlock: blocks.deleteBlock,
    connectBlocks: blocks.connectBlocks,
    disconnectBlocks: blocks.disconnectBlocks,

    // Channel functionality
    getAllChannels: channels.getAllChannels,
    createChannel: channels.createChannel,
    getBlocksInChannel: channels.getBlocksInChannel,

    // File functionality
    getAllFiles: files.getAllFiles,
    openFile: files.openFile,
  };
}

// Export all hooks
export * from "./useTauriCore";
export * from "./useWorkspace";
export * from "./useBlocks";
export * from "./useChannels";
export * from "./useFiles";
