import React, { useState, useEffect } from "react";
import { Block, isChannelBlock, isFileBlock } from "../types";
import { useTauri } from "../context/TauriContext";
import { format } from "date-fns";
import {
  File,
  FileCode,
  FileText,
  BookOpen,
  Loader,
  Hash,
  Tag,
} from "lucide-react";

// We'll use this variable to access the Tauri shell API
let tauriShell: any = null;

interface BlockBrowserProps {
  blocks: Block[];
  onBlockClick?: (blockId: number) => void;
}

const BlockBrowser: React.FC<BlockBrowserProps> = ({
  blocks,
  onBlockClick,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "alphabetical" | "type">(
    "recent",
  );

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

  // Filter blocks based on search term
  const filteredBlocks = blocks.filter((block) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();

      // Search in different fields based on block type
      if (block.block_type === "channel") {
        return (
          block.content.title?.toLowerCase().includes(searchLower) ||
          block.content.description?.toLowerCase().includes(searchLower)
        );
      } else if (block.block_type === "file") {
        return (
          block.content.filename?.toLowerCase().includes(searchLower) ||
          block.content.path?.toLowerCase().includes(searchLower)
        );
      }

      // Default search in id if no matching fields
      return String(block.id).includes(searchLower);
    }
    return true;
  });

  // Sort blocks based on selected sort method
  const sortedBlocks = [...filteredBlocks].sort((a, b) => {
    if (sortBy === "recent") {
      return (
        new Date(b.updated_at || b.created_at).getTime() -
        new Date(a.updated_at || a.created_at).getTime()
      );
    } else if (sortBy === "alphabetical") {
      // Sort by title for channels, filename for files
      const nameA =
        a.block_type === "channel"
          ? a.content.title?.toLowerCase() || ""
          : a.content.filename?.toLowerCase() || "";
      const nameB =
        b.block_type === "channel"
          ? b.content.title?.toLowerCase() || ""
          : b.content.filename?.toLowerCase() || "";
      return nameA.localeCompare(nameB);
    } else {
      // Sort by type
      return a.block_type.localeCompare(b.block_type);
    }
  });

  const getBlockIcon = (block: Block) => {
    if (block.block_type === "channel") {
      return <Hash className="text-zinc-400" />;
    } else if (block.block_type === "file") {
      switch (block.content.file_type) {
        case "pdf":
          return <File className="text-zinc-400" />;
        case "epub":
          return <BookOpen className="text-zinc-400" />;
        case "code":
          return <FileCode className="text-zinc-400" />;
        case "text":
          return <FileText className="text-zinc-400" />;
        default:
          return <File className="text-zinc-400" />;
      }
    } else {
      return <Tag className="text-zinc-400" />;
    }
  };

  const getBlockName = (block: Block) => {
    if (block.block_type === "channel") {
      return block.content.title || "Untitled Channel";
    } else if (block.block_type === "file") {
      return block.content.filename || "Unnamed File";
    } else {
      return `Block ${block.id}`;
    }
  };

  const getBlockDescription = (block: Block) => {
    if (block.block_type === "channel") {
      return block.content.description || "";
    } else if (block.block_type === "file") {
      return block.content.path || "";
    } else {
      return "";
    }
  };

  const handleBlockClick = async (block: Block) => {
    if (onBlockClick) {
      onBlockClick(block.id);
    } else if (block.block_type === "file" && block.content.full_path) {
      await handleOpenFile(block.content.full_path);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-zinc-500 mr-2" size={24} />
        <span className="text-zinc-500">Loading blocks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {filteredBlocks.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-zinc-500 text-sm">
            {blocks.length === 0
              ? "No blocks have been created yet."
              : "No blocks match your current filters."}
          </p>
        </div>
      ) : (
        <div className="w-full">
          {sortedBlocks.map((block) => (
            <div
              key={block.id}
              className="border-b border-zinc-800 hover:bg-zinc-900/30 transition-colors cursor-pointer"
              onClick={() => handleBlockClick(block)}
            >
              <div className="px-4 py-3 flex items-center gap-3">
                {getBlockIcon(block)}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">
                    {getBlockName(block)}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">
                    {getBlockDescription(block)}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-zinc-500">
                  <span className="text-xs uppercase">{block.block_type}</span>
                  <span className="text-xs">
                    {format(
                      new Date(block.updated_at || block.created_at),
                      "MMM d, yyyy",
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlockBrowser;
