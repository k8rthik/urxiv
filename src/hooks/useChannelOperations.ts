import { useState, useCallback } from "react";
import { useTauri } from "../context/TauriContext";
import { Block } from "../types";
import { handleError } from "../services/ErrorHandler";

export interface UseChannelOperationsResult {
  channel: Block | null;
  blocks: Block[];
  isLoading: boolean;
  error: string | null;
  editedTitle: string;
  editedDescription: string;
  setEditedTitle: (title: string) => void;
  setEditedDescription: (description: string) => void;
  loadChannel: () => Promise<void>;
  saveChanges: () => Promise<void>;
  deleteChannel: () => Promise<void>;
  addBlocksToChannel: (blockIds: number[]) => Promise<void>;
  removeBlockFromChannel: (blockId: number) => Promise<void>;
}

export const useChannelOperations = (
  channelId: number,
  onChannelUpdated?: () => void
): UseChannelOperationsResult => {
  const {
    isReady,
    getBlock,
    getBlocksInChannel,
    connectBlocks,
    disconnectBlocks,
    updateBlockContent,
    deleteBlock,
  } = useTauri();

  const [channel, setChannel] = useState<Block | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");

  const loadChannel = useCallback(async () => {
    if (!isReady) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load channel data
      const channelData = await getBlock(channelId);
      setChannel(channelData);
      setEditedTitle(channelData.content.title || "");
      setEditedDescription(channelData.content.description || "");

      // Load blocks in this channel
      const channelBlocks = await getBlocksInChannel(channelId);
      setBlocks(channelBlocks);
    } catch (err) {
      const appError = handleError(err, {
        component: "useChannelOperations",
        action: "loadChannel",
        metadata: { channelId },
      });
      setError(appError.message);
    } finally {
      setIsLoading(false);
    }
  }, [channelId, isReady, getBlock, getBlocksInChannel]);

  const saveChanges = useCallback(async () => {
    if (!channel) return;

    try {
      const newContent = {
        ...channel.content,
        title: editedTitle,
        description: editedDescription,
      };

      const updatedChannel = await updateBlockContent(channelId, newContent);
      setChannel(updatedChannel);

      if (onChannelUpdated) {
        onChannelUpdated();
      }
    } catch (err) {
      const appError = handleError(err, {
        component: "useChannelOperations",
        action: "saveChanges",
        metadata: { channelId },
      });
      setError(appError.message);
      throw err;
    }
  }, [channel, editedTitle, editedDescription, channelId, updateBlockContent, onChannelUpdated]);

  const deleteChannel = useCallback(async () => {
    try {
      await deleteBlock(channelId);
      if (onChannelUpdated) {
        onChannelUpdated();
      }
    } catch (err) {
      const appError = handleError(err, {
        component: "useChannelOperations",
        action: "deleteChannel",
        metadata: { channelId },
      });
      setError(appError.message);
      throw err;
    }
  }, [channelId, deleteBlock, onChannelUpdated]);

  const addBlocksToChannel = useCallback(async (blockIds: number[]) => {
    try {
      // Connect all selected blocks to the channel
      const promises = blockIds.map((blockId) => connectBlocks(channelId, blockId));
      await Promise.all(promises);

      // Refresh blocks in channel
      const channelBlocks = await getBlocksInChannel(channelId);
      setBlocks(channelBlocks);
    } catch (err) {
      const appError = handleError(err, {
        component: "useChannelOperations",
        action: "addBlocksToChannel",
        metadata: { channelId, blockIds },
      });
      setError(appError.message);
      throw err;
    }
  }, [channelId, connectBlocks, getBlocksInChannel]);

  const removeBlockFromChannel = useCallback(async (blockId: number) => {
    try {
      await disconnectBlocks(channelId, blockId);
      // Update local state
      setBlocks(blocks.filter((block) => block.id !== blockId));
    } catch (err) {
      const appError = handleError(err, {
        component: "useChannelOperations",
        action: "removeBlockFromChannel",
        metadata: { channelId, blockId },
      });
      setError(appError.message);
      throw err;
    }
  }, [channelId, blocks, disconnectBlocks]);

  return {
    channel,
    blocks,
    isLoading,
    error,
    editedTitle,
    editedDescription,
    setEditedTitle,
    setEditedDescription,
    loadChannel,
    saveChanges,
    deleteChannel,
    addBlocksToChannel,
    removeBlockFromChannel,
  };
}; 