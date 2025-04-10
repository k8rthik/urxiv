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

  return (
    <div
      className="border border-zinc-800 overflow-hidden cursor-pointer hover:border-zinc-700 transition-colors"
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
        <div className="flex flex-grow gap-4 items-center">
          {getPreviewBlocks(blocks).map((block) => (
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
            length: Math.max(0, 4 - blocks.length),
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
  );
};

export default ChannelCard;
