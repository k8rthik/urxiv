import { Block } from "../types";
import { FileIconService } from "./fileIcons";

export interface FilterOption {
  id: string;
  label: string;
  count: number;
  icon?: React.ReactNode;
}

export interface DynamicFilterOptions {
  fileTypes: FilterOption[];
  blockTypes: FilterOption[];
}

export class DynamicFilterService {
  /**
   * Generate dynamic file type filter options from available files
   */
  static generateFileTypeFilters(files: Block[]): FilterOption[] {
    const fileTypeCounts = new Map<string, number>();
    
    // Count file types
    files.forEach(file => {
      if (file.block_type === "file" && file.content.file_type) {
        const fileType = file.content.file_type;
        fileTypeCounts.set(fileType, (fileTypeCounts.get(fileType) || 0) + 1);
      }
    });

    // Convert to filter options, sorted by count
    const options: FilterOption[] = [
      {
        id: "all",
        label: "All Files",
        count: files.filter(f => f.block_type === "file").length,
      }
    ];

    // Add file type options
    Array.from(fileTypeCounts.entries())
      .sort(([, a], [, b]) => b - a) // Sort by count descending
      .forEach(([fileType, count]) => {
        const config = FileIconService.getFileTypeConfig(fileType);
        options.push({
          id: fileType,
          label: config.label,
          count,
          icon: FileIconService.getIcon(fileType, 16),
        });
      });

    return options;
  }

  /**
   * Generate dynamic block type filter options from available blocks
   */
  static generateBlockTypeFilters(blocks: Block[]): FilterOption[] {
    const blockTypeCounts = new Map<string, number>();
    
    // Count block types
    blocks.forEach(block => {
      const blockType = block.block_type;
      blockTypeCounts.set(blockType, (blockTypeCounts.get(blockType) || 0) + 1);
    });

    // Convert to filter options
    const options: FilterOption[] = [
      {
        id: "all",
        label: "All Blocks",
        count: blocks.length,
      }
    ];

    // Add block type options
    Array.from(blockTypeCounts.entries())
      .sort(([, a], [, b]) => b - a) // Sort by count descending
      .forEach(([blockType, count]) => {
        const label = this.getBlockTypeLabel(blockType);
        options.push({
          id: blockType,
          label,
          count,
        });
      });

    return options;
  }

  /**
   * Generate all dynamic filter options
   */
  static generateDynamicFilters(files: Block[], blocks: Block[]): DynamicFilterOptions {
    return {
      fileTypes: this.generateFileTypeFilters(files),
      blockTypes: this.generateBlockTypeFilters(blocks),
    };
  }

  /**
   * Get a human-readable label for block types
   */
  private static getBlockTypeLabel(blockType: string): string {
    const labels: Record<string, string> = {
      file: "Files",
      channel: "Channels",
      folder: "Folders",
      tag: "Tags",
    };

    return labels[blockType] || 
           blockType.charAt(0).toUpperCase() + blockType.slice(1) + "s";
  }

  /**
   * Check if a block matches the current filter
   */
  static matchesFilter(block: Block, filter: string, view: "files" | "blocks"): boolean {
    if (filter === "all") return true;

    if (view === "files") {
      return block.block_type === "file" && block.content.file_type === filter;
    } else if (view === "blocks") {
      return block.block_type === filter;
    }

    return false;
  }

  /**
   * Get file extensions from blocks for advanced filtering
   */
  static getAvailableExtensions(files: Block[]): FilterOption[] {
    const extensionCounts = new Map<string, number>();
    
    files.forEach(file => {
      if (file.block_type === "file" && file.content.filename) {
        const filename = file.content.filename as string;
        const extension = filename.split('.').pop()?.toLowerCase();
        if (extension) {
          extensionCounts.set(extension, (extensionCounts.get(extension) || 0) + 1);
        }
      }
    });

    const options: FilterOption[] = [];
    Array.from(extensionCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .forEach(([extension, count]) => {
        options.push({
          id: extension,
          label: `.${extension}`,
          count,
        });
      });

    return options;
  }
} 