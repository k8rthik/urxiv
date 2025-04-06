import React, { useState, useEffect } from "react";
import { Block } from "../types";
import { format } from "date-fns";
import { Calendar, Users, Filter, Loader } from "lucide-react";
import { useTauri } from "../context/TauriContext";

interface ChannelBrowserProps {
  onChannelClick: (channelId: number) => void;
}

const ChannelBrowser: React.FC<ChannelBrowserProps> = ({ onChannelClick }) => {
  const { getAllChannels, getBlocksInChannel } = useTauri();
  const [channels, setChannels] = useState<Block[]>([]);
  const [channelBlocks, setChannelBlocks] = useState<Record<number, number>>(
    {},
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "alphabetical">("recent");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load channels on component mount
  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const channelsData = await getAllChannels();
      setChannels(channelsData);

      // Load block counts for each channel
      const blocksPromises = channelsData.map(async (channel) => {
        try {
          const blocks = await getBlocksInChannel(channel.id);
          return { channelId: channel.id, count: blocks.length };
        } catch (err) {
          console.error(`Failed to get blocks for channel ${channel.id}:`, err);
          return { channelId: channel.id, count: 0 };
        }
      });

      const blocksResults = await Promise.all(blocksPromises);
      const blocksMap = blocksResults.reduce(
        (acc, item) => {
          acc[item.channelId] = item.count;
          return acc;
        },
        {} as Record<number, number>,
      );

      setChannelBlocks(blocksMap);
    } catch (err) {
      console.error("Failed to load channels:", err);
      setError("Failed to load channels. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter channels based on search term
  const filteredChannels = channels.filter((channel) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        channel.content.title?.toLowerCase().includes(searchLower) ||
        channel.content.description?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Sort channels based on selected sort method
  const sortedChannels = [...filteredChannels].sort((a, b) => {
    if (sortBy === "recent") {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      // Sort alphabetically by title
      const titleA = a.content.title?.toLowerCase() || "";
      const titleB = b.content.title?.toLowerCase() || "";
      return titleA.localeCompare(titleB);
    }
  });

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

  return (
    <div>
      {/* Sorting options */}
      <div className="border-b border-zinc-800 px-4">
        <div className="flex items-center space-x-4">
          <button
            className={`px-4 py-3 text-sm border-b-2 ${
              sortBy === "recent"
                ? "border-white text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            } transition-colors flex items-center gap-1`}
            onClick={() => setSortBy("recent")}
          >
            <Calendar size={14} />
            Recent
          </button>
          <button
            className={`px-4 py-3 text-sm border-b-2 ${
              sortBy === "alphabetical"
                ? "border-white text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            } transition-colors flex items-center gap-1`}
            onClick={() => setSortBy("alphabetical")}
          >
            <Filter size={14} />
            Alphabetical
          </button>
        </div>
      </div>

      {/* Search input */}
      <div className="p-4">
        <input
          type="text"
          placeholder="Search channels..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-900 text-white border border-zinc-800 rounded-sm focus:outline-none focus:border-zinc-600 text-sm"
        />
      </div>

      {/* Channel list */}
      <div className="p-1">
        {sortedChannels.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-zinc-500 text-sm">
              {channels.length === 0
                ? "No channels have been created yet."
                : "No channels match your search."}
            </p>
          </div>
        ) : (
          <div className="w-full">
            {sortedChannels.map((channel) => (
              <div
                key={channel.id}
                className="border-b border-zinc-800 hover:bg-zinc-900/30 transition-colors cursor-pointer"
                onClick={() => onChannelClick(channel.id)}
              >
                <div className="px-4 py-3">
                  <h3 className="font-medium">
                    {channel.content.title || "Untitled Channel"}
                  </h3>
                  {channel.content.description && (
                    <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                      {channel.content.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-zinc-500 mt-2">
                    <div className="flex items-center gap-1 text-xs">
                      <Calendar size={12} />
                      <span>
                        {format(new Date(channel.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Users size={12} />
                      <span>{channelBlocks[channel.id] || 0} blocks</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelBrowser;
