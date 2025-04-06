import React, { useState } from "react";
import { useTauri } from "../context/TauriContext";
import { Block } from "../types";

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
    } catch (err) {
      console.error("Failed to create channel:", err);
      setError("Failed to create channel. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 p-2 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm mb-1 text-zinc-400">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-sm text-white focus:outline-none focus:border-zinc-500"
          placeholder="Channel title"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm mb-1 text-zinc-400">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-sm text-white resize-none focus:outline-none focus:border-zinc-500"
          placeholder="Optional description"
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-white text-black rounded-sm text-sm font-medium disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Channel"}
        </button>
      </div>
    </form>
  );
};

export default NewChannel;
