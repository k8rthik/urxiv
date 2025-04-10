// src/types/browser.ts
import { Block } from "../types";

// Generic item that can be displayed in any browser
export interface BrowserItem {
  id: number;
  title: string;
  subtitle?: string;
  type: string;
  metadata?: Record<string, any>;
  icon?: React.ReactNode;
  createdAt: string;
  updatedAt: string;
}

// Props that all browsers will share
export interface BaseBrowserProps<T extends BrowserItem> {
  items: T[];
  onItemClick?: (itemId: number) => void;
  emptyMessage?: string;
  loadingMessage?: string;
  isLoading?: boolean;
  error?: string | null;
  renderItem?: (item: T, index: number) => React.ReactNode;
}

// Search and filter functionality
export interface FilterSortOptions {
  searchTerm?: string;
  sortBy?: "recent" | "alphabetical" | "type" | string;
  filter?: string;
}

// Convert a Block to a BrowserItem (adapter pattern)
export type BlockToBrowserItemConverter = (block: Block) => BrowserItem;
