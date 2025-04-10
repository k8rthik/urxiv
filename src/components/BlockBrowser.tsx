// src/components/BlockBrowser.tsx (refactored)
import React, { useState, useEffect } from "react";
import { Block } from "../types";
import Browser from "./common/Browser";
import { BrowserItem } from "../types/browser";
import { blockToBrowserItem } from "../adapters/browserAdapters";

// We'll use this variable to access the Tauri shell API
let tauriShell: any = null;

interface BlockBrowserProps {
  blocks: Block[];
  onBlockClick?: (blockId: number) => void;
}

const BlockBrowser: React.FC<BlockBrowserProps> = ({
  blocks,
  onBlockClick,
}) => {
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

  const handleBlockClick = async (itemId: number) => {
    if (onBlockClick) {
      onBlockClick(itemId);
    } else {
      const block = blocks.find((b) => b.id === itemId);
      if (!block) return;

      if (block.block_type === "file" && block.content.full_path) {
        await handleOpenFile(block.content.full_path);
      }
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

  // Convert blocks to browser items
  const browserItems: BrowserItem[] = blocks.map(blockToBrowserItem);

  const sortOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "alphabetical", label: "A-Z" },
    { value: "type", label: "Block Type" },
  ];

  return (
    <Browser
      items={browserItems}
      onItemClick={handleBlockClick}
      emptyMessage="No blocks have been created yet."
      searchPlaceholder="Search blocks..."
      sortOptions={sortOptions}
    />
  );
};

export default BlockBrowser;
