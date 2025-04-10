import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, Plus, X } from "lucide-react";
import { useTauri } from "../context/TauriContext";
import ChannelView from "./ChannelView";
import { Block, ViewType, FileFilter } from "../types";
import NewChannel from "./NewChannel";
import FileBrowser from "./FileBrowser";
import BlockBrowser from "./BlockBrowser";
import ChannelBrowser from "./ChannelBrowser";
import Sidebar from "./Sidebar";
import { AnimatePresence, motion } from "framer-motion";

interface MainLayoutProps {
  initialFiles: Block[];
}

const MainLayout: React.FC<MainLayoutProps> = ({ initialFiles }) => {
  const { getAllChannels, getAllFiles, getAllBlocks } = useTauri();
  const [channels, setChannels] = useState<Block[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [files, setFiles] = useState<Block[]>(initialFiles);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(
    null,
  );
  const [showNewChannelForm, setShowNewChannelForm] = useState(false);
  const [view, setView] = useState<ViewType>("files");
  const [filter, setFilter] = useState<FileFilter>("all");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchResults, setSearchResults] = useState<
    Array<{
      id: number;
      type: "file" | "channel" | "block";
      title: string;
      parentTitle?: string;
    }>
  >([]);

  useEffect(() => {
    loadChannels();
    loadBlocks();
    if (initialFiles.length === 0) {
      loadFiles();
    }
  }, []);

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

  const loadBlocks = async () => {
    try {
      const blocksData = await getAllBlocks();
      setBlocks(blocksData);
    } catch (error) {
      console.error("Failed to load blocks:", error);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const formattedResults: Array<{
      id: number;
      type: "file" | "channel" | "block";
      title: string;
      parentTitle?: string;
    }> = [];

    // Search through files
    files.forEach((file) => {
      if (
        file.content.filename?.toLowerCase().includes(query) ||
        file.content.path?.toLowerCase().includes(query)
      ) {
        formattedResults.push({
          id: file.id,
          type: "file",
          title: file.content.filename || `File ${file.id}`,
          parentTitle: file.content.path,
        });
      }
    });

    // Search through channels
    channels.forEach((channel) => {
      if (
        channel.content.title?.toLowerCase().includes(query) ||
        channel.content.description?.toLowerCase().includes(query)
      ) {
        formattedResults.push({
          id: channel.id,
          type: "channel",
          title: channel.content.title || `Channel ${channel.id}`,
        });
      }
    });

    // Search through other blocks if necessary
    blocks.forEach((block) => {
      // Only include blocks that aren't already included as files or channels
      if (
        !formattedResults.some((result) => result.id === block.id) &&
        ((block.block_type === "channel" &&
          (block.content.title?.toLowerCase().includes(query) ||
            block.content.description?.toLowerCase().includes(query))) ||
          (block.block_type === "file" &&
            (block.content.filename?.toLowerCase().includes(query) ||
              block.content.path?.toLowerCase().includes(query))) ||
          String(block.id).includes(query))
      ) {
        formattedResults.push({
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
    setSearchResults(formattedResults.slice(0, 10));
  };

  const handleChannelClick = (channelId: number) => {
    setSelectedChannelId(channelId);
    setView("channel");
  };

  const handleBlockClick = (blockId: number) => {
    console.log("Block clicked:", blockId);
    const clickedBlock = blocks.find((block) => block.id === blockId);
    if (clickedBlock && clickedBlock.block_type === "channel") {
      setSelectedChannelId(blockId);
      setView("channel");
    }
  };

  const handleChannelCreated = (newChannel: Block) => {
    loadChannels();
    setSelectedChannelId(newChannel.id);
    setView("channel");
  };

  const filteredContent = useMemo(() => {
    if (view === "files") {
      return files.filter((file) => {
        if (filter !== "all" && file.content.file_type !== filter) {
          return false;
        }
        return true;
      });
    } else if (view === "blocks") {
      return blocks.filter((block) => {
        if (filter === "all") {
          return true;
        } else if (filter === "channel") {
          return block.block_type === "channel";
        } else if (filter === "file") {
          return block.block_type === "file";
        }
        return true;
      });
    }
    return [];
  }, [files, blocks, filter, view]);

  const handleChannelUpdated = () => {
    loadChannels();
    if (view === "channel") {
      setView("channels");
      setSelectedChannelId(null);
    }
  };

  const handleViewChange = (newView: ViewType) => {
    setView(newView);
    setFilter("all");
    if (newView !== "channel") {
      setSelectedChannelId(null);
    }
  };

  const toggleSearchForm = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const toggleNewChannelForm = () => {
    setShowNewChannelForm(!showNewChannelForm);
  };

  return (
    <div className="h-screen px-5 bg-black text-white flex flex-col overflow-hidden">
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
                              <File size={14} className="mr-2 text-zinc-400" />
                            )}
                            {result.type === "channel" && (
                              <List size={14} className="mr-2 text-zinc-400" />
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
              onClick={toggleSearchForm}
            >
              <Search size={18} />
            </button>
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="h-lvh">
            <Sidebar
              view={view}
              setView={handleViewChange}
              filter={filter}
              setFilter={setFilter}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            {view === "files" ? (
              <FileBrowser files={filteredContent as Block[]} />
            ) : view === "blocks" ? (
              <BlockBrowser
                blocks={filteredContent as Block[]}
                onBlockClick={handleBlockClick}
              />
            ) : view === "channels" ? (
              <ChannelBrowser onChannelClick={handleChannelClick} />
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
