"use client";

import { useVideoTour } from "./VideoTourProvider";

export function TourRestartButton() {
  const { restartTour } = useVideoTour();

  return (
    <button
      type="button"
      onClick={() => restartTour()}
      aria-label="Reopen guided tour"
      data-tour-target="toolbar-tour-button"
      className="h-6 w-6 flex items-center justify-center bg-gray-200 text-black font-bold leading-none border-2 border-gray-400 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.25),-1px_-1px_0px_0px_rgba(255,255,255,1)] hover:bg-gray-100"
    >
      ?
    </button>
  );
}
