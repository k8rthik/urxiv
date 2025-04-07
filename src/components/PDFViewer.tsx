import React, { useState, useEffect, useRef } from "react";
import { bytesToDataUrl } from "@/lib/utils";
import { CircleNotch, ChevronLeft, ChevronRight } from "lucide-react";

interface PDFViewerProps {
  fileData: Uint8Array;
  onTextSelection?: (text: string) => void;
  onPageChange?: (page: number) => void;
}

// Define a window type that includes the PDF.js library
declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  fileData,
  onTextSelection,
  onPageChange,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load the PDF.js library if it's not already loaded
  useEffect(() => {
    const loadPDFJS = async () => {
      if (!window.pdfjsLib) {
        try {
          // Try to load PDF.js from CDN
          const script = document.createElement("script");
          script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.5.141/pdf.min.js";
          script.onload = () => {
            if (window.pdfjsLib) {
              window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.5.141/pdf.worker.min.js";
              loadPDF();
            }
          };
          script.onerror = () => {
            setError("Failed to load PDF.js library. Please try again later.");
            setIsLoading(false);
          };
          document.head.appendChild(script);
        } catch (err) {
          console.error("Error loading PDF.js:", err);
          setError("Failed to load PDF viewer. Please try again later.");
          setIsLoading(false);
        }
      } else {
        loadPDF();
      }
    };

    loadPDFJS();
  }, []);

  // Load the PDF document when fileData changes or PDF.js is loaded
  const loadPDF = async () => {
    if (!window.pdfjsLib || !fileData.length) return;

    setIsLoading(true);
    setError(null);

    try {
      // Convert the Uint8Array to a dataURL for PDF.js
      const dataUrl = bytesToDataUrl(fileData, "application/pdf");

      // Load the PDF document
      const loadingTask = window.pdfjsLib.getDocument({ url: dataUrl });
      const pdf = await loadingTask.promise;

      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);

      // Once we have the document, render the first page
      if (pdf) {
        renderPage(pdf, 1);
      }
    } catch (err) {
      console.error("Error loading PDF:", err);
      setError(
        "Failed to load PDF. The file might be corrupted or unsupported.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Function to render a specific page
  const renderPage = async (pdf: any, pageNumber: number) => {
    if (!canvasRef.current) return;

    try {
      // Get the page
      const page = await pdf.getPage(pageNumber);

      // Set viewport based on canvas size and scale
      const canvas = canvasRef.current;
      const viewport = page.getViewport({ scale });

      // Adjust canvas dimensions to the viewport
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render the page on the canvas
      const renderContext = {
        canvasContext: canvas.getContext("2d"),
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Enable text selection (if PDF.js TextLayer is available)
      if (window.pdfjsLib.renderTextLayer) {
        const textContent = await page.getTextContent();
        const textLayerDiv = document.getElementById("text-layer");

        if (textLayerDiv) {
          textLayerDiv.innerHTML = "";
          textLayerDiv.style.left = canvas.offsetLeft + "px";
          textLayerDiv.style.top = canvas.offsetTop + "px";
          textLayerDiv.style.height = canvas.height + "px";
          textLayerDiv.style.width = canvas.width + "px";

          window.pdfjsLib.renderTextLayer({
            textContent: textContent,
            container: textLayerDiv,
            viewport: viewport,
            textDivs: [],
          });
        }
      }
    } catch (err) {
      console.error("Error rendering PDF page:", err);
      setError(`Failed to render page ${pageNumber}`);
    }
  };

  // Change the current page
  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && pdfDocument) {
      setCurrentPage(newPage);
      renderPage(pdfDocument, newPage);

      if (onPageChange) {
        onPageChange(newPage);
      }
    }
  };

  // Handle text selection
  const handleMouseUp = () => {
    if (onTextSelection) {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        const selectedText = selection.toString().trim();
        if (selectedText) {
          onTextSelection(selectedText);
        }
      }
    }
  };

  // Zoom functions
  const zoomIn = () => {
    setScale((prev) => {
      const newScale = prev + 0.2;
      if (pdfDocument) renderPage(pdfDocument, currentPage);
      return newScale;
    });
  };

  const zoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(0.5, prev - 0.2);
      if (pdfDocument) renderPage(pdfDocument, currentPage);
      return newScale;
    });
  };

  const resetZoom = () => {
    setScale(1.2);
    if (pdfDocument) renderPage(pdfDocument, currentPage);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-900">
        <div className="text-center">
          <CircleNotch className="animate-spin h-8 w-8 mb-2 mx-auto text-blue-500" />
          <p className="text-zinc-300">Loading PDF...</p>
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
          <button
            onClick={() => loadPDF()}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-md text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* PDF Controls */}
      <div className="flex justify-between items-center p-2 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous page"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="text-sm">
            <span>Page </span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (!isNaN(page)) changePage(page);
              }}
              className="w-12 text-center bg-zinc-700 border border-zinc-600 rounded-md"
              title="Page number"
            />
            <span> of {totalPages}</span>
          </div>

          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next page"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={zoomOut} className="p-1 rounded-md" title="Zoom out">
            <span className="text-lg">−</span>
          </button>

          <button
            onClick={resetZoom}
            className="px-2 py-1 text-xs bg-zinc-800 rounded-md"
            title="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>

          <button onClick={zoomIn} className="p-1 rounded-md" title="Zoom in">
            <span className="text-lg">+</span>
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 bg-zinc-900 flex justify-center"
        onMouseUp={handleMouseUp}
      >
        <div className="relative">
          <canvas ref={canvasRef} className="shadow-lg" />
          <div
            id="text-layer"
            className="absolute top-0 left-0 overflow-hidden opacity-20 pointer-events-none"
          ></div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
