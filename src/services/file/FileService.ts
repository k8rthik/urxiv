// services/file/FileService.ts
import TauriService from "../core/TauriService";
import { Block } from "../../types";

class FileService {
  private tauriService: TauriService;
  private shellApi: any = null;

  constructor() {
    this.tauriService = TauriService.getInstance();
    this.initializeShell();
  }

  private initializeShell(): void {
    if (typeof window !== "undefined" && window.__TAURI__) {
      this.shellApi = window.__TAURI__.shell;
    }
  }

  public async getAllFiles(): Promise<Block[]> {
    try {
      return await this.tauriService.invoke<Block[]>("get_all_files");
    } catch (error) {
      console.error("Failed to get all files:", error);
      return [];
    }
  }

  public async openFile(filePath: string): Promise<boolean> {
    if (!this.shellApi) {
      console.error("Tauri shell API is not available");
      return false;
    }

    try {
      await this.shellApi.open(filePath);
      return true;
    } catch (error) {
      console.error("Failed to open file:", error);
      return false;
    }
  }
}

export default FileService;
