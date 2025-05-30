import React, { useState, useEffect } from "react";
import {
  Pencil,
  Save,
  X,
  Plus,
  File,
  FileCode,
  FileText,
  BookOpen,
  Check,
  Hash,
} from "lucide-react";
import { useTauri } from "../context/TauriContext";
import { Block } from "../types";
import { format } from "date-fns";

// We'll use this variable to access the Tauri shell API
let tauriShell: any = null;

interface ChannelViewProps {
  channelId: number;
  onChannelUpdated?: () => void;
}

const ChannelView: React.FC<ChannelViewProps> = ({
  channelId,
  onChannelUpdated,
}) => {
  const {
    isReady,
    getBlock,
    getBlocksInChannel,
    getAllBlocks,
    connectBlocks,
    disconnectBlocks,
    updateBlockContent,
    deleteBlock,
  } = useTauri();

  const [channel, setChannel] = useState<Block | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableBlocks, setAvailableBlocks] = useState<Block[]>([]);
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<number>>(
    new Set(),
  );
  const [isAddingBlocks, setIsAddingBlocks] = useState(false);

  // Initialize Tauri shell API
  useEffect(() => {
    if (typeof window !== "undefined" && window.__TAURI__) {
      tauriShell = {
        open: async (path: string) => {
          return window.__TAURI__.shell.open(path);
        },
      };
    }
  }, []);

  useEffect(() => {
    if (isReady) {
      loadChannel();
    }
  }, [channelId, isReady]);

  const loadChannel = async () => {
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
      console.error("Failed to load channel:", err);
      setError("Failed to load channel data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!channel) return;

    try {
      const newContent = {
        ...channel.content,
        title: editedTitle,
        description: editedDescription,
      };

      const updatedChannel = await updateBlockContent(channelId, newContent);
      setChannel(updatedChannel);
      setIsEditing(false);

      if (onChannelUpdated) {
        onChannelUpdated();
      }
    } catch (err) {
      console.error("Failed to update channel:", err);
      setError("Failed to save changes");
    }
  };

  const handleCancelEdit = () => {
    if (channel) {
      setEditedTitle(channel.content.title || "");
      setEditedDescription(channel.content.description || "");
    }
    setIsEditing(false);
  };

  const handleDeleteChannel = async () => {
    if (!channel) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this channel? This action cannot be undone.",
    );

    if (!confirmed) {
      return; // User cancelled, do nothing
    }

    try {
      await deleteBlock(channelId);
      if (onChannelUpdated) {
        onChannelUpdated();
      }
    } catch (err) {
      console.error("Failed to delete channel:", err);
      setError("Failed to delete channel");
    }
  };

  const openAddBlocksModal = async () => {
    try {
      // Reset selection state
      setSelectedBlockIds(new Set());
      setIsAddingBlocks(false);

      // Get all blocks
      const allBlocks = await getAllBlocks();

      // Filter out blocks that are already in the channel and exclude self
      const blockIds = blocks.map((block) => block.id);
      const filteredBlocks = allBlocks.filter(
        (block) => !blockIds.includes(block.id) && block.id !== channelId,
      );

      setAvailableBlocks(filteredBlocks);
      setShowAddModal(true);
    } catch (err) {
      console.error("Failed to get available blocks:", err);
      setError("Failed to load available blocks");
    }
  };

  const handleBlockSelect = (blockId: number) => {
    setSelectedBlockIds((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(blockId)) {
        newSelected.delete(blockId);
      } else {
        newSelected.add(blockId);
      }
      return newSelected;
    });
  };

  const addBlocksToChannel = async () => {
    if (selectedBlockIds.size === 0) return;

    try {
      setIsAddingBlocks(true);

      // Connect all selected blocks to the channel
      const promises = Array.from(selectedBlockIds).map((blockId) =>
        connectBlocks(channelId, blockId),
      );

      await Promise.all(promises);

      // Refresh blocks in channel
      const channelBlocks = await getBlocksInChannel(channelId);
      setBlocks(channelBlocks);

      // Close modal
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to add blocks to channel:", err);
      setError("Failed to add blocks to channel");
    } finally {
      setIsAddingBlocks(false);
    }
  };

  const removeBlockFromChannel = async (blockId: number) => {
    const confirmed = window.confirm("Remove this block from the channel?");
    
    if (!confirmed) {
      return; // User cancelled, do nothing
    }

    try {
      await disconnectBlocks(channelId, blockId);

      // Update local state
      setBlocks(blocks.filter((block) => block.id !== blockId));
    } catch (err) {
      console.error("Failed to remove block from channel:", err);
      setError("Failed to remove block from channel");
    }
  };

  const handleOpenBlock = async (block: Block) => {
    if (block.block_type === "file" && block.content.full_path) {
      if (!tauriShell) {
        console.error("Tauri shell API is not available");
        return;
      }

      try {
        await tauriShell.open(block.content.full_path);
      } catch (error) {
        console.error("Failed to open file:", error);
      }
    } else if (block.block_type === "channel") {
      // For channel blocks, we could navigate to the channel or show a preview
      console.log("Channel block clicked:", block.id);
    }
  };

  const getBlockIcon = (block: Block) => {
    if (block.block_type === "channel") {
      return <Hash size={18} />;
    } else if (block.block_type === "file") {
      const fileType = block.content.file_type;
      switch (fileType) {
        case "pdf":
          return <File size={18} />;
        case "epub":
          return <BookOpen size={18} />;
        case "code":
          return <FileCode size={18} />;
        case "text":
          return <FileText size={18} />;
        default:
          return <File size={18} />;
      }
    }
    return <File size={18} />;
  };

  const getBlockTitle = (block: Block) => {
    if (block.block_type === "channel") {
      return block.content.title || `Channel ${block.id}`;
    } else if (block.block_type === "file") {
      return block.content.filename || `Block ${block.id}`;
    }
    return `Block ${block.id}`;
  };

  const getBlockSubtitle = (block: Block) => {
    if (block.block_type === "channel") {
      return block.content.description || "";
    } else if (block.block_type === "file") {
      return block.content.path || "";
    }
    return `Type: ${block.block_type}`;
  };

  const getBlockType = (block: Block) => {
    if (block.block_type === "channel") {
      return "CHANNEL";
    } else if (block.block_type === "file") {
      return (block.content.file_type || "FILE").toUpperCase();
    }
    return block.block_type.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="p-7 text-center">
        <p className="text-zinc-400">Loading channel...</p>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="p-7 text-center">
        <p className="text-red-500">{error || "Channel not found"}</p>
      </div>
    );
  }

  return (
    <div className="p-7">
      <div className="mb-8">
        {isEditing ? (
          <div className="space-y-4">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full bg-transparent border border-zinc-800 outline-none text-xl font-medium px-3 py-2 focus:border-zinc-600"
              placeholder="Channel title"
            />
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full bg-transparent border border-zinc-800 outline-none text-sm px-3 py-2 focus:border-zinc-600"
              placeholder="Channel description"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveChanges}
                className="px-3 py-1.5 bg-white text-black text-xs font-medium flex items-center gap-1"
              >
                <Save size={14} /> Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 border border-zinc-800 text-white text-xs flex items-center gap-1 hover:border-zinc-600"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-xl font-medium">
                {channel.content.title || "Untitled Channel"}
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 text-xs border border-zinc-800 hover:border-zinc-600 flex items-center gap-1"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={handleDeleteChannel}
                  className="px-3 py-1.5 text-xs border border-zinc-800 hover:border-red-800 text-red-500 flex items-center gap-1"
                >
                  <X size={14} /> Delete
                </button>
                <button
                  onClick={openAddBlocksModal}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border border-zinc-800 hover:border-zinc-600"
                >
                  <Plus size={14} /> Add Blocks
                </button>
              </div>
            </div>
            {channel.content.description && (
              <p className="text-zinc-400 text-sm">
                {channel.content.description}
              </p>
            )}
          </div>
        )}
      </div>

      {blocks.length === 0 ? (
        <div className="text-center p-8 border border-zinc-800">
          <p className="text-zinc-400 mb-4 text-sm">This channel is empty</p>
          <button
            onClick={openAddBlocksModal}
            className="px-4 py-2 bg-white text-black text-xs font-medium"
          >
            Add your first block
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="w-16 h-16 border border-zinc-800 group relative flex-shrink-0 cursor-pointer hover:border-zinc-600 transition-colors"
              onClick={() => handleOpenBlock(block)}
            >
              <div className="w-full h-full p-2 flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-zinc-400">
                    {getBlockIcon(block)}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeBlockFromChannel(block.id);
                }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-800 border border-zinc-600 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
              >
                <X size={10} />
              </button>
              
              {/* Tooltip for block info */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 border border-zinc-700 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                <div className="font-medium">{getBlockTitle(block)}</div>
                <div className="text-zinc-400">{getBlockType(block)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Multi-Select Add Blocks Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-zinc-800 p-6 max-w-3xl w-full">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
              <h2 className="text-sm font-medium">Add Blocks to Channel</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {availableBlocks.length === 0 ? (
              <div className="text-center p-8">
                <p className="text-zinc-400 text-sm">
                  No more blocks available to add
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableBlocks.map((block) => (
                    <div
                      key={block.id}
                      className={`border ${
                        selectedBlockIds.has(block.id)
                          ? "border-white bg-zinc-900"
                          : "border-zinc-800 hover:border-zinc-600"
                      } p-3 cursor-pointer transition-colors relative`}
                      onClick={() => handleBlockSelect(block.id)}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`p-1.5 ${
                            selectedBlockIds.has(block.id)
                              ? "bg-white text-black"
                              : "bg-zinc-900"
                          }`}
                        >
                          {selectedBlockIds.has(block.id) ? (
                            <Check size={16} />
                          ) : (
                            getBlockIcon(block)
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-medium text-sm truncate">
                            {getBlockTitle(block)}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {getBlockSubtitle(block)}
                          </p>
                          <p className="text-xs text-zinc-400 mt-1">
                            {getBlockType(block)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-zinc-400">
                {selectedBlockIds.size} block
                {selectedBlockIds.size !== 1 ? "s" : ""} selected
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs border border-zinc-800 hover:border-zinc-600"
                >
                  Cancel
                </button>
                <button
                  onClick={addBlocksToChannel}
                  disabled={selectedBlockIds.size === 0 || isAddingBlocks}
                  className={`px-4 py-2 text-xs flex items-center gap-1 ${
                    selectedBlockIds.size > 0 && !isAddingBlocks
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  }`}
                >
                  {isAddingBlocks ? (
                    "Adding..."
                  ) : (
                    <>
                      Add {selectedBlockIds.size > 0 ? selectedBlockIds.size : ""}{" "}
                      Block
                      {selectedBlockIds.size !== 1 ? "s" : ""}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelView;
