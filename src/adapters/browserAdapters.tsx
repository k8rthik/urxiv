// src/adapters/browserAdapters.ts
import React from "react";
import { Block } from "../types";
import { BrowserItem, BlockToBrowserItemConverter } from "../types/browser";
import { Hash } from "lucide-react";
import { FileIconService } from "../utils/fileIcons";

// Convert a file block to a browser item
export const fileBlockToBrowserItem: BlockToBrowserItemConverter = (
  block: Block,
): BrowserItem => {
  return {
    id: block.id,
    title: block.content.filename || `File ${block.id}`,
    subtitle: block.content.path || "",
    type: block.content.file_type || "file",
    icon: FileIconService.getIcon(block.content.file_type, 18),
    createdAt: block.created_at,
    updatedAt: block.updated_at,
    metadata: {
      fullPath: block.content.full_path,
      fileTypeConfig: FileIconService.getFileTypeConfig(block.content.file_type),
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
    metadata: { 
      connectionCount: block.connections?.length || 0,
      ...block.content 
    },
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
    metadata: { 
      blockType: block.block_type,
      connectionCount: block.connections?.length || 0,
      ...block.content 
    },
  };
};

// Adapter factory for different block types
export class BlockAdapterFactory {
  private static converters = new Map<string, BlockToBrowserItemConverter>([
    ["file", fileBlockToBrowserItem],
    ["channel", channelBlockToBrowserItem],
  ]);

  static registerConverter(blockType: string, converter: BlockToBrowserItemConverter): void {
    this.converters.set(blockType, converter);
  }

  static getConverter(blockType: string): BlockToBrowserItemConverter {
    return this.converters.get(blockType) || blockToBrowserItem;
  }

  static convertBlock(block: Block): BrowserItem {
    const converter = this.getConverter(block.block_type);
    return converter(block);
  }

  static convertBlocks(blocks: Block[]): BrowserItem[] {
    return blocks.map(block => this.convertBlock(block));
  }

  static getSupportedTypes(): string[] {
    return Array.from(this.converters.keys());
  }
}
