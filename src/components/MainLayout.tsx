import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, Plus, Grid, List, Circle, X } from "lucide-react";
import { useTauri } from "../context/TauriContext";
import ChannelView from "./ChannelView";
import { Block, isChannelBlock } from "../types";
import NewChannel from "./NewChannel";
import FileBrowser from "./FileBrowser";
import ChannelBrowser from "./ChannelBrowser";
import Sidebar from "./Sidebar";
import { AnimatePresence, motion } from "framer-motion";

interface MainLayoutProps {
  initialFiles: Block[];
}

interface SearchResult {
  id: number;
  type: "file" | "channel" | "block";
  title: string;
  parentTitle?: string; // For blocks, the channel they belong to
}

const MainLayout: React.FC<MainLayoutProps> = ({ initialFiles }) => {
  const { getAllChannels, getAllFiles, getBlocksInChannel, searchAllContent } =
    useTauri();
  const [channels, setChannels] = useState<Block[]>([]);
  const [files, setFiles] = useState<Block[]>(initialFiles);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(
    null,
  );
  const [showNewChannelForm, setShowNewChannelForm] = useState(false);
  const [view, setView] = useState<"files" | "channels" | "channel" | "blocks">(
    "files",
  );
  const [filter, setFilter] = useState<
    "all" | "pdf" | "epub" | "code" | "text"
  >("all");

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadChannels();
    if (initialFiles.length === 0) {
      loadFiles();
    }
  }, []);

  // Focus search input when search is opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isSearchOpen]);

  // Perform search when query changes
  useEffect(() => {
    if (searchQuery && searchQuery.length > 1) {
      performSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadChannels = async () => {
    try {
      const channelsData = await getAllChannels();
      setChannels(channelsData);
    } catch (error) {
      console.error("Failed to load channels:", error);
    }
  };

  const loadFiles = async () => {
    try {
      const filesData = await getAllFiles();
      setFiles(filesData);
    } catch (error) {
      console.error("Failed to load files:", error);
    }
  };

  // Fuzzy search implementation
  const performSearch = async (query: string) => {
    try {
      // This is where you'd call your backend search function
      // For now, we'll implement a simple front-end fuzzy search

      const results: SearchResult[] = [];

      // Search in files
      files.forEach((file) => {
        const title = file.content.title || "Untitled";
        if (fuzzyMatch(title, query)) {
          results.push({
            id: file.id,
            type: "file",
            title: title,
          });
        }
      });

      // Search in channels
      channels.forEach((channel) => {
        const title = channel.content.title || "Untitled Channel";
        if (fuzzyMatch(title, query)) {
          results.push({
            id: channel.id,
            type: "channel",
            title: title,
          });
        }

        // We'd need to load blocks for each channel to search them
        // This would be better handled by the backend
      });

      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  // Simple fuzzy matching function
  const fuzzyMatch = (text: string, query: string): boolean => {
    text = text.toLowerCase();
    query = query.toLowerCase();

    let i = 0,
      j = 0;
    while (i < text.length && j < query.length) {
      if (text[i] === query[j]) {
        j++;
      }
      i++;
    }

    return j === query.length;
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  const handleSearchResultClick = (result: SearchResult) => {
    if (result.type === "channel") {
      setSelectedChannelId(result.id);
      setView("channel");
    } else if (result.type === "file") {
      // Handle file click - perhaps open it or go to file view
      setView("files");
      // You might want to highlight the selected file
    } else if (result.type === "block") {
      // Handle block click - perhaps go to the channel and scroll to block
      setSelectedChannelId(Number(result.parentTitle)); // This assumes parentTitle is the channel ID
      setView("channel");
      // You'd need to set up a way to scroll to the specific block
    }

    // Close search
    setIsSearchOpen(false);
  };

  const handleChannelClick = (channelId: number) => {
    setSelectedChannelId(channelId);
    setView("channel");
  };

  const handleChannelCreated = (newChannel: Block) => {
    loadChannels(); // Reload channels to ensure we have the latest data
    setSelectedChannelId(newChannel.id);
    setView("channel");
  };

  // Calculate file counts for the sidebar
  const fileCounts = useMemo(() => {
    const counts = {
      all: files.length,
      pdf: 0,
      epub: 0,
      code: 0,
      text: 0,
    };

    files.forEach((file) => {
      if (file.content.file_type === "pdf") counts.pdf++;
      if (file.content.file_type === "epub") counts.epub++;
      if (file.content.file_type === "code") counts.code++;
      if (file.content.file_type === "text") counts.text++;
    });

    return counts;
  }, [files]);

  // Filter files based on the selected filter
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      // Apply file type filter
      if (filter !== "all" && file.content.file_type !== filter) {
        return false;
      }
      return true;
    });
  }, [files, filter]);

  const handleChannelUpdated = () => {
    loadChannels();
    // If the channel was deleted, go back to channels view
    if (view === "channel") {
      setView("channels");
      setSelectedChannelId(null);
    }
  };

  const handleViewChange = (
    newView: "files" | "channels" | "channel" | "blocks",
  ) => {
    setView(newView);
    // If switching away from channel view, clear the selected channel
    if (newView !== "channel") {
      setSelectedChannelId(null);
    }
  };

  // Toggle new channel form
  const toggleNewChannelForm = () => {
    setShowNewChannelForm(!showNewChannelForm);
  };

  return (
    <div className="px-5 bg-black text-white flex flex-col">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between">
        <div className="py-3 w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewChange("files")}
              className="text-xl font-serif font-bold"
            >
              urXiv
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-5 relative flex items-center">
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
                            onClick={() => handleSearchResultClick(result)}
                          >
                            <div className="flex items-center">
                              {result.type === "file" && (
                                <File
                                  size={14}
                                  className="mr-2 text-zinc-400"
                                />
                              )}
                              {result.type === "channel" && (
                                <List
                                  size={14}
                                  className="mr-2 text-zinc-400"
                                />
                              )}
                              {result.type === "block" && (
                                <Square
                                  size={14}
                                  className="mr-2 text-zinc-400"
                                />
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

            <button
              className="px-2 py-1 bg-[#1A1A1A] border border-transparent hover:border-white text-xs flex items-center gap-1"
              onClick={toggleNewChannelForm}
            >
              New channel <Plus size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Sidebar and Content */}
        <div className="flex flex-1">
          {/* Sidebar */}
          <div className="h-lvh">
            <Sidebar
              view={view}
              setView={handleViewChange}
              filter={filter}
              setFilter={setFilter}
              fileCounts={fileCounts}
              showFileFilters={view === "files"}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-auto">
            {view === "files" ? (
              <FileBrowser files={filteredFiles} />
            ) : view === "channels" ? (
              <ChannelBrowser onChannelClick={handleChannelClick} />
            ) : view === "blocks" ? (
              <BlockBrowser
                blockType="annotation"
                title="Annotations"
                emptyMessage="No annotations yet"
              />
            ) : selectedChannelId ? (
              <ChannelView
                channelId={selectedChannelId}
                onChannelUpdated={handleChannelUpdated}
              />
            ) : (
              <div className="p-8 text-center">
                <p className="text-zinc-400 text-sm">
                  Select a channel to view its contents
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Channel Modal */}
      {showNewChannelForm && (
        <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-zinc-800 p-6 max-w-md w-full shadow-[0_0_20px_rgba(255,255,255,0.15)]">
            <NewChannel
              onChannelCreated={handleChannelCreated}
              onCancel={() => setShowNewChannelForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
