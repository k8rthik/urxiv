// services/workspace/WorkspaceService.ts
import TauriService from "../core/TauriService";

class WorkspaceService {
  private tauriService: TauriService;

  constructor() {
    this.tauriService = TauriService.getInstance();
  }

  public async getWorkspaceStatus(): Promise<boolean> {
    try {
      return await this.tauriService.invoke<boolean>("get_workspace_status");
    } catch (error) {
      console.error("Failed to check workspace status:", error);
      return false;
    }
  }

  public async selectWorkspace(): Promise<boolean> {
    try {
      const selected = await this.tauriService.openDialog({
        directory: true,
        multiple: false,
        title: "Select Workspace Directory",
      });

      if (selected) {
        await this.tauriService.invoke("select_workspace", { path: selected });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to select workspace:", error);
      return false;
    }
  }

  public async indexWorkspace(): Promise<any[]> {
    try {
      return await this.tauriService.invoke<any[]>("index_workspace_files");
    } catch (error) {
      console.error("Failed to index workspace:", error);
      return [];
    }
  }
}

export default WorkspaceService;
