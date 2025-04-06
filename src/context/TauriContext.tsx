import React, { createContext, useContext, useState, useEffect } from "react";
import { Block } from "../types";
import { open } from "@tauri-apps/plugin-dialog";

// For Tauri 2.0
// We'll use these once Tauri is initialized
let tauriInvoke: any = null;
let tauriDialog: any = null;

interface TauriContextType {
  isReady: boolean;
  hasWorkspace: boolean;
  isLoading: boolean;
  selectWorkspace: () => Promise<void>;
  indexWorkspace: () => Promise<Block[]>;
  getAllBlocks: () => Promise<Block[]>;
  getAllFiles: () => Promise<Block[]>;
  getAllChannels: () => Promise<Block[]>;
  createChannel: (title: string, description: string) => Promise<Block>;
  getBlock: (blockId: number) => Promise<Block>;
  getBlocksInChannel: (channelId: number) => Promise<Block[]>;
  connectBlocks: (sourceId: number, targetId: number) => Promise<void>;
  disconnectBlocks: (sourceId: number, targetId: number) => Promise<void>;
  deleteBlock: (blockId: number) => Promise<void>;
  updateBlockContent: (blockId: number, content: any) => Promise<Block>;
}

const TauriContext = createContext<TauriContextType | undefined>(undefined);

export const TauriProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isReady, setIsReady] = useState(false);
  const [hasWorkspace, setHasWorkspace] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initTauri = async () => {
      try {
        // Dynamically import Tauri APIs to ensure they're loaded only in the browser
        if (typeof window !== "undefined") {
          console.log("Hello");
          // Check if Tauri is available
          if (window.__TAURI__) {
            console.log("Hello");
            // Access invoke directly
            tauriInvoke = window.__TAURI__.core.invoke;

            tauriDialog = window.__TAURI__.dialog;

            console.log("Dialog");
            setIsReady(true);

            // Check workspace status after Tauri is ready
            checkWorkspaceStatus();
          } else {
            console.error("Tauri is not available");
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error("Failed to initialize Tauri:", err);
        setIsLoading(false);
      }
    };

    initTauri();
  }, []);

  const checkWorkspaceStatus = async () => {
    try {
      setIsLoading(true);
      const status = await tauriInvoke("get_workspace_status");
      setHasWorkspace(status);
    } catch (error) {
      console.error("Failed to check workspace status:", error);
      setHasWorkspace(false);
    } finally {
      setIsLoading(false);
    }
  };

  const selectWorkspace = async () => {
    if (!isReady || !tauriDialog) {
      throw new Error("Tauri is not ready yet");
    }

    try {
      setIsLoading(true);
      // Open folder selection dialog
      const selected = await tauriDialog.open({
        directory: true,
        multiple: false,
        title: "Select Workspace Directory",
      });

      if (selected && !Array.isArray(selected)) {
        // Set the selected directory as workspace
        await tauriInvoke("select_workspace", { path: selected });
        setHasWorkspace(true);
      }
    } catch (error) {
      console.error("Failed to select workspace:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const indexWorkspace = async (): Promise<Block[]> => {
    if (!isReady) {
      throw new Error("Tauri is not ready yet");
    }

    try {
      setIsLoading(true);
      const files = await tauriInvoke("index_workspace_files");
      return files;
    } catch (error) {
      console.error("Failed to index workspace:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getAllBlocks = async (): Promise<Block[]> => {
    if (!isReady) {
      throw new Error("Tauri is not ready yet");
    }

    try {
      return await tauriInvoke("get_all_blocks");
    } catch (error) {
      console.error("Failed to get all blocks:", error);
      return [];
    }
  };

  const getAllFiles = async (): Promise<Block[]> => {
    if (!isReady) {
      throw new Error("Tauri is not ready yet");
    }

    try {
      return await tauriInvoke("get_all_files");
    } catch (error) {
      console.error("Failed to get all files:", error);
      return [];
    }
  };

  const getAllChannels = async (): Promise<Block[]> => {
    if (!isReady) {
      throw new Error("Tauri is not ready yet");
    }

    try {
      return await tauriInvoke("get_all_channels");
    } catch (error) {
      console.error("Failed to get all channels:", error);
      return [];
    }
  };

  const createChannel = async (
    title: string,
    description: string,
  ): Promise<Block> => {
    if (!isReady) {
      throw new Error("Tauri is not ready yet");
    }

    try {
      return await tauriInvoke("create_channel", { title, description });
    } catch (error) {
      console.error("Failed to create channel:", error);
      throw error;
    }
  };

  const getBlock = async (blockId: number): Promise<Block> => {
    if (!isReady) {
      throw new Error("Tauri is not ready yet");
    }

    try {
      return await tauriInvoke("get_block", { blockId });
    } catch (error) {
      console.error(`Failed to get block ${blockId}:`, error);
      throw error;
    }
  };

  const getBlocksInChannel = async (channelId: number): Promise<Block[]> => {
    if (!isReady) {
      throw new Error("Tauri is not ready yet");
    }

    try {
      return await tauriInvoke("get_blocks_in_channel", { channelId });
    } catch (error) {
      console.error(`Failed to get blocks in channel ${channelId}:`, error);
      return [];
    }
  };

  const connectBlocks = async (
    sourceId: number,
    targetId: number,
  ): Promise<void> => {
    if (!isReady) {
      throw new Error("Tauri is not ready yet");
    }

    try {
      await tauriInvoke("connect_blocks", { sourceId, targetId });
    } catch (error) {
      console.error(
        `Failed to connect blocks ${sourceId} and ${targetId}:`,
        error,
      );
      throw error;
    }
  };

  const disconnectBlocks = async (
    sourceId: number,
    targetId: number,
  ): Promise<void> => {
    if (!isReady) {
      throw new Error("Tauri is not ready yet");
    }

    try {
      await tauriInvoke("disconnect_blocks", { sourceId, targetId });
    } catch (error) {
      console.error(
        `Failed to disconnect blocks ${sourceId} and ${targetId}:`,
        error,
      );
      throw error;
    }
  };

  const deleteBlock = async (blockId: number): Promise<void> => {
    if (!isReady) {
      throw new Error("Tauri is not ready yet");
    }

    try {
      await tauriInvoke("delete_block", { blockId });
    } catch (error) {
      console.error(`Failed to delete block ${blockId}:`, error);
      throw error;
    }
  };

  const updateBlockContent = async (
    blockId: number,
    newContent: any,
  ): Promise<Block> => {
    if (!isReady) {
      throw new Error("Tauri is not ready yet");
    }

    try {
      return await tauriInvoke("update_block_content", {
        blockId,
        newContent,
      });
    } catch (error) {
      console.error(`Failed to update block ${blockId}:`, error);
      throw error;
    }
  };

  const contextValue: TauriContextType = {
    isReady,
    hasWorkspace,
    isLoading,
    selectWorkspace,
    indexWorkspace,
    getAllBlocks,
    getAllFiles,
    getAllChannels,
    createChannel,
    getBlock,
    getBlocksInChannel,
    connectBlocks,
    disconnectBlocks,
    deleteBlock,
    updateBlockContent,
  };

  return (
    <TauriContext.Provider value={contextValue}>
      {children}
    </TauriContext.Provider>
  );
};

export const useTauri = () => {
  const context = useContext(TauriContext);
  if (context === undefined) {
    throw new Error("useTauri must be used within a TauriProvider");
  }
  return context;
};
