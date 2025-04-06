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
    getAllFiles,
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
  const [availableFiles, setAvailableFiles] = useState<Block[]>([]);

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

    if (
      window.confirm(
        "Are you sure you want to delete this channel? This action cannot be undone.",
      )
    ) {
      try {
        await deleteBlock(channelId);
        if (onChannelUpdated) {
          onChannelUpdated();
        }
      } catch (err) {
        console.error("Failed to delete channel:", err);
        setError("Failed to delete channel");
      }
    }
  };

  const openAddFilesModal = async () => {
    try {
      // Get all files
      const allFiles = await getAllFiles();

      // Filter out files that are already in the channel
      const blockIds = blocks.map((block) => block.id);
      const filteredFiles = allFiles.filter(
        (file) => !blockIds.includes(file.id),
      );

      setAvailableFiles(filteredFiles);
      setShowAddModal(true);
    } catch (err) {
      console.error("Failed to get available files:", err);
      setError("Failed to load available files");
    }
  };

  const addFileToChannel = async (fileId: number) => {
    try {
      await connectBlocks(channelId, fileId);

      // Refresh blocks in channel
      const channelBlocks = await getBlocksInChannel(channelId);
      setBlocks(channelBlocks);

      // Close modal
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to add file to channel:", err);
      setError("Failed to add file to channel");
    }
  };

  const removeFileFromChannel = async (fileId: number) => {
    if (window.confirm("Remove this file from the channel?")) {
      try {
        await disconnectBlocks(channelId, fileId);

        // Update local state
        setBlocks(blocks.filter((block) => block.id !== fileId));
      } catch (err) {
        console.error("Failed to remove file from channel:", err);
        setError("Failed to remove file from channel");
      }
    }
  };

  const handleOpenFile = async (filePath: string) => {
    if (!tauriShell) {
      console.error("Tauri shell API is not available");
      return;
    }

    try {
      await tauriShell.open(filePath);
    } catch (error) {
      console.error("Failed to open file:", error);
    }
  };

  const getFileIcon = (fileType: string) => {
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
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-zinc-400">Loading channel...</p>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{error || "Channel not found"}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        {isEditing ? (
          <div className="space-y-4">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-sm text-xl font-medium focus:outline-none focus:border-zinc-500"
              placeholder="Channel title"
            />
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-sm text-sm focus:outline-none focus:border-zinc-500"
              placeholder="Channel description"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveChanges}
                className="flex items-center gap-1 px-3 py-1.5 bg-white text-black rounded-sm text-sm font-medium"
              >
                <Save size={14} /> Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 text-white rounded-sm text-sm"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between mb-2">
              <h1 className="text-2xl font-medium">
                {channel.content.title || "Untitled Channel"}
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-sm text-sm"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={handleDeleteChannel}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-900 hover:bg-red-800 rounded-sm text-sm"
                >
                  <X size={14} /> Delete
                </button>
              </div>
            </div>
            {channel.content.description && (
              <p className="text-zinc-400">{channel.content.description}</p>
            )}
          </div>
        )}
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-lg font-medium">Files</h2>
        <button
          onClick={openAddFilesModal}
          className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-sm text-sm"
        >
          <Plus size={14} /> Add Files
        </button>
      </div>

      {blocks.length === 0 ? (
        <div className="text-center p-8 border border-zinc-800 rounded-md">
          <p className="text-zinc-400 mb-4">This channel is empty</p>
          <button
            onClick={openAddFilesModal}
            className="px-4 py-2 bg-white text-black rounded-sm text-sm font-medium"
          >
            Add your first file
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="border border-zinc-800 rounded-md overflow-hidden hover:border-zinc-700 transition-colors group"
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => handleOpenFile(block.content.full_path)}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-zinc-800 rounded-md">
                    {getFileIcon(block.content.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-1 truncate">
                      {block.content.filename}
                    </h3>
                    <p className="text-xs text-zinc-400 truncate">
                      {block.content.path}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-zinc-900 px-4 py-2 text-xs text-zinc-500 flex justify-between items-center">
                <span>{block.content.file_type.toUpperCase()}</span>
                <button
                  onClick={() => removeFileFromChannel(block.id)}
                  className="text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Files Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-md p-6 max-w-3xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Add Files to Channel</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {availableFiles.length === 0 ? (
              <div className="text-center p-8">
                <p className="text-zinc-400">No more files available to add</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableFiles.map((file) => (
                    <div
                      key={file.id}
                      className="border border-zinc-800 p-3 rounded-md hover:bg-zinc-800 cursor-pointer transition-colors"
                      onClick={() => addFileToChannel(file.id)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="p-1.5 bg-zinc-700 rounded">
                          {getFileIcon(file.content.file_type)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-medium truncate">
                            {file.content.filename}
                          </p>
                          <p className="text-xs text-zinc-400 truncate">
                            {file.content.path}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-sm text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelView;
