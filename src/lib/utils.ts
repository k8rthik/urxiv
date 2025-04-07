/**
 * Utility function to combine class names
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Utility function to determine icon for a file type
 */
export function getFileIcon(fileType: string) {
  switch (fileType.toLowerCase()) {
    case "pdf":
      return "file-text";
    case "epub":
      return "book-open";
    case "text":
    case "txt":
    case "md":
    case "markdown":
      return "file-text";
    case "code":
    case "rs":
    case "js":
    case "ts":
    case "py":
    case "java":
    case "c":
    case "cpp":
    case "h":
    case "html":
    case "css":
      return "file-code";
    case "image":
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
      return "image";
    default:
      return "file";
  }
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string): string {
  if (typeof date === "string") {
    date = new Date(date);
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date to include time
 */
export function formatDateTime(date: Date | string): string {
  if (typeof date === "string") {
    date = new Date(date);
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Truncate text to a specified length
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Extracts the filename from a path
 */
export function getFilenameFromPath(path: string): string {
  if (!path) return "";
  return path.split(/[/\\]/).pop() || path;
}

/**
 * Get a file extension
 */
export function getFileExtension(filename: string): string {
  if (!filename) return "";
  return filename.split(".").pop()?.toLowerCase() || "";
}

/**
 * Get file type from extension
 */
export function getFileType(filename: string): string {
  const ext = getFileExtension(filename);

  // Text files
  if (["txt", "md", "markdown", "text"].includes(ext)) {
    return "text";
  }

  // Code files
  if (
    [
      "js",
      "ts",
      "jsx",
      "tsx",
      "py",
      "rs",
      "go",
      "java",
      "c",
      "cpp",
      "h",
      "cs",
      "html",
      "css",
      "json",
      "yaml",
      "yml",
      "toml",
      "xml",
    ].includes(ext)
  ) {
    return "code";
  }

  // PDF files
  if (ext === "pdf") {
    return "pdf";
  }

  // eBook files
  if (["epub", "mobi"].includes(ext)) {
    return "ebook";
  }

  // Image files
  if (["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"].includes(ext)) {
    return "image";
  }

  return "file";
}

/**
 * Create a unique ID for temporary use (client-side only)
 */
export function createTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Extract text portion around a match for context
 */
export function extractTextContext(
  text: string,
  match: string,
  contextLength: number = 100,
): string {
  if (!text || !match) return "";

  const matchIndex = text.indexOf(match);
  if (matchIndex === -1) return "";

  const startIndex = Math.max(0, matchIndex - contextLength);
  const endIndex = Math.min(
    text.length,
    matchIndex + match.length + contextLength,
  );

  let context = text.substring(startIndex, endIndex);

  // Add ellipsis if we're not at the beginning or end
  if (startIndex > 0) {
    context = "..." + context;
  }

  if (endIndex < text.length) {
    context = context + "...";
  }

  return context;
}

/**
 * Check if a text value is empty or just whitespace
 */
export function isEmpty(text: string | null | undefined): boolean {
  return text === null || text === undefined || text.trim() === "";
}

/**
 * Convert a buffer to a base64 string (for displaying PDFs, images, etc.)
 */
export function bufferToBase64(buffer: Uint8Array): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;

  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return window.btoa(binary);
}

/**
 * Convert a byte array to a data URL for rendering
 */
export function bytesToDataUrl(bytes: Uint8Array, mimeType: string): string {
  const base64 = bufferToBase64(bytes);
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(filename: string): string {
  const ext = getFileExtension(filename);

  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "txt":
      return "text/plain";
    case "html":
      return "text/html";
    case "css":
      return "text/css";
    case "js":
      return "application/javascript";
    case "json":
      return "application/json";
    case "xml":
      return "application/xml";
    default:
      return "application/octet-stream";
  }
}
