// src/components/FileBrowser.tsx (refactored)
import React, { useState, useEffect } from "react";
import { Block } from "../types";
import Browser from "./common/Browser";
import { BrowserItem } from "../types/browser";
import { fileBlockToBrowserItem } from "../adapters/browserAdapters";

// We'll use this variable to access the Tauri shell API
let tauriShell: any = null;

interface FileBrowserProps {
  files: Block[];
}

const FileBrowser: React.FC<FileBrowserProps> = ({ files }) => {
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

  const handleOpenFile = async (itemId: number) => {
    const file = files.find((f) => f.id === itemId);
    if (!file) return;

    if (!tauriShell) {
      console.error("Tauri shell API is not available");
      return;
    }

    try {
      await tauriShell.open(file.content.full_path);
    } catch (error) {
      console.error("Failed to open file:", error);
    }
  };

  // Convert files to browser items
  const browserItems: BrowserItem[] = files.map(fileBlockToBrowserItem);

  const sortOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "alphabetical", label: "A-Z" },
    { value: "type", label: "File Type" },
  ];

  return (
    <Browser
      items={browserItems}
      onItemClick={handleOpenFile}
      emptyMessage="No files have been indexed. Check your workspace directory."
      searchPlaceholder="Search files..."
      sortOptions={sortOptions}
    />
  );
};

export default FileBrowser;
