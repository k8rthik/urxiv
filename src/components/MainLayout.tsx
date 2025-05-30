import React, { useState } from "react";
import { Block, ViewType, FileFilter } from "../types";
import { SearchResult } from "../types/search";
import { useTauri } from "../context/TauriContext";
import Navigation from "./Navigation";
import Sidebar from "./Sidebar";
import ContentArea from "./ContentArea";
import NewChannelModal from "./NewChannelModal";

interface MainLayoutProps {
  initialFiles: Block[];
}

const MainLayout: React.FC<MainLayoutProps> = ({ initialFiles }) => {
  const { getAllBlocks } = useTauri();
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [showNewChannelForm, setShowNewChannelForm] = useState(false);
  const [view, setView] = useState<ViewType>("files");
  const [filter, setFilter] = useState<FileFilter>("all");

  const handleSearchResultClick = async (result: SearchResult) => {
    // Navigate to the appropriate view based on result type
    if (result.type === "channel") {
      setSelectedChannelId(result.id);
      setView("channel");
    } else if (result.type === "file") {
      setView("files");
      setFilter("all"); // Show all files to ensure the selected file is visible
    } else if (result.type === "block") {
      try {
        const blocks = await getAllBlocks();
        const block = blocks.find(b => b.id === result.id);
        if (block?.block_type === "channel") {
          setSelectedChannelId(result.id);
          setView("channel");
        } else {
          setView("blocks");
          setFilter("all");
        }
      } catch (error) {
        console.error("Failed to load blocks for navigation:", error);
      }
    }
  };

  const handleChannelClick = (channelId: number) => {
    setSelectedChannelId(channelId);
    setView("channel");
  };

  const handleBlockClick = async (blockId: number) => {
    try {
      const blocks = await getAllBlocks();
      const clickedBlock = blocks.find((block) => block.id === blockId);
      if (clickedBlock && clickedBlock.block_type === "channel") {
        setSelectedChannelId(blockId);
        setView("channel");
      }
    } catch (error) {
      console.error("Failed to handle block click:", error);
    }
  };

  const handleChannelCreated = (newChannel: Block) => {
    setSelectedChannelId(newChannel.id);
    setView("channel");
    setShowNewChannelForm(false);
  };

  const handleChannelUpdated = () => {
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

  const handleHomeClick = () => {
    setView("files");
    setFilter("all");
    setSelectedChannelId(null);
  };

  return (
    <div className="h-screen px-5 bg-black text-white flex flex-col overflow-hidden">
      <Navigation
        onSearchResultClick={handleSearchResultClick}
        onNewChannelClick={() => setShowNewChannelForm(true)}
        onHomeClick={handleHomeClick}
      />

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
          <ContentArea
            view={view}
            filter={filter}
            selectedChannelId={selectedChannelId}
            onChannelClick={handleChannelClick}
            onBlockClick={handleBlockClick}
            onChannelUpdated={handleChannelUpdated}
          />
        </div>
      </div>

      {/* New Channel Modal */}
      <NewChannelModal
        isOpen={showNewChannelForm}
        onClose={() => setShowNewChannelForm(false)}
        onChannelCreated={handleChannelCreated}
      />
    </div>
  );
};

export default MainLayout;
