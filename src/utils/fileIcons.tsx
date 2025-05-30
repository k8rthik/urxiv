import React from "react";
import { File, FileCode, FileText, BookOpen, LucideIcon } from "lucide-react";

export interface FileTypeConfig {
  icon: LucideIcon;
  color?: string;
  label: string;
}

// Registry of file types - easily extensible
const FILE_TYPE_REGISTRY: Record<string, FileTypeConfig> = {
  pdf: {
    icon: File,
    color: "text-red-400",
    label: "PDF Document",
  },
  epub: {
    icon: BookOpen,
    color: "text-blue-400", 
    label: "EPUB Book",
  },
  code: {
    icon: FileCode,
    color: "text-green-400",
    label: "Code File",
  },
  text: {
    icon: FileText,
    color: "text-gray-400",
    label: "Text File",
  },
};

export class FileIconService {
  static getIcon(fileType: string, size: number = 18): React.ReactNode {
    const config = FILE_TYPE_REGISTRY[fileType] || FILE_TYPE_REGISTRY.text;
    const IconComponent = config.icon;
    const colorClass = config.color || "text-zinc-400";
    
    return <IconComponent size={size} className={colorClass} />;
  }

  static getFileTypeConfig(fileType: string): FileTypeConfig {
    return FILE_TYPE_REGISTRY[fileType] || FILE_TYPE_REGISTRY.text;
  }

  static getSupportedTypes(): string[] {
    return Object.keys(FILE_TYPE_REGISTRY);
  }

  static registerFileType(type: string, config: FileTypeConfig): void {
    FILE_TYPE_REGISTRY[type] = config;
  }
}

// Convenience function for backward compatibility
export const getFileIcon = (fileType: string, size: number = 18) => 
  FileIconService.getIcon(fileType, size); 