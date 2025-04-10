// src/context/TauriContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  TauriService,
  WorkspaceService,
  BlockService,
  ChannelService,
  FileService,
} from "../services";
import { Block } from "../types";

// Define the context interface to match the existing one
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
  openFile: (filePath: string) => Promise<boolean>;
}

const TauriContext = createContext<TauriContextType | undefined>(undefined);

export const TauriProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Initialize services
  const tauriService = TauriService.getInstance();
  const workspaceService = new WorkspaceService();
  const blockService = new BlockService();
  const channelService = new ChannelService();
  const fileService = new FileService();

  // State management
  const [isReady, setIsReady] = useState(false);
  const [hasWorkspace, setHasWorkspace] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Tauri
  useEffect(() => {
    const initTauri = async () => {
      try {
        const initialized = await tauriService.initialize();
        setIsReady(initialized);
        if (initialized) {
          checkWorkspaceStatus();
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to initialize Tauri:", err);
        setIsLoading(false);
      }
    };

    initTauri();
  }, []);

  // Check workspace status
  const checkWorkspaceStatus = async () => {
    try {
      setIsLoading(true);
      const status = await workspaceService.getWorkspaceStatus();
      setHasWorkspace(status);
    } catch (error) {
      console.error("Failed to check workspace status:", error);
      setHasWorkspace(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Context value - wraps service calls to maintain the same interface
  const contextValue: TauriContextType = {
    isReady,
    hasWorkspace,
    isLoading,

    // Workspace functions
    selectWorkspace: async () => {
      setIsLoading(true);
      try {
        const selected = await workspaceService.selectWorkspace();
        if (selected) {
          setHasWorkspace(true);
        }
      } catch (error) {
        console.error("Failed to select workspace:", error);
      } finally {
        setIsLoading(false);
      }
    },

    indexWorkspace: async () => {
      setIsLoading(true);
      try {
        const files = await workspaceService.indexWorkspace();
        return files;
      } catch (error) {
        console.error("Failed to index workspace:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },

    // Block functions
    getAllBlocks: async () => {
      try {
        return await blockService.getAllBlocks();
      } catch (error) {
        console.error("Failed to get all blocks:", error);
        return [];
      }
    },

    getBlock: async (blockId: number) => {
      try {
        return await blockService.getBlock(blockId);
      } catch (error) {
        console.error(`Failed to get block ${blockId}:`, error);
        throw error;
      }
    },

    updateBlockContent: async (blockId: number, content: any) => {
      try {
        return await blockService.updateBlockContent(blockId, content);
      } catch (error) {
        console.error(`Failed to update block ${blockId}:`, error);
        throw error;
      }
    },

    deleteBlock: async (blockId: number) => {
      try {
        await blockService.deleteBlock(blockId);
      } catch (error) {
        console.error(`Failed to delete block ${blockId}:`, error);
        throw error;
      }
    },

    connectBlocks: async (sourceId: number, targetId: number) => {
      try {
        await blockService.connectBlocks(sourceId, targetId);
      } catch (error) {
        console.error(
          `Failed to connect blocks ${sourceId} and ${targetId}:`,
          error,
        );
        throw error;
      }
    },

    disconnectBlocks: async (sourceId: number, targetId: number) => {
      try {
        await blockService.disconnectBlocks(sourceId, targetId);
      } catch (error) {
        console.error(
          `Failed to disconnect blocks ${sourceId} and ${targetId}:`,
          error,
        );
        throw error;
      }
    },

    // Channel functions
    getAllChannels: async () => {
      try {
        return await channelService.getAllChannels();
      } catch (error) {
        console.error("Failed to get all channels:", error);
        return [];
      }
    },

    createChannel: async (title: string, description: string) => {
      try {
        const channel = await channelService.createChannel(title, description);
        if (channel) {
          return channel;
        }
        throw new Error("Failed to create channel");
      } catch (error) {
        console.error("Failed to create channel:", error);
        throw error;
      }
    },

    getBlocksInChannel: async (channelId: number) => {
      try {
        return await channelService.getBlocksInChannel(channelId);
      } catch (error) {
        console.error(`Failed to get blocks in channel ${channelId}:`, error);
        return [];
      }
    },

    // File functions
    getAllFiles: async () => {
      try {
        return await fileService.getAllFiles();
      } catch (error) {
        console.error("Failed to get all files:", error);
        return [];
      }
    },

    openFile: async (filePath: string) => {
      try {
        return await fileService.openFile(filePath);
      } catch (error) {
        console.error("Failed to open file:", error);
        return false;
      }
    },
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
