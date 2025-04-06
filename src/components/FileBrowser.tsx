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
        return <File size={18} />;
      case "epub":
        return <BookOpen size={18} />;
      case "code":
        return <FileCode size={18} />;
      case "text":
        return <FileText size={18} />;
      default:
        return <File size={18} />;
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Files</h1>
        <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
          <button
            className={`px-3 py-1.5 text-sm rounded-md ${filter === "all" ? "bg-zinc-800" : "hover:bg-zinc-900"}`}
            onClick={() => setFilter("all")}
          >
            All ({fileCounts.all})
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-md ${filter === "pdf" ? "bg-zinc-800" : "hover:bg-zinc-900"}`}
            onClick={() => setFilter("pdf")}
          >
            PDF ({fileCounts.pdf})
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-md ${filter === "epub" ? "bg-zinc-800" : "hover:bg-zinc-900"}`}
            onClick={() => setFilter("epub")}
          >
            EPUB ({fileCounts.epub})
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-md ${filter === "code" ? "bg-zinc-800" : "hover:bg-zinc-900"}`}
            onClick={() => setFilter("code")}
          >
            Code ({fileCounts.code})
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-md ${filter === "text" ? "bg-zinc-800" : "hover:bg-zinc-900"}`}
            onClick={() => setFilter("text")}
          >
            Text ({fileCounts.text})
          </button>
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <div className="text-center p-12 border border-zinc-800 rounded-md">
          <p className="text-zinc-400">
            {files.length === 0
              ? "No files have been indexed. Check your workspace directory."
              : "No files match your current filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="border border-zinc-800 rounded-md overflow-hidden hover:border-zinc-700 transition-colors cursor-pointer"
              onClick={() => handleOpenFile(file.content.full_path)}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-zinc-800 rounded-md">
                    {getFileIcon(file.content.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-1 truncate">
                      {file.content.filename}
                    </h3>
                    <p className="text-xs text-zinc-400 truncate">
                      {file.content.path}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-zinc-900 px-4 py-2 text-xs text-zinc-500 flex justify-between items-center">
                <span>{file.content.file_type.toUpperCase()}</span>
                <span>{format(new Date(file.created_at), "MMM d, yyyy")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileBrowser;
