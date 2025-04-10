// src/hooks/useFiles.ts
import { useState } from "react";
import { FileService } from "../services";
import { Block } from "../types";

export function useFiles() {
  const [isLoading, setIsLoading] = useState(false);
  const fileService = new FileService();

  const getAllFiles = async (): Promise<Block[]> => {
    setIsLoading(true);
    try {
      return await fileService.getAllFiles();
    } catch (error) {
      console.error("Failed to get all files:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const openFile = async (filePath: string): Promise<boolean> => {
    try {
      return await fileService.openFile(filePath);
    } catch (error) {
      console.error("Failed to open file:", error);
      return false;
    }
  };

  return {
    isLoading,
    getAllFiles,
    openFile,
  };
}
