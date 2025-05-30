import React, { useState, useEffect, useMemo } from "react";
import { Block, ViewType, FileFilter } from "../types";
import { useTauri } from "../context/TauriContext";
import FileBrowser from "./FileBrowser";
import BlockBrowser from "./BlockBrowser";
import ChannelBrowser from "./ChannelBrowser";
import ChannelView from "./ChannelView";
import { DynamicFilterService } from "../utils/dynamicFilters";

interface ContentAreaProps {
  view: ViewType;
  filter: FileFilter;
  selectedChannelId: number | null;
  onChannelClick: (channelId: number) => void;
  onBlockClick: (blockId: number) => void;
  onChannelUpdated: () => void;
}

const ContentArea: React.FC<ContentAreaProps> = ({
  view,
  filter,
  selectedChannelId,
  onChannelClick,
  onBlockClick,
  onChannelUpdated,
}) => {
  const { getAllFiles, getAllBlocks } = useTauri();
  const [files, setFiles] = useState<Block[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [filesData, blocksData] = await Promise.all([
        getAllFiles(),
        getAllBlocks()
      ]);
      setFiles(filesData);
      setBlocks(blocksData);
    } catch (error) {
      console.error("Failed to load content data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContent = useMemo(() => {
    if (view === "files") {
      return files.filter((file) => {
        return DynamicFilterService.matchesFilter(file, filter, "files");
      });
    } else if (view === "blocks") {
      return blocks.filter((block) => {
        return DynamicFilterService.matchesFilter(block, filter, "blocks");
      });
    }
    return [];
  }, [files, blocks, filter, view]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Loading content...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {view === "files" ? (
        <FileBrowser files={filteredContent as Block[]} />
      ) : view === "blocks" ? (
        <BlockBrowser
          blocks={filteredContent as Block[]}
          onBlockClick={onBlockClick}
        />
      ) : view === "channels" ? (
        <ChannelBrowser onChannelClick={onChannelClick} />
      ) : selectedChannelId ? (
        <ChannelView
          channelId={selectedChannelId}
          onChannelUpdated={onChannelUpdated}
        />
      ) : (
        <div className="p-8 text-center">
          <p className="text-zinc-400 text-sm">
            Select a channel to view its contents
          </p>
        </div>
      )}
    </div>
  );
};

export default ContentArea; 