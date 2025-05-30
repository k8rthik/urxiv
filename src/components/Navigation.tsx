import React from "react";
import { Plus } from "lucide-react";
import SearchBar from "./SearchBar";
import { ViewType } from "../types";
import { SearchResult } from "../types/search";

interface NavigationProps {
  onSearchResultClick: (result: SearchResult) => void;
  onNewChannelClick: () => void;
  onHomeClick: () => void;
}

const Navigation: React.FC<NavigationProps> = ({
  onSearchResultClick,
  onNewChannelClick,
  onHomeClick,
}) => {
  return (
    <header className="flex items-center justify-between">
      <div className="py-3 w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onHomeClick}
            className="text-xl font-serif font-bold hover:text-zinc-300 transition-colors"
          >
            urXiv
          </button>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar onResultClick={onSearchResultClick} />
          <button
            className="px-2 py-1 bg-[#1A1A1A] border border-transparent hover:border-white text-xs flex items-center gap-1 transition-colors"
            onClick={onNewChannelClick}
          >
            New channel <Plus size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navigation; 