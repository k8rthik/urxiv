import React, { useState, useEffect } from "react";
import { Search, Plus, Grid, List } from "lucide-react";
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
    <div className="flex h-screen flex-col bg-black text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <span className="font-bold mr-4">urXiv</span>
          <div className="relative">
            <form onSubmit={handleSearch} className="flex items-center">
              <Search size={14} className="text-zinc-400 mr-2" />
              <input
                type="text"
                placeholder="Search"
                className="bg-transparent border-none outline-none text-sm text-zinc-400 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="bg-transparent border border-zinc-700 rounded-sm px-2 py-1 text-xs flex items-center gap-1"
            onClick={() => setShowNewChannelForm(true)}
          >
            New channel <Plus size={14} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-zinc-800 flex flex-col">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-medium text-sm">Channels</h2>
            </div>

            <div className="space-y-1">
              {channels.length === 0 ? (
                <p className="text-xs text-zinc-500 px-2 py-1">
                  No channels yet
                </p>
              ) : (
                channels.map((channel) => (
                  <button
                    key={channel.id}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded ${selectedChannelId === channel.id ? "bg-zinc-800" : "hover:bg-zinc-900"}`}
                    onClick={() => handleChannelClick(channel.id)}
                  >
                    {channel.content.title || "Untitled Channel"}
                  </button>
                ))
              )}
            </div>
          </div>
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
            <div className="p-8 text-center text-zinc-500">
              Select a channel to view its contents
            </div>
          )}
        </div>
      </div>

      {/* New Channel Modal */}
      {showNewChannelForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-md p-6 w-full max-w-md">
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
