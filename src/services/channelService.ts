export interface ChannelRepository {
  getAll(): Promise<Block[]>;
  create(title: string, description: string): Promise<Block>;
  get(id: number): Promise<Block>;
  blocks(id: number): Promise<Block[]>;
}

import { Block } from "../types";

export class TauriChannelRepository implements ChannelRepository {
  async getAll(): Promise<Block[]> {
    return window.__TAURI__.core.invoke("get_all_channels");
  }

  async create(title: string, description: string): Promise<Block> {
    return window.__TAURI__.core.invoke("create_channel", { title, description });
  }

  async get(id: number): Promise<Block> {
    return window.__TAURI__.core.invoke("get_block", { blockId: id });
  }

  async blocks(id: number): Promise<Block[]> {
    return window.__TAURI__.core.invoke("get_blocks_in_channel", { channelId: id });
  }
}

export class ChannelService {
  constructor(private repository: ChannelRepository) {}

  getAll() {
    return this.repository.getAll();
  }

  create(title: string, description: string) {
    return this.repository.create(title, description);
  }

  get(id: number) {
    return this.repository.get(id);
  }

  blocks(id: number) {
    return this.repository.blocks(id);
  }
}
