import React, { useState, useEffect } from "react";
import { Block } from "../types";
import { format } from "date-fns";
import { Loader } from "lucide-react";
import { useTauri } from "../context/TauriContext";

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

  const getPreviewBlocks = (blocks: Block[]) => {
    return blocks.slice(0, 4);
  };

  const filteredChannels = channelsWithBlocks.filter((item) => {
    const title = item.channel.content.title?.toLowerCase() || "";
    return title.includes(searchTerm.toLowerCase());
  });

  const sortedChannels = [...filteredChannels].sort((a, b) => {
    if (sortBy === "recent") {
      return (
        new Date(b.channel.updated_at || b.channel.created_at).getTime() -
        new Date(a.channel.updated_at || a.channel.created_at).getTime()
      );
    } else {
      const titleA = a.channel.content.title?.toLowerCase() || "";
      const titleB = b.channel.content.title?.toLowerCase() || "";
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
    <div className="flex-1 overflow-y-auto p-7">
      {sortedChannels.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-zinc-500 text-sm">
            {channelsWithBlocks.length === 0
              ? "No channels have been created yet."
              : "No channels match your search."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {sortedChannels.map((item) => (
            <div
              key={item.channel.id}
              className="border border-zinc-800 overflow-hidden cursor-pointer hover:border-zinc-700 transition-colors"
              onClick={() => onChannelClick(item.channel.id)}
            >
              <div className="flex p-6">
                <div className="w-64 pr-8 flex-shrink-0">
                  <h3 className="text-2xl font-medium text-white">
                    {item.channel.content.title || "Untitled Channel"}
                  </h3>
                  <div className="text-zinc-500 mt-1 text-sm">
                    {item.blockCount} blocks
                  </div>
                  <div className="text-zinc-500 mt-1 text-sm">
                    last edited{" "}
                    {format(
                      new Date(
                        item.channel.updated_at || item.channel.created_at,
                      ),
                      "MMMM d, yyyy",
                    )}
                  </div>
                </div>
                <div className="flex flex-grow gap-4 items-center">
                  {getPreviewBlocks(item.blocks).map((block) => (
                    <div
                      key={block.id}
                      className="bg-zinc-900 flex-1 h-64 flex items-center justify-center"
                    >
                      {block.content.file_url ? (
                        <img
                          src={block.content.file_url}
                          alt={block.content.title || ""}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                          <span className="text-zinc-500">···</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {Array.from({
                    length: Math.max(0, 4 - item.blocks.length),
                  }).map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="flex-1 h-64 flex items-center justify-center bg-zinc-800"
                    >
                      <span className="text-zinc-500 text-xl">···</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChannelBrowser;
