declare global {
  interface Window {
    __TAURI__: {
      core: {
        invoke: (command: string, args?: Record<string, any>) => Promise<any>;
      };
      dialog: {
        open: (options: {
          directory?: boolean;
          multiple?: boolean;
          title?: string;
        }) => Promise<string | string[] | null>;
      };
      shell: {
        open: (path: string) => Promise<void>;
      };
    };
  }
}

export interface FileService {
  openFile(filePath: string): Promise<void>;
  isAvailable(): boolean;
}

class TauriFileService implements FileService {
  private tauriShell: any = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (typeof window !== "undefined" && window.__TAURI__) {
      this.tauriShell = {
        open: async (path: string) => {
          return window.__TAURI__.shell.open(path);
        },
      };
      this.initialized = true;
    }
  }

  async openFile(filePath: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error("File service is not available");
    }

    try {
      await this.tauriShell.open(filePath);
    } catch (error) {
      throw new Error(`Failed to open file: ${error}`);
    }
  }

  isAvailable(): boolean {
    return this.initialized && this.tauriShell !== null;
  }
}

// Singleton instance
export const fileService = new TauriFileService(); 