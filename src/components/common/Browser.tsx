// src/components/common/Browser.tsx
import React, { useState } from "react";
import { Loader } from "lucide-react";
import {
  BrowserItem,
  BaseBrowserProps,
  FilterSortOptions,
} from "../../types/browser";

interface BrowserProps<T extends BrowserItem> extends BaseBrowserProps<T> {
  filterSort?: (items: T[], options: FilterSortOptions) => T[];
  searchPlaceholder?: string;
  showSearch?: boolean;
  showSort?: boolean;
  sortOptions?: Array<{ value: string; label: string }>;
}

function Browser<T extends BrowserItem>({
  items,
  onItemClick,
  emptyMessage = "No items found",
  loadingMessage = "Loading items...",
  isLoading = false,
  error = null,
  renderItem,
  filterSort,
  searchPlaceholder = "Search...",
  showSearch = true,
  showSort = true,
  sortOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "alphabetical", label: "Alphabetical" },
  ],
}: BrowserProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("recent");

  // Default filter method
  const defaultFilterSort = (items: T[], options: FilterSortOptions): T[] => {
    let filtered = [...items];

    // Apply search filter
    if (options.searchTerm) {
      const searchLower = options.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(searchLower)),
      );
    }

    // Apply sorting
    if (options.sortBy === "recent") {
      filtered.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime(),
      );
    } else if (options.sortBy === "alphabetical") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (options.sortBy === "type") {
      filtered.sort((a, b) => a.type.localeCompare(b.type));
    }

    return filtered;
  };

  // Use provided filter method or default
  const actualFilterSort = filterSort || defaultFilterSort;

  // Apply filters and sorting
  const displayedItems = actualFilterSort(items, {
    searchTerm,
    sortBy,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-zinc-500 mr-2" size={24} />
        <span className="text-zinc-500">{loadingMessage}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // Default item renderer
  const defaultRenderItem = (item: T) => (
    <div
      key={item.id}
      className="border-b border-zinc-800 hover:bg-zinc-900/30 transition-colors cursor-pointer"
      onClick={() => onItemClick?.(item.id)}
    >
      <div className="px-4 py-3 flex items-center gap-3">
        {item.icon && <div>{item.icon}</div>}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{item.title}</h3>
          {item.subtitle && (
            <p className="text-xs text-zinc-500 mt-0.5 truncate">
              {item.subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 text-zinc-500">
          <span className="text-xs uppercase">{item.type}</span>
          <span className="text-xs">
            {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );

  const actualRenderItem = renderItem || defaultRenderItem;

  return (
    <div>
      {/* {showSearch || showSort ? (
        <div className="flex justify-between items-center p-4 border-b border-zinc-800">
          {showSearch && (
            <div className="relative w-full pr-5">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent border border-zinc-800 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-600"
              />
            </div>
          )}
          {showSort && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border border-zinc-800 rounded text-xs py-1 px-2 focus:outline-none focus:border-zinc-600"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      ) : null} */}

      {displayedItems.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-zinc-500 text-sm">
            {items.length === 0
              ? emptyMessage
              : "No items match your current filters."}
          </p>
        </div>
      ) : (
        <div className="w-full">
          {displayedItems.map((item, index) => actualRenderItem(item, index))}
        </div>
      )}
    </div>
  );
}

export default Browser;
