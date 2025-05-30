// src/adapters/index.ts
// Main adapters
export * from "./TauriAdapter";
export * from "./SearchAdapter";
export * from "./StateAdapter";
export * from "./ValidationAdapter";

// Browser adapters
export * from "./browserAdapters";

// Import singleton instances
import { tauriAdapter } from "./TauriAdapter";
import { searchAdapter } from "./SearchAdapter";

// Re-export singleton instances for convenience
export { tauriAdapter, searchAdapter };

// Adapter registry for dynamic loading
export class AdapterRegistry {
  private static adapters = new Map<string, any>();

  static register<T>(name: string, adapter: T): void {
    this.adapters.set(name, adapter);
  }

  static get<T>(name: string): T | undefined {
    return this.adapters.get(name);
  }

  static has(name: string): boolean {
    return this.adapters.has(name);
  }

  static remove(name: string): boolean {
    return this.adapters.delete(name);
  }

  static getAll(): Map<string, any> {
    return new Map(this.adapters);
  }

  static clear(): void {
    this.adapters.clear();
  }
}

// Initialize common adapters
AdapterRegistry.register("tauri", tauriAdapter);
AdapterRegistry.register("search", searchAdapter); 