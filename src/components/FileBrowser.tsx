import React, { useState, useMemo, useEffect } from "react";
import { File, FileCode, FileText, BookOpen } from "lucide-react";
import { Block } from "../types";
import { format } from "date-fns";

// We'll use this variable to access the Tauri shell API
let tauriShell: any = null;

interface FileBrowserProps {
  files: Block[];
}

const FileBrowser: React.FC<FileBrowserProps> = ({ files }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<
    "all" | "pdf" | "epub" | "code" | "text"
  >("all");

  // Initialize Tauri shell API
  useEffect(() => {
    if (typeof window !== "undefined" && window.__TAURI__) {
      tauriShell = {
        open: async (path: string) => {
          return window.__TAURI__.shell.open(path);
        },
      };
    }
  }, []);

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      // Apply file type filter
      if (filter !== "all" && file.content.file_type !== filter) {
        return false;
      }

      // Apply search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          file.content.filename.toLowerCase().includes(searchLower) ||
          file.content.path.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [files, searchTerm, filter]);

  // Group files by file type for the filter counts
  const fileCounts = useMemo(() => {
    const counts = {
      all: files.length,
      pdf: 0,
      epub: 0,
      code: 0,
      text: 0,
    };

    files.forEach((file) => {
      if (file.content.file_type === "pdf") counts.pdf++;
      if (file.content.file_type === "epub") counts.epub++;
      if (file.content.file_type === "code") counts.code++;
      if (file.content.file_type === "text") counts.text++;
    });

    return counts;
  }, [files]);

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

  const handleOpenFile = async (filePath: string) => {
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
      {/* Filter tabs - more subtle and cleaner */}
      <div className="border-zinc-800 px-4">
        <div className="flex items-center space-x-4">
          <button
            className={`px-4 py-3 text-sm border-b-2 ${
              filter === "all"
                ? "border-white text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            } transition-colors`}
            onClick={() => setFilter("all")}
          >
            All ({fileCounts.all})
          </button>
          <button
            className={`px-4 py-3 text-sm border-b-2 ${
              filter === "pdf"
                ? "border-white text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            } transition-colors`}
            onClick={() => setFilter("pdf")}
          >
            PDF ({fileCounts.pdf})
          </button>
          <button
            className={`px-4 py-3 text-sm border-b-2 ${
              filter === "epub"
                ? "border-white text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            } transition-colors`}
            onClick={() => setFilter("epub")}
          >
            EPUB ({fileCounts.epub})
          </button>
          <button
            className={`px-4 py-3 text-sm border-b-2 ${
              filter === "code"
                ? "border-white text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            } transition-colors`}
            onClick={() => setFilter("code")}
          >
            Code ({fileCounts.code})
          </button>
          <button
            className={`px-4 py-3 text-sm border-b-2 ${
              filter === "text"
                ? "border-white text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            } transition-colors`}
            onClick={() => setFilter("text")}
          >
            Text ({fileCounts.text})
          </button>
        </div>
      </div>

      {/* File list */}
      <div className="p-1">
        {filteredFiles.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-zinc-500 text-sm">
              {files.length === 0
                ? "No files have been indexed. Check your workspace directory."
                : "No files match your current filters."}
            </p>
          </div>
        ) : (
          <div className="w-full">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="border-b border-zinc-800 hover:bg-zinc-900/30 transition-colors cursor-pointer"
                onClick={() => handleOpenFile(file.content.full_path)}
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileBrowser;
