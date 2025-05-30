import React, { useState, useEffect, useRef } from "react";
import { Search, X, File, List, Square } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Block, ViewType } from "../types";
import { SearchResult } from "../types/search";
import { useTauri } from "../context/TauriContext";

interface SearchBarProps {
  onResultClick: (result: SearchResult) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onResultClick }) => {
  const { getAllChannels, getAllFiles, getAllBlocks } = useTauri();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [data, setData] = useState<{
    files: Block[];
    channels: Block[];
    blocks: Block[];
  }>({ files: [], channels: [], blocks: [] });
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, data]);

  const loadData = async () => {
    try {
      const [filesData, channelsData, blocksData] = await Promise.all([
        getAllFiles(),
        getAllChannels(),
        getAllBlocks()
      ]);
      setData({
        files: filesData,
        channels: channelsData,
        blocks: blocksData
      });
    } catch (error) {
      console.error("Failed to load data for search:", error);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Search through files
    data.files.forEach((file) => {
      if (
        file.content.filename?.toLowerCase().includes(query) ||
        file.content.path?.toLowerCase().includes(query)
      ) {
        results.push({
          id: file.id,
          type: "file",
          title: file.content.filename || `File ${file.id}`,
          parentTitle: file.content.path,
        });
      }
    });

    // Search through channels
    data.channels.forEach((channel) => {
      if (
        channel.content.title?.toLowerCase().includes(query) ||
        channel.content.description?.toLowerCase().includes(query)
      ) {
        results.push({
          id: channel.id,
          type: "channel",
          title: channel.content.title || `Channel ${channel.id}`,
        });
      }
    });

    // Search through other blocks
    data.blocks.forEach((block) => {
      if (
        !results.some((result) => result.id === block.id) &&
        ((block.block_type === "channel" &&
          (block.content.title?.toLowerCase().includes(query) ||
            block.content.description?.toLowerCase().includes(query))) ||
          (block.block_type === "file" &&
            (block.content.filename?.toLowerCase().includes(query) ||
              block.content.path?.toLowerCase().includes(query))) ||
          String(block.id).includes(query))
      ) {
        results.push({
          id: block.id,
          type: "block",
          title:
            block.block_type === "channel"
              ? block.content.title || `Channel ${block.id}`
              : block.content.filename || `Block ${block.id}`,
          parentTitle:
            block.block_type === "file" ? block.content.path : undefined,
        });
      }
    });

    setSearchResults(results.slice(0, 10));
  };

  const handleResultClick = (result: SearchResult) => {
    onResultClick(result);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      // Focus the input when opening
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative mr-2"
          >
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channels, files, and blocks..."
              className="w-full bg-[#1A1A1A] border border-zinc-800 px-3 py-1 text-sm focus:outline-none focus:border-zinc-600"
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-400"
                onClick={() => setSearchQuery("")}
              >
                <X size={14} />
              </button>
            )}

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1 bg-[#1A1A1A] border border-zinc-800 shadow-lg z-10 max-h-80 overflow-y-auto">
                {searchResults.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="px-3 py-2 hover:bg-zinc-800 cursor-pointer"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-center">
                      {result.type === "file" && (
                        <File size={14} className="mr-2 text-zinc-400" />
                      )}
                      {result.type === "channel" && (
                        <List size={14} className="mr-2 text-zinc-400" />
                      )}
                      {result.type === "block" && (
                        <Square size={14} className="mr-2 text-zinc-400" />
                      )}
                      <div>
                        <div className="text-sm font-medium">
                          {result.title}
                        </div>
                        {result.parentTitle && (
                          <div className="text-xs text-zinc-500">
                            in {result.parentTitle}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        className={`p-1 ${isSearchOpen ? "text-white" : "text-zinc-400 hover:text-white"}`}
        onClick={toggleSearch}
      >
        <Search size={18} />
      </button>
    </div>
  );
};

export default SearchBar; 