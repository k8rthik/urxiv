export interface SearchResult {
  id: number;
  type: "file" | "channel" | "block";
  title: string;
  parentTitle?: string;
} 