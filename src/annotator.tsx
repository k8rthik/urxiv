import React from "react";
import ReactDOM from "react-dom/client";
import FileAnnotationManager from "./components/FileAnnotationManager";
import "./index.css";

// This is the entry point for the annotation window
function AnnotatorApp() {
  // Get the file ID that was passed to the window
  const fileId = (window as any).FILE_ID;

  if (!fileId) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <h2 className="text-xl mb-4">Error</h2>
          <p>No file ID was provided.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white">
      <FileAnnotationManager fileId={parseInt(fileId)} />
    </div>
  );
}

// Create root and render
const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <AnnotatorApp />
  </React.StrictMode>,
);
