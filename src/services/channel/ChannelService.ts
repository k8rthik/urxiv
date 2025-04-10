// services/channel/ChannelService.ts
import TauriService from "../core/TauriService";
import { Block } from "../../types";

class ChannelService {
  private tauriService: TauriService;

  constructor() {
    this.tauriService = TauriService.getInstance();
  }

  public async getAllChannels(): Promise<Block[]> {
    try {
      return await this.tauriService.invoke<Block[]>("get_all_channels");
    } catch (error) {
      console.error("Failed to get all channels:", error);
      return [];
    }
  }

  public async createChannel(
    title: string,
    description: string,
  ): Promise<Block> {
    try {
      return await this.tauriService.invoke<Block>("create_channel", {
        title,
        description,
      });
    } catch (error) {
      console.error("Failed to create channel:", error);
      throw error;
    }
  }

  public async getBlocksInChannel(channelId: number): Promise<Block[]> {
    try {
      return await this.tauriService.invoke<Block[]>("get_blocks_in_channel", {
        channelId,
      });
    } catch (error) {
      console.error(`Failed to get blocks in channel ${channelId}:`, error);
      return [];
    }
  }
}

export default ChannelService;
