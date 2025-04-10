// src/hooks/useChannels.ts
import { useState } from "react";
import { ChannelService } from "../services";
import { Block } from "../types";

export function useChannels() {
  const [isLoading, setIsLoading] = useState(false);
  const channelService = new ChannelService();

  const getAllChannels = async (): Promise<Block[]> => {
    setIsLoading(true);
    try {
      return await channelService.getAllChannels();
    } catch (error) {
      console.error("Failed to get all channels:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const createChannel = async (
    title: string,
    description: string,
  ): Promise<Block | null> => {
    setIsLoading(true);
    try {
      return await channelService.createChannel(title, description);
    } catch (error) {
      console.error("Failed to create channel:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getBlocksInChannel = async (channelId: number): Promise<Block[]> => {
    setIsLoading(true);
    try {
      return await channelService.getBlocksInChannel(channelId);
    } catch (error) {
      console.error(`Failed to get blocks in channel ${channelId}:`, error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    getAllChannels,
    createChannel,
    getBlocksInChannel,
  };
}
