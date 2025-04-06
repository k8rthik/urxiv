import React from "react";
import { useTauri } from "../context/TauriContext";

const WelcomePage: React.FC = () => {
  const { selectWorkspace } = useTauri();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white p-8">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-bold mb-8">Welcome to urXiv</h1>

        <p className="text-xl mb-12">
          A block-based content management system for your files and knowledge.
        </p>

        <div className="bg-zinc-900 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">First Steps</h2>
          <p className="mb-6 text-zinc-300">
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
            className="px-6 py-3 bg-white text-black rounded-md font-medium hover:bg-gray-200 transition-colors"
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
