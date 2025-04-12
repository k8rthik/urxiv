// Core Block Types
export enum BlockType {
  FILE = "file",
  CHANNEL = "channel",
  // Easy to extend with new types
}

// Base Block interface
export interface BaseBlock {
  id: number;
  created_at: string;
  updated_at: string;
  block_type: BlockType;
  connections: number[]; // IDs of blocks connected to this one
}

// File-specific content
export interface FileBlockContent {
  path: string;
  filename: string;
  file_type: FileType;
  full_path: string;
}

// Channel-specific content
export interface ChannelBlockContent {
  title: string;
  description: string;
}

// File Type enum to replace string literals
export enum FileType {
  PDF = "pdf",
  EPUB = "epub",
  CODE = "code",
  TEXT = "text",
  OTHER = "other",
}

// Type-specific Block interfaces
export interface FileBlock extends BaseBlock {
  block_type: BlockType.FILE;
  content: FileBlockContent;
}

export interface ChannelBlock extends BaseBlock {
  block_type: BlockType.CHANNEL;
  content: ChannelBlockContent;
}

// Union type for all block types
export type Block = FileBlock | ChannelBlock;

// Type guards
export const isFileBlock = (block: Block): block is FileBlock =>
  block.block_type === BlockType.FILE;

export const isChannelBlock = (block: Block): block is ChannelBlock =>
  block.block_type === BlockType.CHANNEL;
