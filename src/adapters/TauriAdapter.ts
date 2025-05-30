import { Block } from "../types";
import { handleError } from "../services/ErrorHandler";

// Type declaration for Tauri window object
declare global {
  interface Window {
    __TAURI__: {
      core: {
        invoke: (command: string, args?: Record<string, any>) => Promise<any>;
      };
      dialog: {
        open: (options: {
          directory?: boolean;
          multiple?: boolean;
          title?: string;
        }) => Promise<string | string[] | null>;
      };
      shell: {
        open: (path: string) => Promise<void>;
      };
    };
  }
}

export interface ITauriAdapter {
  // System operations
  isReady(): boolean;
  initialize(): Promise<void>;
  
  // File system operations
  openFile(path: string): Promise<void>;
  selectDirectory(title?: string): Promise<string | null>;
  
  // Backend operations
  invoke<T>(command: string, args?: Record<string, any>): Promise<T>;
  
  // Workspace operations
  getWorkspaceStatus(): Promise<boolean>;
  selectWorkspace(path: string): Promise<void>;
  indexWorkspaceFiles(): Promise<Block[]>;
  
  // Block operations
  getAllBlocks(): Promise<Block[]>;
  getAllFiles(): Promise<Block[]>;
  getAllChannels(): Promise<Block[]>;
  getBlock(blockId: number): Promise<Block>;
  getBlocksInChannel(channelId: number): Promise<Block[]>;
  createChannel(title: string, description: string): Promise<Block>;
  updateBlockContent(blockId: number, content: any): Promise<Block>;
  deleteBlock(blockId: number): Promise<void>;
  connectBlocks(sourceId: number, targetId: number): Promise<void>;
  disconnectBlocks(sourceId: number, targetId: number): Promise<void>;
}

export class TauriAdapter implements ITauriAdapter {
  private tauriInvoke: any = null;
  private tauriDialog: any = null;
  private tauriShell: any = null;
  private ready = false;

  async initialize(): Promise<void> {
    if (typeof window === "undefined") {
      throw new Error("Tauri is only available in browser environment");
    }

    if (!window.__TAURI__) {
      throw new Error("Tauri APIs are not available");
    }

    try {
      this.tauriInvoke = window.__TAURI__.core.invoke;
      this.tauriDialog = window.__TAURI__.dialog;
      this.tauriShell = window.__TAURI__.shell;
      this.ready = true;
    } catch (error) {
      handleError(error, {
        component: "TauriAdapter",
        action: "initialize",
      });
      throw error;
    }
  }

  isReady(): boolean {
    return this.ready && this.tauriInvoke !== null;
  }

  private ensureReady(): void {
    if (!this.isReady()) {
      throw new Error("Tauri adapter is not ready. Call initialize() first.");
    }
  }

  async openFile(path: string): Promise<void> {
    this.ensureReady();
    try {
      await this.tauriShell.open(path);
    } catch (error) {
      handleError(error, {
        component: "TauriAdapter",
        action: "openFile",
        metadata: { path },
      });
      throw error;
    }
  }

  async selectDirectory(title = "Select Directory"): Promise<string | null> {
    this.ensureReady();
    try {
      const result = await this.tauriDialog.open({
        directory: true,
        multiple: false,
        title,
      });
      return Array.isArray(result) ? result[0] || null : result;
    } catch (error) {
      handleError(error, {
        component: "TauriAdapter",
        action: "selectDirectory",
        metadata: { title },
      });
      throw error;
    }
  }

  async invoke<T>(command: string, args?: Record<string, any>): Promise<T> {
    this.ensureReady();
    try {
      return await this.tauriInvoke(command, args);
    } catch (error) {
      handleError(error, {
        component: "TauriAdapter",
        action: "invoke",
        metadata: { command, args },
      });
      throw error;
    }
  }

  async getWorkspaceStatus(): Promise<boolean> {
    return this.invoke<boolean>("get_workspace_status");
  }

  async selectWorkspace(path: string): Promise<void> {
    await this.invoke("select_workspace", { path });
  }

  async indexWorkspaceFiles(): Promise<Block[]> {
    return this.invoke<Block[]>("index_workspace_files");
  }

  async getAllBlocks(): Promise<Block[]> {
    return this.invoke<Block[]>("get_all_blocks");
  }

  async getAllFiles(): Promise<Block[]> {
    return this.invoke<Block[]>("get_all_files");
  }

  async getAllChannels(): Promise<Block[]> {
    return this.invoke<Block[]>("get_all_channels");
  }

  async getBlock(blockId: number): Promise<Block> {
    return this.invoke<Block>("get_block", { blockId });
  }

  async getBlocksInChannel(channelId: number): Promise<Block[]> {
    return this.invoke<Block[]>("get_blocks_in_channel", { channelId });
  }

  async createChannel(title: string, description: string): Promise<Block> {
    return this.invoke<Block>("create_channel", { title, description });
  }

  async updateBlockContent(blockId: number, newContent: any): Promise<Block> {
    return this.invoke<Block>("update_block_content", { blockId, newContent });
  }

  async deleteBlock(blockId: number): Promise<void> {
    await this.invoke("delete_block", { blockId });
  }

  async connectBlocks(sourceId: number, targetId: number): Promise<void> {
    await this.invoke("connect_blocks", { sourceId, targetId });
  }

  async disconnectBlocks(sourceId: number, targetId: number): Promise<void> {
    await this.invoke("disconnect_blocks", { sourceId, targetId });
  }
}

// Singleton instance
export const tauriAdapter = new TauriAdapter(); 