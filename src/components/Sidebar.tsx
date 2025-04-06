import React from "react";
import { Block } from "../types";

interface SidebarProps {
  view: "files" | "channel";
  setView: (view: "files" | "channel") => void;
  filter: "all" | "pdf" | "epub" | "code" | "text";
  setFilter: (filter: "all" | "pdf" | "epub" | "code" | "text") => void;
  fileCounts: {
    all: number;
    pdf: number;
    epub: number;
    code: number;
    text: number;
  };
  showFileFilters: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  view,
  setView,
  filter,
  setFilter,
  fileCounts,
  showFileFilters,
}) => {
  return (
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
          className={`px-6 py-1.5 flex items-center gap-2 ${
            view === "files" ? "text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          <button
            className="w-full text-left flex items-center"
            onClick={() => setView("files")}
          >
            <span>Files</span>
          </button>
        </li>
      </ul>

      {showFileFilters && (
        <>
          <div className="py-1 border-b border-zinc-800 font-medium text-sm mt-4">
            Filter
          </div>
          <ul className="text-sm">
            <li
              className={`px-6 py-1.5 ${
                filter === "all"
                  ? "text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <button
                className="w-full text-left"
                onClick={() => setFilter("all")}
              >
                All ({fileCounts.all})
              </button>
            </li>
            <li
              className={`px-6 py-1.5 ${
                filter === "pdf"
                  ? "text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <button
                className="w-full text-left"
                onClick={() => setFilter("pdf")}
              >
                PDF ({fileCounts.pdf})
              </button>
            </li>
            <li
              className={`px-6 py-1.5 ${
                filter === "epub"
                  ? "text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <button
                className="w-full text-left"
                onClick={() => setFilter("epub")}
              >
                EPUB ({fileCounts.epub})
              </button>
            </li>
            <li
              className={`px-6 py-1.5 ${
                filter === "code"
                  ? "text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <button
                className="w-full text-left"
                onClick={() => setFilter("code")}
              >
                Code ({fileCounts.code})
              </button>
            </li>
            <li
              className={`px-6 py-1.5 ${
                filter === "text"
                  ? "text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <button
                className="w-full text-left"
                onClick={() => setFilter("text")}
              >
                Text ({fileCounts.text})
              </button>
            </li>
          </ul>
        </>
      )}
    </div>
  );
};

export default Sidebar;
