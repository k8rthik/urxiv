import React from "react";
import { FileText, Users, Blocks } from "lucide-react";
import { ViewType, FileFilter, BlockFilter } from "../types";

interface SidebarProps {
  view: ViewType;
  setView: (view: ViewType) => void;
  filter: FileFilter;
  setFilter: (filter: FileFilter) => void;
}

const fileFilterOptions: Array<{ id: FileFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "pdf", label: "PDF" },
  { id: "epub", label: "EPUB" },
  { id: "code", label: "Code" },
  { id: "text", label: "Text" },
];

const blockFilterOptions: Array<{ id: BlockFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "channel", label: "Channels" },
  { id: "file", label: "Files" },
];

const Sidebar: React.FC<SidebarProps> = ({
  view,
  setView,
  filter,
  setFilter,
}) => {
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

      {(() => {
        if (view === "files") {
          return (
            <>
              <div className="text-zinc-500 py-1 border-b border-zinc-800 font-medium text-sm mt-4">
                Filter
              </div>
              <ul className="text-sm">
                {fileFilterOptions.map((option) => (
                  <li
                    key={option.id}
                    className={`px-6 py-1.5 ${
                      filter === option.id
                        ? "text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <button
                      className="w-full text-left"
                      onClick={() => setFilter(option.id)}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          );
        } else if (view === "blocks") {
          return (
            <>
              <div className="py-1 text-zinc-500 border-b border-zinc-800 font-medium text-sm mt-4">
                Filter
              </div>
              <ul className="text-sm">
                {blockFilterOptions.map((option) => (
                  <li
                    key={option.id}
                    className={`px-6 py-1.5 ${
                      filter === option.id
                        ? "text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <button
                      className="w-full text-left"
                      onClick={() => setFilter(option.id)}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          );
        } else {
          return null;
        }
      })()}
    </div>
  );
};

export default Sidebar;
