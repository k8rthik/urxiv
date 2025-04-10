// src/hooks/useBlocks.ts
import { useState } from "react";
import { BlockService } from "../services";
import { Block } from "../types";

export function useBlocks() {
  const [isLoading, setIsLoading] = useState(false);
  const blockService = new BlockService();

  const getAllBlocks = async (): Promise<Block[]> => {
    setIsLoading(true);
    try {
      return await blockService.getAllBlocks();
    } catch (error) {
      console.error("Failed to get all blocks:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getBlock = async (blockId: number): Promise<Block | null> => {
    setIsLoading(true);
    try {
      return await blockService.getBlock(blockId);
    } catch (error) {
      console.error(`Failed to get block ${blockId}:`, error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateBlockContent = async (
    blockId: number,
    newContent: any,
  ): Promise<Block | null> => {
    setIsLoading(true);
    try {
      return await blockService.updateBlockContent(blockId, newContent);
    } catch (error) {
      console.error(`Failed to update block ${blockId}:`, error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBlock = async (blockId: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      await blockService.deleteBlock(blockId);
      return true;
    } catch (error) {
      console.error(`Failed to delete block ${blockId}:`, error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const connectBlocks = async (
    sourceId: number,
    targetId: number,
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      await blockService.connectBlocks(sourceId, targetId);
      return true;
    } catch (error) {
      console.error(
        `Failed to connect blocks ${sourceId} and ${targetId}:`,
        error,
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectBlocks = async (
    sourceId: number,
    targetId: number,
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      await blockService.disconnectBlocks(sourceId, targetId);
      return true;
    } catch (error) {
      console.error(
        `Failed to disconnect blocks ${sourceId} and ${targetId}:`,
        error,
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    getAllBlocks,
    getBlock,
    updateBlockContent,
    deleteBlock,
    connectBlocks,
    disconnectBlocks,
  };
}
