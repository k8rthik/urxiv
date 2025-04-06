import React, { useState, useEffect } from "react";
import { Search, Plus, Grid, List, Circle } from "lucide-react";
import { useTauri } from "../context/TauriContext";
import ChannelView from "./ChannelView";
import { Block, isChannelBlock } from "../types";
import NewChannel from "./NewChannel";
import FileBrowser from "./FileBrowser";

interface MainLayoutProps {
  initialFiles: Block[];
}

const MainLayout: React.FC<MainLayoutProps> = ({ initialFiles }) => {
  const { getAllChannels, getAllFiles } = useTauri();
  const [channels, setChannels] = useState<Block[]>([]);
  const [files, setFiles] = useState<Block[]>(initialFiles);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(
    null,
  );
  const [showNewChannelForm, setShowNewChannelForm] = useState(false);
  const [view, setView] = useState<"files" | "channel">("files");

  useEffect(() => {
    loadChannels();
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log("Search for:", searchQuery);
  };

  const handleChannelClick = (channelId: number) => {
    setSelectedChannelId(channelId);
    setView("channel");
  };

  const handleChannelCreated = (newChannel: Block) => {
    setChannels([...channels, newChannel]);
    setSelectedChannelId(newChannel.id);
    setView("channel");
  };

  return (
    <div className="px-5 bg-black text-white flex flex-col">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between">
        <div className="py-3 w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("files")}
              className="text-xl font-medium"
            >
              urXiv
            </button>
            <span className="text-zinc-400">/</span>
            <div className="flex items-center gap-1">
              <button className="text-xl font-medium">User</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-1">
              <Search size={18} />
            </button>
            <button
              className="px-2 py-1 bg-[#1A1A1A] border border-transparent hover:border-white text-xs flex items-center gap-1"
              onClick={() => setShowNewChannelForm(true)}
            >
              New channel <Plus size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Profile Header */}

        {/* Sidebar and Content */}
        <div className="flex flex-1">
          {/* Sidebar */}
          <div className="w-64 h-full border-r border-zinc-800">
            <div className="py-1 border-b border-zinc-800 font-medium text-sm">
              View
            </div>
            <ul className="text-sm">
              <li className="px-6 py-1.5 text-zinc-400 hover:text-white">
                <button className="w-full text-left">Channels</button>
              </li>
              <li className="px-6 py-1.5 text-zinc-400 hover:text-white">
                <button className="w-full text-left">Blocks</button>
              </li>
              <li
                className={`px-6 py-1.5 flex items-center gap-2 ${view === "files" ? "text-white" : "text-zinc-400 hover:text-white"}`}
              >
                <button
                  className="w-full text-left flex items-center"
                  onClick={() => setView("files")}
                >
                  <span>Files</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-auto">
            {view === "files" ? (
              <FileBrowser files={files} />
            ) : selectedChannelId ? (
              <ChannelView
                channelId={selectedChannelId}
                onChannelUpdated={loadChannels}
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
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-zinc-800 p-6 max-w-md w-full">
            <h2 className="text-xl font-medium mb-4">Create New Channel</h2>
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
