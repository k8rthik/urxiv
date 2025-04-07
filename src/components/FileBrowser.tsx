import React, { useState, useEffect } from "react";
import { File, FileCode, FileText, BookOpen, ExternalLink } from "lucide-react";
import { Block } from "../types";
import { format } from "date-fns";

// We'll use this variable to access the Tauri shell and window APIs
let tauriShell: any = null;
let tauriWindow: any = null;

interface FileBrowserProps {
  files: Block[];
}

const FileBrowser: React.FC<FileBrowserProps> = ({ files }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Initialize Tauri APIs
  useEffect(() => {
    if (typeof window !== "undefined" && window.__TAURI__) {
      tauriShell = {
        open: async (path: string) => {
          return window.__TAURI__.shell.open(path);
        },
      };

      tauriWindow = window.__TAURI__.window;
    }
  }, []);

  // Apply search term filter
  const filteredBySearchFiles = files.filter((file) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        file.content.filename.toLowerCase().includes(searchLower) ||
        file.content.path.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return <File className="text-zinc-400" />;
      case "epub":
        return <BookOpen className="text-zinc-400" />;
      case "code":
        return <FileCode className="text-zinc-400" />;
      case "text":
        return <FileText className="text-zinc-400" />;
      default:
        return <File className="text-zinc-400" />;
    }
  };

  // Open file in a new window with annotation support
  const handleOpenAnnotator = async (file: Block) => {
    if (!tauriWindow) {
      console.error("Tauri window API is not available");
      return;
    }

    try {
      // Create a new window for the file annotator
      const annotatorWindow = await tauriWindow.create({
        url: `annotator.html?fileId=${file.id}`,
        title: `Annotating: ${file.content.filename}`,
        width: 1200,
        height: 800,
        center: true,
      });

      // You might want to track open windows if you need to communicate with them later
    } catch (error) {
      console.error("Failed to open annotator window:", error);
    }
  };

  // Handle opening file with system's default application
  const handleOpenExternally = async (
    event: React.MouseEvent,
    filePath: string,
  ) => {
    // Stop event propagation to prevent triggering the parent's onClick
    event.stopPropagation();

    if (!tauriShell) {
      console.error("Tauri shell API is not available");
      return;
    }

    try {
      await tauriShell.open(filePath);
    } catch (error) {
      console.error("Failed to open file:", error);
    }
  };

  return (
    <div>
      {/* Search input */}
      <div className="p-3 border-b border-zinc-800">
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-sm text-white focus:outline-none focus:border-zinc-600"
        />
      </div>

      {/* File list */}
      {filteredBySearchFiles.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-zinc-500 text-sm">
            {files.length === 0
              ? "No files have been indexed. Check your workspace directory."
              : "No files match your current filters."}
          </p>
        </div>
      ) : (
        <div className="w-full">
          {filteredBySearchFiles.map((file) => (
            <div
              key={file.id}
              className="border-b border-zinc-800 hover:bg-zinc-900/30 transition-colors cursor-pointer"
              onClick={() => handleOpenAnnotator(file)}
            >
              <div className="px-4 py-3 flex items-center gap-3">
                {getFileIcon(file.content.file_type)}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">
                    {file.content.filename}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">
                    {file.content.path}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-zinc-500">
                  <span className="text-xs uppercase">
                    {file.content.file_type}
                  </span>
                  <span className="text-xs">
                    {format(new Date(file.created_at), "MMM d, yyyy")}
                  </span>
                  <button
                    className="p-1 hover:text-white"
                    title="Open with default application"
                    onClick={(e) =>
                      handleOpenExternally(e, file.content.full_path)
                    }
                  >
                    <ExternalLink size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileBrowser;
