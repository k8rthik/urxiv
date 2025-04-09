import React from "react";
import { useTauri } from "../context/TauriContext";

const WelcomePage: React.FC = () => {
  const { selectWorkspace } = useTauri();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white p-8">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-bold font-serif mb-4">Welcome to urXiv</h1>

        <p className="text-xl text-zinc-300">
          Your block-based content management system.
        </p>

        <div className="p-4">
          <p className="text-zinc-300">
            To get started, you need to select a workspace directory where urXiv
            will store your data and index your files.
          </p>

          <ul className="list-disc text-left pl-6 mb-6 text-zinc-300">
            <li className="mb-2">
              Choose a directory that contains your PDF, code, epub, or text
              files
            </li>
            <li className="mb-2">
              These files will be automatically indexed and made available in
              urXiv
            </li>
            <li className="mb-2">
              Your workspace settings will be saved for future sessions
            </li>
          </ul>

          <button
            onClick={selectWorkspace}
            className="px-6 py-3 bg-[#1A1A1A] border border-transparent hover:border-white font-medium"
          >
            Choose Workspace Folder
          </button>
        </div>

        <div className="text-zinc-500 text-sm">
          <p>
            urXiv will create a .urxiv folder in your selected directory to
            store settings and metadata.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
