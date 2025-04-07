import React, { useState, useEffect, useRef } from "react";

interface SplitPaneProps {
  children: [React.ReactNode, React.ReactNode]; // Exactly two children required
  direction?: "horizontal" | "vertical";
  defaultSplit?: number; // 0 to 100 (percentage)
  minSize?: number; // Minimum size of each pane in pixels
  className?: string;
}

export const SplitPane: React.FC<SplitPaneProps> = ({
  children,
  direction = "horizontal",
  defaultSplit = 50,
  minSize = 100,
  className = "",
}) => {
  const [splitPosition, setSplitPosition] = useState(defaultSplit);
  const containerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const initialPos = useRef(0);
  const initialSplit = useRef(0);

  // Apply constraints to the split position
  const constrainSplit = (position: number, containerSize: number): number => {
    const minSizePercentage = (minSize / containerSize) * 100;
    return Math.min(
      Math.max(position, minSizePercentage),
      100 - minSizePercentage,
    );
  };

  // Handle mouse down on the divider to start dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    initialPos.current = direction === "horizontal" ? e.clientX : e.clientY;
    initialSplit.current = splitPosition;

    // Prevent text selection during drag
    document.body.style.userSelect = "none";
    document.body.style.cursor =
      direction === "horizontal" ? "col-resize" : "row-resize";

    // Add event listeners for drag and end
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseUp);

    e.preventDefault();
  };

  // Handle mouse move during dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerSize =
      direction === "horizontal" ? containerRect.width : containerRect.height;
    const currentPos = direction === "horizontal" ? e.clientX : e.clientY;
    const startPos =
      direction === "horizontal" ? containerRect.left : containerRect.top;

    // Calculate the new split position in percentage
    const dragDelta = currentPos - initialPos.current;
    const dragPercentage = (dragDelta / containerSize) * 100;
    const newSplitPosition = initialSplit.current + dragPercentage;

    // Apply constraints and update state
    setSplitPosition(constrainSplit(newSplitPosition, containerSize));
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    isDragging.current = false;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";

    // Remove event listeners
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.removeEventListener("mouseleave", handleMouseUp);
  };

  // Handle window resize to ensure constraints are still applied
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;

      const containerSize =
        direction === "horizontal"
          ? containerRef.current.offsetWidth
          : containerRef.current.offsetHeight;

      setSplitPosition(constrainSplit(splitPosition, containerSize));
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [direction, splitPosition]);

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseUp);
    };
  }, []);

  // Check that exactly two children are provided
  if (!Array.isArray(children) || children.length !== 2) {
    console.error("SplitPane requires exactly two children");
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`flex ${
        direction === "horizontal" ? "flex-row" : "flex-col"
      } ${className}`}
      style={{ width: "100%", height: "100%" }}
    >
      <div
        className={`overflow-hidden ${
          direction === "horizontal" ? "h-full" : "w-full"
        }`}
        style={{
          [direction === "horizontal" ? "width" : "height"]:
            `${splitPosition}%`,
        }}
      >
        {children[0]}
      </div>

      {/* Divider */}
      <div
        ref={dividerRef}
        className={`flex items-center justify-center ${
          direction === "horizontal"
            ? "w-1 h-full cursor-col-resize"
            : "h-1 w-full cursor-row-resize"
        } bg-zinc-800 hover:bg-zinc-600 transition-colors`}
        onMouseDown={handleMouseDown}
      >
        {/* Optional divider handle indicator */}
        <div
          className={`${
            direction === "horizontal" ? "w-0.5 h-6" : "h-0.5 w-6"
          } bg-zinc-500`}
        />
      </div>

      <div
        className={`overflow-hidden ${
          direction === "horizontal" ? "h-full" : "w-full"
        }`}
        style={{
          [direction === "horizontal" ? "width" : "height"]:
            `${100 - splitPosition}%`,
        }}
      >
        {children[1]}
      </div>
    </div>
  );
};
