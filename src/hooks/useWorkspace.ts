// src/hooks/useWorkspace.ts
import { useState, useEffect } from "react";
import { WorkspaceService } from "../services";

export function useWorkspace() {
  const [hasWorkspace, setHasWorkspace] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const workspaceService = new WorkspaceService();

  useEffect(() => {
    checkWorkspaceStatus();
  }, []);

  const checkWorkspaceStatus = async () => {
    setIsLoading(true);
    try {
      const status = await workspaceService.getWorkspaceStatus();
      setHasWorkspace(status);
    } catch (error) {
      console.error("Failed to check workspace status:", error);
      setHasWorkspace(false);
    } finally {
      setIsLoading(false);
    }
  };

  const selectWorkspace = async () => {
    setIsLoading(true);
    try {
      const result = await workspaceService.selectWorkspace();
      if (result) {
        setHasWorkspace(true);
      }
      return result;
    } catch (error) {
      console.error("Failed to select workspace:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const indexWorkspace = async () => {
    setIsLoading(true);
    try {
      return await workspaceService.indexWorkspace();
    } catch (error) {
      console.error("Failed to index workspace:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    hasWorkspace,
    isLoading,
    selectWorkspace,
    indexWorkspace,
  };
}
