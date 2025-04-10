// services/block/BlockService.ts
import TauriService from "../core/TauriService";
import { Block } from "../../types";

class BlockService {
  private tauriService: TauriService;

  constructor() {
    this.tauriService = TauriService.getInstance();
  }

  public async getAllBlocks(): Promise<Block[]> {
    try {
      return await this.tauriService.invoke<Block[]>("get_all_blocks");
    } catch (error) {
      console.error("Failed to get all blocks:", error);
      return [];
    }
  }

  public async getBlock(blockId: number): Promise<Block> {
    try {
      return await this.tauriService.invoke<Block>("get_block", { blockId });
    } catch (error) {
      console.error(`Failed to get block ${blockId}:`, error);
      throw error;
    }
  }

  public async updateBlockContent(
    blockId: number,
    newContent: any,
  ): Promise<Block> {
    try {
      return await this.tauriService.invoke<Block>("update_block_content", {
        blockId,
        newContent,
      });
    } catch (error) {
      console.error(`Failed to update block ${blockId}:`, error);
      throw error;
    }
  }

  public async deleteBlock(blockId: number): Promise<void> {
    try {
      await this.tauriService.invoke("delete_block", { blockId });
    } catch (error) {
      console.error(`Failed to delete block ${blockId}:`, error);
      throw error;
    }
  }

  public async connectBlocks(
    sourceId: number,
    targetId: number,
  ): Promise<void> {
    try {
      await this.tauriService.invoke("connect_blocks", { sourceId, targetId });
    } catch (error) {
      console.error(
        `Failed to connect blocks ${sourceId} and ${targetId}:`,
        error,
      );
      throw error;
    }
  }

  public async disconnectBlocks(
    sourceId: number,
    targetId: number,
  ): Promise<void> {
    try {
      await this.tauriService.invoke("disconnect_blocks", {
        sourceId,
        targetId,
      });
    } catch (error) {
      console.error(
        `Failed to disconnect blocks ${sourceId} and ${targetId}:`,
        error,
      );
      throw error;
    }
  }
}

export default BlockService;
