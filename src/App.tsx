import React, { useEffect, useState } from "react";
import { useTauri } from "./context/TauriContext";
import WelcomePage from "./components/WelcomePage";
import MainLayout from "./components/MainLayout";
import { Block } from "./types";

const App: React.FC = () => {
  const { isReady, isLoading, hasWorkspace, indexWorkspace } = useTauri();

  const [files, setFiles] = useState<Block[]>([]);

  useEffect(() => {
    // If workspace is selected, index files
    if (isReady && hasWorkspace) {
      initializeWorkspace();
    }
  }, [isReady, hasWorkspace, indexWorkspace]);

  const initializeWorkspace = async () => {
    try {
      const indexedFiles = await indexWorkspace();
      setFiles(indexedFiles);
    } catch (error) {
      console.error("Error initializing workspace:", error);
    }
  };

  // If no workspace is selected, show welcome page
  if (!hasWorkspace) {
    return <WelcomePage />;
  }

  // Otherwise, show main layout
  return <MainLayout initialFiles={files} />;
};

export default App;
