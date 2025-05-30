// Block structure that matches the Rust backend
export interface BaseBlock {
  id: number;
  created_at: string;
  updated_at: string;
  connections: number[];
}

export interface ChannelBlock extends BaseBlock {
  block_type: "channel";
  content: {
    title: string;
    description: string;
  };
}

export interface FileBlock extends BaseBlock {
  block_type: "file";
  content: {
    path: string;
    filename: string;
    file_type: string;
    full_path: string;
  };
}

export type Block = ChannelBlock | FileBlock;

// Type guards for block types
export function isChannelBlock(block: Block): boolean {
  return block.block_type === "channel";
}

export function isFileBlock(block: Block): boolean {
  return block.block_type === "file";
}

export type ViewType = "files" | "channels" | "blocks" | "channel";
export type FileFilter = "all" | "pdf" | "epub" | "code" | "text";
export type BlockFilter = "all" | "channel" | "file";

export function isChannel(block: Block): boolean {
  return block.block_type === "channel";
}
export function isFile(block: Block): boolean {
  return block.block_type === "file";
}
