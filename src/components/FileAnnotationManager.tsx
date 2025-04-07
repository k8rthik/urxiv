import React, { useState, useEffect } from "react";
import FileView from "./FileView";
import BlockBrowser from "./BlockBrowser";
import { Block } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Book, Bookmark } from "lucide-react";

interface FileAnnotationManagerProps {
  fileId: number;
}

const FileAnnotationManager: React.FC<FileAnnotationManagerProps> = ({
  fileId,
}) => {
  const [file, setFile] = useState<Block | null>(null);
  const [annotations, setAnnotations] = useState<Block[]>([]);
  const [activeTab, setActiveTab] = useState<string>("file");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load file and its annotations
  useEffect(() => {
    const loadFileData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load the file
        const fileData = await window.__TAURI__.invoke("get_block", {
          blockId: fileId,
        });
        setFile(fileData);

        // Load annotations for this file
        const fileAnnotations = await window.__TAURI__.invoke(
          "get_file_annotations",
          { fileId },
        );
        setAnnotations(fileAnnotations);
      } catch (err) {
        console.error("Error loading file data:", err);
        setError("Failed to load file data");
      } finally {
        setIsLoading(false);
      }
    };

    loadFileData();
  }, [fileId]);

  // Handle adding a new annotation
  const handleAddAnnotation = (newAnnotation: Block) => {
    setAnnotations((prev) => [newAnnotation, ...prev]);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <h2 className="text-xl mb-4">Loading...</h2>
          <p>Loading file and annotations</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !file) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <h2 className="text-xl mb-4">Error</h2>
          <p>{error || "File not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-medium">{file.content.filename}</h1>
          <span className="text-zinc-400">|</span>
          <span className="text-sm text-zinc-400">{file.content.path}</span>
        </div>
      </header>

      {/* Tabs for File and Annotations */}
      <Tabs defaultValue="file" className="flex-1 flex flex-col">
        <div className="border-b border-zinc-800 px-6">
          <TabsList className="bg-transparent">
            <TabsTrigger
              value="file"
              onClick={() => setActiveTab("file")}
              className={activeTab === "file" ? "border-b-2 border-white" : ""}
            >
              <Book size={16} className="mr-2" />
              File
            </TabsTrigger>
            <TabsTrigger
              value="annotations"
              onClick={() => setActiveTab("annotations")}
              className={
                activeTab === "annotations" ? "border-b-2 border-white" : ""
              }
            >
              <Bookmark size={16} className="mr-2" />
              Annotations ({annotations.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="file" className="flex-1 overflow-hidden">
          <FileView file={file} onAddAnnotation={handleAddAnnotation} />
        </TabsContent>

        <TabsContent value="annotations" className="flex-1 overflow-hidden">
          <BlockBrowser
            blocks={annotations}
            title="File Annotations"
            emptyMessage="No annotations yet. Switch to the File tab to add some."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FileAnnotationManager;
