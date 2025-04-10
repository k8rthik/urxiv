// src/components/ChannelBrowser.tsx (refactored)
import React, { useState, useEffect } from "react";
import { Block } from "../types";
import { useTauri } from "../context/TauriContext";
import { format } from "date-fns";
import { Loader } from "lucide-react";
import { channelBlockToBrowserItem } from "../adapters/browserAdapters";
import { BrowserItem } from "../types/browser";

// We need a custom renderer for channels since they're more complex
import ChannelCard from "./ChannelCard"; // We'll create this component next

interface ChannelBrowserProps {
  onChannelClick: (channelId: number) => void;
}

interface ChannelWithBlocks {
  channel: Block;
  blocks: Block[];
  blockCount: number;
}

const ChannelBrowser: React.FC<ChannelBrowserProps> = ({ onChannelClick }) => {
  const { getAllChannels, getBlocksInChannel } = useTauri();
  const [channelsWithBlocks, setChannelsWithBlocks] = useState<
    ChannelWithBlocks[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "alphabetical">("recent");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const channelsData = await getAllChannels();
      const channelsWithBlocksPromises = channelsData.map(async (channel) => {
        try {
          const blocks = await getBlocksInChannel(channel.id);
          return {
            channel,
            blocks,
            blockCount: blocks.length,
          };
        } catch (err) {
          console.error(`Failed to get blocks for channel ${channel.id}:`, err);
          return {
            channel,
            blocks: [],
            blockCount: 0,
          };
        }
      });
      const results = await Promise.all(channelsWithBlocksPromises);
      setChannelsWithBlocks(results);
    } catch (err) {
      console.error("Failed to load channels:", err);
      setError("Failed to load channels. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Convert channelsWithBlocks to browserItems
  const browserItems: BrowserItem[] = channelsWithBlocks.map((cwb) => {
    const channelItem = channelBlockToBrowserItem(cwb.channel);
    return {
      ...channelItem,
      metadata: {
        ...channelItem.metadata,
        blocks: cwb.blocks,
        blockCount: cwb.blockCount,
      },
    };
  });

  // Custom renderer for channel items
  const renderChannelItem = (item: BrowserItem) => {
    const blocks = item.metadata?.blocks || [];
    return (
      <ChannelCard
        key={item.id}
        title={item.title}
        description={item.subtitle || ""}
        blocks={blocks}
        blockCount={item.metadata?.blockCount || 0}
        updatedAt={item.updatedAt}
        onClick={() => onChannelClick(item.id)}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-zinc-500 mr-2" size={24} />
        <span className="text-zinc-500">Loading channels...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{error}</p>
        <button
          onClick={loadChannels}
          className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Custom filter-sort for channels
  const filterSortChannels = (
    items: BrowserItem[],
    options: { searchTerm?: string; sortBy?: string },
  ) => {
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
    }

    return filtered;
  };

  return (
    <div className="flex-1 overflow-y-auto p-7">
      {browserItems.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-zinc-500 text-sm">
            No channels have been created yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {filterSortChannels(browserItems, { searchTerm, sortBy }).map(
            renderChannelItem,
          )}
        </div>
      )}
    </div>
  );
};

export default ChannelBrowser;
