// Block structure that matches the Rust backend
export interface Block {
  id: number;
  created_at: string;
  updated_at: string;
  block_type: string; // "channel" or "file" or potentially other types
  content: any; // Flexible content structure based on type
  connections: number[]; // IDs of blocks connected to this one
}

// Type guards for block types
export function isChannelBlock(block: Block): boolean {
  return block.block_type === "channel";
}

export function isFileBlock(block: Block): boolean {
  return block.block_type === "file";
}

// View type for the main layout
export type ViewType = "files" | "channels" | "blocks" | "channel";

// File type filter
export type FileFilter = "all" | "pdf" | "epub" | "code" | "text";
