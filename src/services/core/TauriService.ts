// services/core/TauriService.ts
class TauriService {
  private static instance: TauriService;
  private _tauriInvoke: any = null;
  private _tauriDialog: any = null;
  private _isReady: boolean = false;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): TauriService {
    if (!TauriService.instance) {
      TauriService.instance = new TauriService();
    }
    return TauriService.instance;
  }

  public async initialize(): Promise<boolean> {
    try {
      if (typeof window !== "undefined" && window.__TAURI__) {
        this._tauriInvoke = window.__TAURI__.core.invoke;
        this._tauriDialog = window.__TAURI__.dialog;
        this._isReady = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to initialize Tauri:", error);
      return false;
    }
  }

  public get isReady(): boolean {
    return this._isReady;
  }

  public async invoke<T>(command: string, args?: any): Promise<T> {
    if (!this._isReady) {
      throw new Error("Tauri is not ready yet");
    }
    return await this._tauriInvoke(command, args);
  }

  public async openDialog(options: any): Promise<string | null> {
    if (!this._isReady) {
      throw new Error("Tauri is not ready yet");
    }
    try {
      const selected = await this._tauriDialog.open(options);
      if (selected && !Array.isArray(selected)) {
        return selected;
      }
      return null;
    } catch (error) {
      console.error("Dialog error:", error);
      return null;
    }
  }
}

export default TauriService;
