import React from "react";
import { useTauri } from "../context/TauriContext";

const WelcomePage: React.FC = () => {
  const { selectWorkspace } = useTauri();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-between bg-black text-white p-8">
      <div className="flex-grow"></div>
      <div className="flex-col justify-between max-w-xl text-center">
        <h1 className="text-4xl font-bold font-serif mb-4">Welcome to urXiv</h1>
        <p className="text-xl text-zinc-300 mb-4">
          Your block-based content management system.
        </p>
        <div className="p-4 mb-4">
          <p className="text-zinc-300 mb-6">
            To get started, select a workspace directory where urXiv will store
            your data and index your files.
          </p>
          <button
            onClick={selectWorkspace}
            className="px-6 py-3 bg-[#1A1A1A] border border-transparent hover:border-white font-medium"
          >
            Choose Workspace Folder
          </button>
        </div>
      </div>
      <div className="flex-grow"></div>
      <div className="text-zinc-500 text-sm mt-auto">
        <p>
          urXiv will create a .urxiv folder in your selected directory to store
          settings and metadata.
        </p>
      </div>
    </div>
  );
};

export default WelcomePage;
