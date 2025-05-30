// src/components/ChannelCard.tsx
import React from "react";
import { format } from "date-fns";
import { Block } from "../types";

interface ChannelCardProps {
  title: string;
  description: string;
  blocks: Block[];
  blockCount: number;
  updatedAt: string;
  onClick: () => void;
}

const ChannelCard: React.FC<ChannelCardProps> = ({
  title,
  description,
  blocks,
  blockCount,
  updatedAt,
  onClick,
}) => {
  const getPreviewBlocks = (blocks: Block[]) => {
    return blocks.slice(0, 4);
  };

  const previewBlocks = getPreviewBlocks(blocks);
  const emptySlots = Math.max(0, 4 - blocks.length);

  return (
    <div
      className="border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors"
      onClick={onClick}
    >
      <div className="flex p-6">
        <div className="w-64 pr-8 flex-shrink-0">
          <h3 className="text-2xl font-medium text-white">
            {title || "Untitled Channel"}
          </h3>
          <div className="text-zinc-500 mt-1 text-sm">{blockCount} blocks</div>
          <div className="text-zinc-500 mt-1 text-sm">
            last edited {format(new Date(updatedAt), "MMMM d, yyyy")}
          </div>
        </div>

        {/* Preview Blocks Section */}
        <div className="flex-1 flex items-center justify-between min-h-[64px]">
          {previewBlocks.map((block) => (
            <div
              key={block.id}
              className="w-64 h-64 bg-zinc-900 flex items-center justify-center border border-zinc-800 flex-shrink-0"
            >
              {block.content.file_url ? (
                <img
                  src={block.content.file_url}
                  alt={block.content.title || ""}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-zinc-500 text-xs">···</span>
              )}
            </div>
          ))}
          {Array.from({ length: emptySlots }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="w-64 h-64 bg-zinc-800 flex items-center justify-center border border-zinc-700 flex-shrink-0"
            >
              <span className="text-zinc-500 text-xs">···</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChannelCard;
