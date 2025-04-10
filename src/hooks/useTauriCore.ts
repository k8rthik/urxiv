// src/hooks/useTauriCore.ts
import { useState, useEffect } from "react";
import { TauriService } from "../services";

export function useTauriCore() {
  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const tauriService = TauriService.getInstance();

  useEffect(() => {
    const initialize = async () => {
      setIsInitializing(true);
      const result = await tauriService.initialize();
      setIsReady(result);
      setIsInitializing(false);
    };

    initialize();
  }, []);

  return {
    isReady,
    isInitializing,
  };
}
