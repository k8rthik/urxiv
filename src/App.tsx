import React, { useEffect, useState } from "react";
import { useTauri } from "./context/TauriContext";
import WelcomePage from "./components/WelcomePage";
import MainLayout from "./components/MainLayout";
import { Block } from "./types";

const App: React.FC = () => {
  const { isReady, isLoading, hasWorkspace, indexWorkspace } = useTauri();

  const [files, setFiles] = useState<Block[]>([]);
  const [initializingWorkspace, setInitializingWorkspace] = useState(false);

  useEffect(() => {
    // If workspace is selected, index files
    if (isReady && hasWorkspace) {
      initializeWorkspace();
    }
  }, [isReady, hasWorkspace, indexWorkspace]);

  const initializeWorkspace = async () => {
    setInitializingWorkspace(true);
    try {
      const indexedFiles = await indexWorkspace();
      setFiles(indexedFiles);
    } catch (error) {
      console.error("Error initializing workspace:", error);
    } finally {
      setInitializingWorkspace(false);
    }
  };

  if (isLoading || initializingWorkspace) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading...</h2>
          <p className="text-gray-400">
            {initializingWorkspace
              ? "Indexing your workspace..."
              : "Checking workspace status..."}
          </p>
        </div>
      </div>
    );
  }

  // If no workspace is selected, show welcome page
  if (!hasWorkspace) {
    return <WelcomePage />;
  }

  // Otherwise, show main layout
  return <MainLayout initialFiles={files} />;
};

export default App;
