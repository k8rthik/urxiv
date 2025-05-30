import React from "react";
import NewChannel from "./NewChannel";
import { Block } from "../types";

interface NewChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChannelCreated: (newChannel: Block) => void;
}

const NewChannelModal: React.FC<NewChannelModalProps> = ({
  isOpen,
  onClose,
  onChannelCreated,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-zinc-800 p-6 max-w-md w-full shadow-[0_0_20px_rgba(255,255,255,0.15)]">
        <NewChannel
          onChannelCreated={onChannelCreated}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

export default NewChannelModal; 