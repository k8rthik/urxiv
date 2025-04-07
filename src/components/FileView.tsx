import React, { useState, useEffect } from "react";
import { Block } from "@/lib/types";
import { invokeTauri, isTauriAvailable } from "@/lib/tauri";
import { Plus, X, Save, MessageSquare, ExternalLink } from "lucide-react";
import PDFViewer from "./PDFViewer";
import TextViewer from "./TextViewer";
import { getMimeType, bytesToDataUrl } from "@/lib/utils";

interface FileViewProps {
  file: Block | null;
  onAddAnnotation?: (annotation: Block) => void;
  onClose?: () => void;
}

interface Annotation {
  position: number; // Position in file (could be page number, line number, etc.)
  text: string; // The annotation text
  selectedText?: string; // Optional text that was selected
}

const FileView: React.FC<FileViewProps> = ({
  file,
  onAddAnnotation,
  onClose,
}) => {
  const [fileContent, setFileContent] = useState<Uint8Array | null>(null);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation>({
    position: 0,
    text: "",
    selectedText: "",
  });
  const [fileAnnotations, setFileAnnotations] = useState<Block[]>([]);
  const [selectedText, setSelectedText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLine, setCurrentLine] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnnotations, setShowAnnotations] = useState(true);

  // Load file content when file changes
  useEffect(() => {
    const loadFileContent = async () => {
      if (!file) return;

      setIsLoading(true);
      setError(null);

      try {
        const filePath = file.content.full_path as string;

        if (isTauriAvailable()) {
          try {
            // First try using the custom command
            const content = await invokeTauri<Uint8Array>("get_file_content", {
              filePath: filePath,
            });
            setFileContent(content);
          } catch (e) {
            console.error("Error using get_file_content:", e);

            // Try using the Tauri 2 standard API
            try {
              const fs = (window.__TAURI__ as any).fs;
              if (fs && fs.readBinaryFile) {
                const content = await fs.readBinaryFile(filePath);
                setFileContent(content);
              } else {
                throw new Error("Tauri file system API not available");
              }
            } catch (fsError) {
              console.error("Error using fs.readBinaryFile:", fsError);
              throw new Error("Failed to read file using available APIs");
            }
          }
        } else {
          // Mock data for development
          const mockText = "This is mock file content for development.";
          setFileContent(new TextEncoder().encode(mockText));
        }

        // Load existing annotations for this file
        await loadAnnotations();
      } catch (err) {
        console.error("Error loading file:", err);
        setError("Failed to load file content. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadFileContent();
  }, [file]);

  // Load existing annotations for this file
  const loadAnnotations = async () => {
    if (!file) return;

    try {
      // Search for annotations that reference this file
      const annotations = await invokeTauri<Block[]>("get_file_annotations", {
        fileId: file.id,
      });

      setFileAnnotations(annotations);
    } catch (err) {
      console.error("Error loading annotations:", err);

      // For development/fallback
      if (!isTauriAvailable()) {
        setFileAnnotations([]);
      }
    }
  };

  // Handle text selection from PDF or text viewers
  const handleTextSelection = (text: string, position?: number) => {
    if (text) {
      setSelectedText(text);

      // If position is provided (like a line number), update current position
      if (position) {
        setCurrentLine(position);
      }
    }
  };

  // Handle page change in PDF viewer
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Start creating an annotation
  const handleStartAnnotation = () => {
    setIsAnnotating(true);

    // Determine the position based on file type
    const position =
      file?.content.file_type === "pdf" ? currentPage : currentLine;

    setCurrentAnnotation({
      position: position || 0,
      text: "",
      selectedText: selectedText,
    });
  };

  // Cancel annotation creation
  const handleCancelAnnotation = () => {
    setIsAnnotating(false);
    setCurrentAnnotation({
      position: 0,
      text: "",
      selectedText: "",
    });
  };

  // Save the annotation
  const handleSaveAnnotation = async () => {
    if (!file || !currentAnnotation.text.trim()) return;

    try {
      // Create a new annotation using the annotation command
      const annotationBlock = await invokeTauri<Block>("create_annotation", {
        textContent: currentAnnotation.text,
        sourceFileId: file.id,
        position: currentAnnotation.position,
        selectedText: currentAnnotation.selectedText || null,
        parentChannelId: null, // Not adding to a channel by default
      });

      // Add to local state
      setFileAnnotations([...fileAnnotations, annotationBlock]);

      // Notify parent component if callback exists
      if (onAddAnnotation) {
        onAddAnnotation(annotationBlock);
      }

      // Reset annotation state
      setIsAnnotating(false);
      setCurrentAnnotation({
        position: 0,
        text: "",
        selectedText: "",
      });
      setSelectedText("");
    } catch (err) {
      console.error("Error creating annotation:", err);
      // Fallback for non-Tauri environment - mock behavior for development
      if (!isTauriAvailable()) {
        const mockBlock: Block = {
          id: Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          block_type: "annotation",
          content: {
            text: currentAnnotation.text,
            source_file_id: file.id,
            source_file_name: file.content.filename,
            position: currentAnnotation.position,
            selected_text: currentAnnotation.selectedText || null,
            annotation_type: "note",
          },
          connections: [file.id],
        };

        setFileAnnotations([...fileAnnotations, mockBlock]);

        if (onAddAnnotation) {
          onAddAnnotation(mockBlock);
        }

        setIsAnnotating(false);
        setCurrentAnnotation({
          position: 0,
          text: "",
          selectedText: "",
        });
        setSelectedText("");
      }
    }
  };

  // Open file with system default application
  const handleOpenExternally = async () => {
    if (!file || !isTauriAvailable()) return;

    try {
      // Try to use the Tauri 2 shell API
      if (
        (window.__TAURI__ as any).shell &&
        (window.__TAURI__ as any).shell.open
      ) {
        await (window.__TAURI__ as any).shell.open(file.content.full_path);
      } else {
        console.error("Tauri shell API not available");
      }
    } catch (error) {
      console.error("Error opening file with default application:", error);
    }
  };

  // Toggle annotations sidebar
  const toggleAnnotations = () => {
    setShowAnnotations(!showAnnotations);
  };

  // Render file content based on file type
  const renderFileContent = () => {
    if (!file || !fileContent) return null;

    const fileType = file.content.file_type;

    switch (fileType) {
      case "pdf":
        return (
          <PDFViewer
            fileData={fileContent}
            onTextSelection={handleTextSelection}
            onPageChange={handlePageChange}
          />
        );

      case "text":
      case "code":
        return (
          <TextViewer
            fileData={fileContent}
            filename={file.content.filename}
            onTextSelection={handleTextSelection}
          />
        );

      case "image":
        const mimeType = getMimeType(file.content.filename);
        const dataUrl = bytesToDataUrl(fileContent, mimeType);

        return (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900 p-4 overflow-auto">
            <img
              src={dataUrl}
              alt={file.content.filename}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
            <div className="text-zinc-400 text-center p-6">
              <p className="mb-4">Preview not available for this file type.</p>
              <button
                className="px-4 py-2 bg-white text-black rounded-sm text-sm font-medium flex items-center gap-2 mx-auto"
                onClick={handleOpenExternally}
              >
                <ExternalLink size={16} />
                Open with default application
              </button>
            </div>
          </div>
        );
    }
  };

  // If no file is selected
  if (!file) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
        <div className="text-zinc-400">No file selected</div>
      </div>
    );
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
        <div className="text-zinc-400">Loading file...</div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* File header with controls */}
      <div className="bg-zinc-800 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">{file.content.filename}</h2>
          <p className="text-xs text-zinc-400">{file.content.path}</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedText && !isAnnotating && (
            <button
              onClick={handleStartAnnotation}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-sm text-sm font-medium flex items-center gap-1"
            >
              <MessageSquare size={16} /> Annotate Selection
            </button>
          )}
          {!isAnnotating && (
            <button
              onClick={handleStartAnnotation}
              className="px-3 py-1.5 bg-white text-black rounded-sm text-sm font-medium flex items-center gap-1"
            >
              <Plus size={16} /> Add Annotation
            </button>
          )}
          <button
            onClick={toggleAnnotations}
            className="px-3 py-1.5 border border-zinc-700 rounded-sm text-sm"
            title={showAnnotations ? "Hide annotations" : "Show annotations"}
          >
            {showAnnotations ? "Hide Notes" : "Show Notes"}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white"
            title="Close file"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main content area - split between file viewer and annotations */}
      <div className="flex-1 flex overflow-hidden">
        {/* File content area */}
        <div
          className={`${showAnnotations ? "flex-1" : "w-full"} overflow-hidden`}
        >
          {renderFileContent()}
        </div>

        {/* Annotation area - fixed width sidebar */}
        {showAnnotations && (
          <div className="w-80 border-l border-zinc-800 bg-zinc-900 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-4">
                Annotations
              </h3>

              {/* Annotation creation form */}
              {isAnnotating && (
                <div className="mb-6 bg-zinc-800 p-3 rounded">
                  <div className="mb-3">
                    {currentAnnotation.selectedText && (
                      <div className="mb-2 text-xs bg-zinc-700 p-2 rounded">
                        <div className="text-zinc-400 mb-1">Selected text:</div>
                        <div className="italic text-zinc-300">
                          {currentAnnotation.selectedText}
                        </div>
                      </div>
                    )}
                    <textarea
                      value={currentAnnotation.text}
                      onChange={(e) =>
                        setCurrentAnnotation({
                          ...currentAnnotation,
                          text: e.target.valueue,
                        })
                      }
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-sm text-white resize-none mb-2"
                      placeholder="Enter your annotation..."
                      rows={4}
                    />
                    <div className="text-xs text-zinc-400">
                      {file.content.file_type === "pdf"
                        ? `Page ${currentPage}`
                        : `Line ${currentLine || "unknown"}`}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <button
                      onClick={handleCancelAnnotation}
                      className="px-3 py-1.5 bg-zinc-700 text-zinc-300 rounded-sm text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveAnnotation}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-sm text-xs font-medium flex items-center gap-1"
                    >
                      <Save size={14} /> Save
                    </button>
                  </div>
                </div>
              )}

              {/* List of existing annotations */}
              <div className="space-y-3">
                {fileAnnotations.length === 0 ? (
                  <div className="text-zinc-500 text-sm text-center py-6">
                    No annotations yet
                  </div>
                ) : (
                  fileAnnotations.map((annotation) => (
                    <div
                      key={annotation.id}
                      className="bg-zinc-800 p-3 rounded"
                    >
                      {annotation.content.selected_text && (
                        <div className="mb-2 text-xs bg-zinc-700 p-2 rounded italic text-zinc-300">
                          "{annotation.content.selected_text}"
                        </div>
                      )}
                      <div className="text-sm text-zinc-300 mb-2">
                        {annotation.content.text}
                      </div>
                      <div className="flex justify-between text-xs text-zinc-500">
                        <div>
                          {file.content.file_type === "pdf"
                            ? `Page ${annotation.content.position}`
                            : `Line ${annotation.content.position}`}
                        </div>
                        <div>
                          {new Date(annotation.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileView;
