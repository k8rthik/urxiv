import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Block } from "../types";
import { format } from "date-fns";

interface BlockBrowserProps {
  blocks?: Block[];
  blockType?: string; // Filter by block type ("annotation", "text", etc.)
  title?: string;
  emptyMessage?: string;
  onSelectBlock?: (block: Block) => void;
}

const BlockBrowser: React.FC<BlockBrowserProps> = ({
  blocks: initialBlocks,
  blockType,
  title = "Blocks",
  emptyMessage = "No blocks found",
  onSelectBlock,
}) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Load blocks if not provided
  useEffect(() => {
    const loadBlocks = async () => {
      // If blocks were provided directly, use those
      if (initialBlocks) {
        setBlocks(initialBlocks);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get all blocks
        let allBlocks = await window.__TAURI__.invoke("get_all_blocks");

        // Filter by block type if specified
        if (blockType) {
          allBlocks = allBlocks.filter(
            (block) => block.block_type === blockType,
          );
        }

        setBlocks(allBlocks);
      } catch (err) {
        console.error("Error loading blocks:", err);
        setError("Failed to load blocks");
      } finally {
        setLoading(false);
      }
    };

    loadBlocks();
  }, [initialBlocks, blockType]);

  // Filter blocks by search term
  const filteredBlocks = blocks.filter((block) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();

    // Search in different fields based on block type
    if (block.block_type === "annotation") {
      const text = (block.content.text || "").toString().toLowerCase();
      const selectedText = (block.content.selected_text || "")
        .toString()
        .toLowerCase();
      const fileName = (block.content.source_file_name || "")
        .toString()
        .toLowerCase();

      return (
        text.includes(searchLower) ||
        selectedText.includes(searchLower) ||
        fileName.includes(searchLower)
      );
    } else if (block.block_type === "text") {
      return (block.content.text || "")
        .toString()
        .toLowerCase()
        .includes(searchLower);
    } else if (block.block_type === "channel") {
      const title = (block.content.title || "").toString().toLowerCase();
      const description = (block.content.description || "")
        .toString()
        .toLowerCase();

      return title.includes(searchLower) || description.includes(searchLower);
    }

    // Generic search for other block types
    return JSON.stringify(block.content).toLowerCase().includes(searchLower);
  });

  // Sort blocks by creation date (newest first)
  const sortedBlocks = [...filteredBlocks].sort((a, b) => {
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  // Handle block selection
  const handleSelectBlock = (block: Block) => {
    if (onSelectBlock) {
      onSelectBlock(block);
    }
  };

  // Render the appropriate content for each block type
  const renderBlockContent = (block: Block) => {
    switch (block.block_type) {
      case "annotation":
        return (
          <div>
            {block.content.selected_text && (
              <div className="mb-2 text-xs bg-zinc-800 p-2 rounded italic text-zinc-300">
                "{block.content.selected_text}"
              </div>
            )}
            <div className="text-sm">{block.content.text}</div>
            {block.content.source_file_name && (
              <div className="mt-1 text-xs text-zinc-500">
                From: {block.content.source_file_name}
                {block.content.position && (
                  <span>
                    {" "}
                    •{" "}
                    {block.content.file_type === "pdf"
                      ? `Page ${block.content.position}`
                      : `Line ${block.content.position}`}
                  </span>
                )}
              </div>
            )}
          </div>
        );

      case "text":
        return (
          <div className="text-sm whitespace-pre-wrap">
            {block.content.text}
          </div>
        );

      case "channel":
        return (
          <div>
            <div className="text-sm font-medium">{block.content.title}</div>
            {block.content.description && (
              <div className="text-xs text-zinc-400 mt-1">
                {block.content.description}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-sm text-zinc-400">Unsupported block type</div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-xl mb-4">{title}</h2>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white"
          />
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Block list */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-zinc-500">Loading...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-red-500">{error}</div>
        ) : sortedBlocks.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-zinc-500">{emptyMessage}</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {sortedBlocks.map((block) => (
              <div
                key={block.id}
                className="p-4 hover:bg-zinc-900/30 transition-colors cursor-pointer"
                onClick={() => handleSelectBlock(block)}
              >
                {renderBlockContent(block)}

                {/* Footer metadata */}
                <div className="flex justify-between mt-2 text-xs text-zinc-500">
                  <span>{block.block_type}</span>
                  <span>
                    {format(new Date(block.updated_at), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockBrowser;
