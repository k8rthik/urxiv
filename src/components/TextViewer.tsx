import React, { useState, useEffect, useRef } from "react";
import { getFileExtension } from "@/lib/utils";
import { CircleNotch } from "lucide-react";

interface TextViewerProps {
  fileData: Uint8Array;
  filename: string;
  onTextSelection?: (text: string, lineNumber?: number) => void;
}

interface LinePosition {
  lineNumber: number;
  startPos: number;
  endPos: number;
}

const TextViewer: React.FC<TextViewerProps> = ({
  fileData,
  filename,
  onTextSelection,
}) => {
  const [text, setText] = useState<string>("");
  const [lines, setLines] = useState<string[]>([]);
  const [linePositions, setLinePositions] = useState<LinePosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Process file data when it changes
  useEffect(() => {
    if (!fileData.length) return;

    setIsLoading(true);
    setError(null);

    try {
      // Convert Uint8Array to string
      const decoder = new TextDecoder("utf-8");
      const content = decoder.decode(fileData);
      setText(content);

      // Split content into lines
      const contentLines = content.split(/\r?\n/);
      setLines(contentLines);

      // Calculate line positions for mapping selections to line numbers
      const positions: LinePosition[] = [];
      let currentPos = 0;

      for (let i = 0; i < contentLines.length; i++) {
        const lineLength = contentLines[i].length;
        positions.push({
          lineNumber: i + 1,
          startPos: currentPos,
          endPos: currentPos + lineLength,
        });
        // +1 for the newline character
        currentPos += lineLength + 1;
      }

      setLinePositions(positions);
    } catch (err) {
      console.error("Error processing text file:", err);
      setError(
        "Failed to load file. The file might use an unsupported encoding.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [fileData]);

  // Handle text selection
  const handleMouseUp = () => {
    if (!onTextSelection) return;

    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const selectedText = selection.toString().trim();

      if (selectedText) {
        // Try to determine the line number of the selection
        let lineNumber: number | undefined = undefined;

        if (selection.anchorNode?.parentElement) {
          // Look for line number attribute in parent elements
          const lineElement =
            selection.anchorNode.parentElement.closest("[data-line-number]");
          if (lineElement) {
            lineNumber = parseInt(
              lineElement.getAttribute("data-line-number") || "0",
            );
          } else {
            // Alternatively, try to estimate line number from selection position
            const selectionStart = selection.anchorOffset;
            const textBeforeSelection = text.substring(0, selectionStart);
            const linesBeforeSelection =
              textBeforeSelection.split(/\r?\n/).length;
            lineNumber = linesBeforeSelection;
          }
        }

        onTextSelection(selectedText, lineNumber);
      }
    }
  };

  // Check if file is likely a code file
  const isCodeFile = () => {
    const ext = getFileExtension(filename);
    return [
      "js",
      "ts",
      "jsx",
      "tsx",
      "py",
      "rs",
      "go",
      "c",
      "cpp",
      "h",
      "java",
      "cs",
      "php",
      "rb",
      "swift",
      "kt",
      "scala",
      "html",
      "css",
      "scss",
      "json",
      "xml",
      "yaml",
      "yml",
      "toml",
    ].includes(ext);
  };

  // Toggle line numbers
  const toggleLineNumbers = () => {
    setShowLineNumbers(!showLineNumbers);
  };

  // Scroll to specific line
  const scrollToLine = (lineNumber: number) => {
    if (!containerRef.current) return;

    const lineElement = containerRef.current.querySelector(
      `[data-line-number="${lineNumber}"]`,
    );
    if (lineElement) {
      lineElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-900">
        <div className="text-center">
          <CircleNotch className="animate-spin h-8 w-8 mb-2 mx-auto text-blue-500" />
          <p className="text-zinc-300">Loading file...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-900">
        <div className="text-center max-w-md p-4">
          <p className="text-red-500 mb-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Text viewer controls */}
      <div className="flex justify-between items-center p-2 border-b border-zinc-800 bg-zinc-900">
        <div className="text-sm text-zinc-400">
          {filename} ({lines.length} lines)
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleLineNumbers}
            className="px-2 py-1 text-xs bg-zinc-800 rounded-md"
          >
            {showLineNumbers ? "Hide Line Numbers" : "Show Line Numbers"}
          </button>
        </div>
      </div>

      {/* Text content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-0 font-mono text-sm bg-zinc-900"
        onMouseUp={handleMouseUp}
      >
        <pre className="min-w-full p-4">
          <code
            className={`language-${isCodeFile() ? getFileExtension(filename) : "text"}`}
          >
            {lines.map((line, index) => (
              <div
                key={index}
                className="flex hover:bg-zinc-800/30"
                data-line-number={index + 1}
              >
                {showLineNumbers && (
                  <span className="inline-block text-right w-12 mr-4 text-zinc-500 select-none">
                    {index + 1}
                  </span>
                )}
                <span className="flex-1 whitespace-pre">{line}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default TextViewer;
