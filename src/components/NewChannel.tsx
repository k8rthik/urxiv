import React, { useState } from "react";
import { useTauri } from "../context/TauriContext";
import { Block } from "../types";
import { X } from "lucide-react";

interface NewChannelProps {
  onChannelCreated: (channel: Block) => void;
  onCancel: () => void;
}

const NewChannel: React.FC<NewChannelProps> = ({
  onChannelCreated,
  onCancel,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createChannel } = useTauri();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const newChannel = await createChannel(title.trim(), description.trim());
      onChannelCreated(newChannel);
      onCancel();
    } catch (err) {
      console.error("Failed to create channel:", err);
      setError("Failed to create channel. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm text-zinc-500">New channel</h2>
        <button onClick={onCancel} className="text-zinc-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <div className="border-t border-zinc-800 mb-6"></div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-2 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
            {error}
          </div>
        )}
        <div className="mb-6">
          <label className="block text-zinc-500 text-sm mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-xl hover:bg-zinc-800 hover:text-zinc-50 focus:outline-none focus:bg-zinc-800 placeholder-zinc-600 text-zinc-300"
            placeholder="Type channel name"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="mb-3">
          <label className="block text-zinc-500 text-sm mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-32 p-1 bg-zinc-900 text-zinc-300 placeholder-zinc-600 resize-none focus:outline-none focus:border-zinc-500"
            placeholder="Describe your channel here"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-2 py-1 bg-[#1A1A1A] border border-transparent hover:border-white text-sm flex items-center gap-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create channel"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewChannel;
