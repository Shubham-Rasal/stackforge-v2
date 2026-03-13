"use client";

import { useRef } from "react";

interface ResizeDividerProps {
  onDelta: (delta: number) => void;
}

export function ResizeDivider({ onDelta }: ResizeDividerProps) {
  const dragging = useRef(false);
  const lastX = useRef(0);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className="group relative z-20 w-1 shrink-0 cursor-col-resize bg-[var(--border)] transition-colors hover:bg-[var(--accent)] active:bg-[var(--accent)]"
      onPointerDown={(e) => {
        dragging.current = true;
        lastX.current = e.clientX;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        const delta = e.clientX - lastX.current;
        lastX.current = e.clientX;
        onDelta(delta);
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
    />
  );
}
