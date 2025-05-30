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

export type ViewType = "files" | "channels" | "blocks" | "channel";
// Changed from predefined union to flexible string to support dynamic filters
export type FileFilter = string; // "all" | any dynamic file type
export type BlockFilter = string; // "all" | any dynamic block type

// Deprecated: Use isChannelBlock instead
export function isChannel(block: Block): boolean {
  return block.block_type === "channel";
}

// Fixed typo: Use isFileBlock instead  
export function isFile(block: Block): boolean {
  return block.block_type === "file";
}
