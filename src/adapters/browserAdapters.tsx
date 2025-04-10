// src/adapters/browserAdapters.ts
import React from "react";
import { Block } from "../types";
import { BrowserItem, BlockToBrowserItemConverter } from "../types/browser";
import { File, FileCode, FileText, BookOpen, Hash } from "lucide-react";

// Convert a file block to a browser item
export const fileBlockToBrowserItem: BlockToBrowserItemConverter = (
  block: Block,
): BrowserItem => {
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

  return {
    id: block.id,
    title: block.content.filename || `File ${block.id}`,
    subtitle: block.content.path || "",
    type: block.content.file_type || "file",
    icon: getFileIcon(block.content.file_type),
    createdAt: block.created_at,
    updatedAt: block.updated_at,
    metadata: {
      fullPath: block.content.full_path,
      ...block.content,
    },
  };
};

// Convert a channel block to a browser item
export const channelBlockToBrowserItem: BlockToBrowserItemConverter = (
  block: Block,
): BrowserItem => {
  return {
    id: block.id,
    title: block.content.title || `Channel ${block.id}`,
    subtitle: block.content.description || "",
    type: "channel",
    icon: <Hash className="text-zinc-400" />,
    createdAt: block.created_at,
    updatedAt: block.updated_at,
    metadata: { ...block.content },
  };
};

// Generic block to browser item
export const blockToBrowserItem: BlockToBrowserItemConverter = (
  block: Block,
): BrowserItem => {
  if (block.block_type === "file") {
    return fileBlockToBrowserItem(block);
  } else if (block.block_type === "channel") {
    return channelBlockToBrowserItem(block);
  }

  // Default fallback for other block types
  return {
    id: block.id,
    title: `Block ${block.id}`,
    subtitle: `Type: ${block.block_type}`,
    type: block.block_type,
    createdAt: block.created_at,
    updatedAt: block.updated_at,
    metadata: { ...block.content },
  };
};
