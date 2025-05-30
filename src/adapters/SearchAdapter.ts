import { Block } from "../types";

export interface SearchResult {
  id: number;
  type: "file" | "channel" | "block";
  title: string;
  subtitle?: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
}

export interface SearchOptions {
  query: string;
  types?: Array<"file" | "channel" | "block">;
  limit?: number;
  caseSensitive?: boolean;
  fuzzyMatch?: boolean;
}

export interface ISearchAdapter {
  search(options: SearchOptions): SearchResult[];
  addToIndex(items: Block[]): void;
  removeFromIndex(itemIds: number[]): void;
  clearIndex(): void;
  updateIndex(items: Block[]): void;
}

export class SearchAdapter implements ISearchAdapter {
  private fileIndex: Block[] = [];
  private channelIndex: Block[] = [];
  private blockIndex: Block[] = [];

  addToIndex(items: Block[]): void {
    items.forEach(item => {
      // Remove existing item if it exists
      this.removeFromIndex([item.id]);
      
      // Add to appropriate index
      if (item.block_type === "file") {
        this.fileIndex.push(item);
      } else if (item.block_type === "channel") {
        this.channelIndex.push(item);
      } else {
        this.blockIndex.push(item);
      }
    });
  }

  removeFromIndex(itemIds: number[]): void {
    const idsSet = new Set(itemIds);
    this.fileIndex = this.fileIndex.filter(item => !idsSet.has(item.id));
    this.channelIndex = this.channelIndex.filter(item => !idsSet.has(item.id));
    this.blockIndex = this.blockIndex.filter(item => !idsSet.has(item.id));
  }

  clearIndex(): void {
    this.fileIndex = [];
    this.channelIndex = [];
    this.blockIndex = [];
  }

  updateIndex(items: Block[]): void {
    this.clearIndex();
    this.addToIndex(items);
  }

  search(options: SearchOptions): SearchResult[] {
    const { query, types = ["file", "channel", "block"], limit = 50, caseSensitive = false, fuzzyMatch = true } = options;
    
    if (!query.trim()) {
      return [];
    }

    const searchQuery = caseSensitive ? query : query.toLowerCase();
    const results: SearchResult[] = [];

    // Search files
    if (types.includes("file")) {
      results.push(...this.searchFiles(searchQuery, caseSensitive, fuzzyMatch));
    }

    // Search channels
    if (types.includes("channel")) {
      results.push(...this.searchChannels(searchQuery, caseSensitive, fuzzyMatch));
    }

    // Search blocks
    if (types.includes("block")) {
      results.push(...this.searchBlocks(searchQuery, caseSensitive, fuzzyMatch));
    }

    // Sort by relevance score and limit results
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  private searchFiles(query: string, caseSensitive: boolean, fuzzyMatch: boolean): SearchResult[] {
    const results: SearchResult[] = [];
    
    for (const file of this.fileIndex) {
      const score = this.calculateRelevanceScore(
        query,
        [
          file.content.filename || "",
          file.content.path || "",
          file.content.file_type || ""
        ],
        caseSensitive,
        fuzzyMatch
      );

      if (score > 0) {
        results.push({
          id: file.id,
          type: "file",
          title: file.content.filename || `File ${file.id}`,
          subtitle: file.content.path,
          relevanceScore: score,
          metadata: {
            fileType: file.content.file_type,
            fullPath: file.content.full_path,
            ...file.content
          }
        });
      }
    }
    
    return results;
  }

  private searchChannels(query: string, caseSensitive: boolean, fuzzyMatch: boolean): SearchResult[] {
    const results: SearchResult[] = [];
    
    for (const channel of this.channelIndex) {
      const score = this.calculateRelevanceScore(
        query,
        [
          channel.content.title || "",
          channel.content.description || ""
        ],
        caseSensitive,
        fuzzyMatch
      );

      if (score > 0) {
        results.push({
          id: channel.id,
          type: "channel",
          title: channel.content.title || `Channel ${channel.id}`,
          subtitle: channel.content.description,
          relevanceScore: score,
          metadata: { ...channel.content }
        });
      }
    }
    
    return results;
  }

  private searchBlocks(query: string, caseSensitive: boolean, fuzzyMatch: boolean): SearchResult[] {
    const results: SearchResult[] = [];
    
    for (const block of this.blockIndex) {
      const searchFields = [
        String(block.id),
        block.block_type,
        ...(typeof block.content === "object" ? Object.values(block.content).map(String) : [])
      ];

      const score = this.calculateRelevanceScore(query, searchFields, caseSensitive, fuzzyMatch);

      if (score > 0) {
        results.push({
          id: block.id,
          type: "block",
          title: `Block ${block.id}`,
          subtitle: `Type: ${block.block_type}`,
          relevanceScore: score,
          metadata: { blockType: block.block_type, ...block.content }
        });
      }
    }
    
    return results;
  }

  private calculateRelevanceScore(
    query: string,
    searchFields: string[],
    caseSensitive: boolean,
    fuzzyMatch: boolean
  ): number {
    let maxScore = 0;

    for (const field of searchFields) {
      const fieldValue = caseSensitive ? field : field.toLowerCase();
      let score = 0;

      // Exact match gets highest score
      if (fieldValue === query) {
        score = 100;
      }
      // Starts with query gets high score
      else if (fieldValue.startsWith(query)) {
        score = 80;
      }
      // Contains query gets medium score
      else if (fieldValue.includes(query)) {
        score = 60;
      }
      // Fuzzy match gets lower score
      else if (fuzzyMatch && this.fuzzyMatch(query, fieldValue)) {
        score = 30;
      }

      maxScore = Math.max(maxScore, score);
    }

    return maxScore;
  }

  private fuzzyMatch(query: string, text: string): boolean {
    const queryChars = query.split("");
    let textIndex = 0;

    for (const char of queryChars) {
      const foundIndex = text.indexOf(char, textIndex);
      if (foundIndex === -1) {
        return false;
      }
      textIndex = foundIndex + 1;
    }

    return true;
  }
}

// Singleton instance
export const searchAdapter = new SearchAdapter(); 