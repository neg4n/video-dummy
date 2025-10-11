"use client";

import { useId, useMemo, type CSSProperties } from "react";
import { normalizeProps, Portal, useMachine } from "@zag-js/react";
import * as popover from "@zag-js/popover";

export function LocalProcessingPopover() {
  const id = useId();
  const service = useMachine(popover.machine, {
    id: `local-processing-${id}`,
    portalled: true,
    modal: false,
    positioning: {
      placement: "bottom-end",
      offset: { mainAxis: 8, crossAxis: 0 },
    },
  });

  const api = useMemo(() => popover.connect(service, normalizeProps), [service]);

  return (
    <>
      <button
        {...api.getTriggerProps()}
        type="button"
        aria-label="How video-dummy processes videos"
        className="h-6 w-6 flex items-center justify-center bg-gray-200 text-black font-bold leading-none border-2 border-gray-400 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.25),-1px_-1px_0px_0px_rgba(255,255,255,1)] hover:bg-gray-100"
      >
        i
      </button>
      {api.open ? (
        <Portal>
          <div
            {...api.getPositionerProps()}
            className="pointer-events-none z-50"
          >
            <div
              {...api.getContentProps()}
              className="pointer-events-auto max-w-xs bg-gray-200 border-2 border-gray-400 shadow-[4px_4px_0px_0px_rgba(255,255,255,1),-4px_-4px_0px_0px_rgba(0,0,0,0.35)]"
              style={
                {
                  backgroundColor: "#e5e7eb",
                  "--popover-background": "#e5e7eb",
                  "--popover-shadow": "none",
                } as CSSProperties
              }
            >
              <div className="bg-blue-800 text-white font-bold px-2 py-1 flex items-center justify-between">
                <span {...api.getTitleProps()} className="text-sm">
                  Local-only rendering
                </span>
                <button
                  {...api.getCloseTriggerProps()}
                  className="ml-2 h-5 w-5 flex items-center justify-center bg-gray-200 text-black leading-none border-2 border-gray-400 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.25),-1px_-1px_0px_0px_rgba(255,255,255,1)]"
                >
                  ×
                </button>
              </div>
              <div className="p-3 text-sm text-black space-y-2">
                <p>
                  video-dummy ships FFmpeg as WebAssembly and loads it when the
                  browser is idle. No remote servers touch your footage.
                </p>
                <p>
                  Every render completes on your device, so uploads, API keys,
                  and network latency never enter the workflow.
                </p>
              </div>
            </div>
          </div>
        </Portal>
      ) : null}
    </>
  );
}
