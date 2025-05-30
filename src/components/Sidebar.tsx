import React, { useState, useEffect } from "react";
import { FileText, Users, Blocks } from "lucide-react";
import { ViewType, FileFilter, BlockFilter, Block } from "../types";
import { DynamicFilterService, FilterOption } from "../utils/dynamicFilters";
import { useTauri } from "../context/TauriContext";

interface SidebarProps {
  view: ViewType;
  setView: (view: ViewType) => void;
  filter: FileFilter;
  setFilter: (filter: FileFilter) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  view,
  setView,
  filter,
  setFilter,
}) => {
  const { getAllFiles, getAllBlocks } = useTauri();
  const [files, setFiles] = useState<Block[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [filesData, blocksData] = await Promise.all([
        getAllFiles(),
        getAllBlocks()
      ]);
      setFiles(filesData);
      setBlocks(blocksData);
    } catch (error) {
      console.error("Failed to load data for sidebar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate dynamic filter options based on current data
  const dynamicFilters = DynamicFilterService.generateDynamicFilters(files, blocks);
  
  const currentFilterOptions = view === "files" 
    ? dynamicFilters.fileTypes 
    : view === "blocks" 
    ? dynamicFilters.blockTypes 
    : [];

  // Render filter option with count
  const renderFilterOption = (option: FilterOption) => (
    <li
      key={option.id}
      className={`px-6 py-1.5 ${
        filter === option.id
          ? "text-white"
          : "text-zinc-400 hover:text-white"
      }`}
    >
      <button
        className="w-full text-left flex items-center justify-between"
        onClick={() => setFilter(option.id)}
      >
        <div className="flex items-center gap-2">
          {option.icon && <span>{option.icon}</span>}
          <span>{option.label}</span>
        </div>
        <span className="text-xs text-zinc-500">
          {option.count}
        </span>
      </button>
    </li>
  );

  return (
    <div className="w-64 h-full border-r border-zinc-800">
      <div className="py-1 border-b border-zinc-800 text-zinc-500 font-medium text-sm">
        View
      </div>
      <ul className="text-sm">
        <li
          className={`px-6 py-1.5 flex items-center gap-2 ${
            view === "channels"
              ? "text-white"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <button
            className="w-full text-left flex items-center gap-2"
            onClick={() => setView("channels")}
          >
            <Users size={16} />
            <span>Channels</span>
          </button>
        </li>
        <li
          className={`px-6 py-1.5 flex items-center gap-2 ${
            view === "blocks" ? "text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          <button
            className="w-full text-left flex items-center gap-2"
            onClick={() => setView("blocks")}
          >
            <Blocks size={16} />
            <span>Blocks</span>
          </button>
        </li>
        <li
          className={`px-6 py-1.5 flex items-center gap-2 ${
            view === "files" ? "text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          <button
            className="w-full text-left flex items-center gap-2"
            onClick={() => setView("files")}
          >
            <FileText size={16} />
            <span>Files</span>
          </button>
        </li>
      </ul>

      {/* Dynamic Filter Section */}
      {(view === "files" || view === "blocks") && !isLoading && currentFilterOptions.length > 0 && (
        <>
          <div className="text-zinc-500 py-1 border-b border-zinc-800 font-medium text-sm mt-4">
            Filter
          </div>
          <ul className="text-sm">
            {currentFilterOptions.map(renderFilterOption)}
          </ul>
        </>
      )}

      {isLoading && (
        <div className="px-6 py-2 text-xs text-zinc-500">
          Loading filters...
        </div>
      )}
    </div>
  );
};

export default Sidebar;
