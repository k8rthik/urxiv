import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Grid, List, Circle } from "lucide-react";
import { useTauri } from "../context/TauriContext";
import ChannelView from "./ChannelView";
import { Block, isChannelBlock, ViewType, FileFilter } from "../types";
import NewChannel from "./NewChannel";
import FileBrowser from "./FileBrowser";
import BlockBrowser from "./BlockBrowser";
import ChannelBrowser from "./ChannelBrowser";
import Sidebar from "./Sidebar";

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log("Search for:", searchQuery);
  };

  const handleChannelClick = (channelId: number) => {
    setSelectedChannelId(channelId);
    setView("channel");
  };

  const handleBlockClick = (blockId: number) => {
    // For now, just print to console
    console.log("Block clicked:", blockId);

    // If it's a channel, navigate to channel view
    const clickedBlock = blocks.find((block) => block.id === blockId);
    if (clickedBlock && clickedBlock.block_type === "channel") {
      setSelectedChannelId(blockId);
      setView("channel");
    }
  };

  const handleChannelCreated = (newChannel: Block) => {
    loadChannels(); // Reload channels to ensure we have the latest data
    setSelectedChannelId(newChannel.id);
    setView("channel");
  };

  // Filter content based on the selected filter and current view
  const filteredContent = useMemo(() => {
    if (view === "files") {
      return files.filter((file) => {
        // Apply file type filter
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
        } else if (filter === "block") {
          return block.block_type !== "channel" && block.block_type !== "file";
        }
        return true;
      });
    }
    return [];
  }, [files, blocks, filter, view]);

  const handleChannelUpdated = () => {
    loadChannels();
    // If the channel was deleted, go back to channels view
    if (view === "channel") {
      setView("channels");
      setSelectedChannelId(null);
    }
  };

  const handleViewChange = (newView: ViewType) => {
    setView(newView);
    // Reset filter when changing views to avoid filter type mismatches
    setFilter("all");
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
            <button className="p-1">
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
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-auto">
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
