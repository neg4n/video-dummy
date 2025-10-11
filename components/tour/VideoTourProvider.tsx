"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { normalizeProps, Portal, useMachine } from "@zag-js/react";
import * as tour from "@zag-js/tour";

const TOUR_STORAGE_KEY = "video-dummy-tour-status";

type TourContextValue = {
  startTour: (stepId?: string) => void;
  restartTour: () => void;
  isTourOpen: boolean;
};

const TourContext = createContext<TourContextValue | null>(null);

type TourApi = ReturnType<typeof tour.connect>;

const getElement = (selector: string) => () =>
  document.querySelector<HTMLElement>(selector);

const createTourSteps = (): tour.StepDetails[] => [
  {
    id: "intro",
    type: "dialog",
    title: "Welcome aboard",
    description:
      "This simple application renders videos with different settings, formats and codecs right in your browser. It is perfect for Software Engineers in Test, QA engineers or just developers with need to test how various videos are displayed inside their piece of work. Follow the tour to quickly get familiar with the interface.",
      
    backdrop: true,
    actions: [
      { label: "Skip tour", action: "dismiss" },
      { label: "Show me around ->", action: "next" },
    ],
  },
  {
    id: "settings",
    title: "Set your scene",
    description:
      "Adjust size, text, colors, and output format here. Try different aspect ratios - everything updates before the next render.",
    target: getElement("[data-tour-target='settings-panel']"),
    placement: "right",
    backdrop: true,
    actions: [
      { label: "<- Back", action: "prev" },
      { label: "Next ->", action: "next" },
    ],
  },
  {
    id: "preview",
    title: "Watch the frame",
    description:
      "Your video lands here when it is ready. Until then the grey placeholder holds the space so the layout stays steady.",
    target: getElement("[data-tour-target='preview-panel']"),
    placement: "left",
    backdrop: true,
    actions: [
      { label: "<- Back", action: "prev" },
      { label: "Next ->", action: "next" },
    ],
  },
  {
    id: "generate",
    title: "Render on demand",
    description:
    "Press 'Generate Video' to render. After the first run the button turns to 'Regenerate' so you can refresh edits quickly.",
    
    target: getElement("[data-tour-target='generate-button']"),
    placement: "top",
    backdrop: true,
    actions: [
      { label: "<- Back", action: "prev" },
      { label: "Next ->", action: "next" },
    ],
  },
  {
    id: "download",
    title: "Save your clip",
    description:
      "Name the file and download it once the render finishes.",
    target: getElement("[data-tour-target='download-button']"),
    placement: "top",
    backdrop: true,
    actions: [
      { label: "<- Back", action: "prev" },
      { label: "Next ->", action: "next" },
    ],
  },
  {
    id: "restart",
    title: "Need a refresher?",
    description:
      "Tap the question mark any time to replay these tips. Click the info button on the rightmost section in the window title's button group to get to know how does this tool work under the hood.",
    target: getElement("[data-tour-target='toolbar-tour-button']"),
    placement: "bottom",
    backdrop: true,
    actions: [
      { label: "<- Back", action: "prev" },
      { label: "Finish", action: "dismiss" },
    ],
  },
];

function TourOverlay({ api }: { api: TourApi }) {
  if (!api.open || api.totalSteps === 0) {
    return null;
  }

  const step = api.step;
  const actions = step?.actions ?? [];

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      <div
        {...api.getBackdropProps()}
        className="pointer-events-auto bg-black/50 transition-opacity duration-150"
      />
      <div
        {...api.getSpotlightProps()}
        className="border border-yellow-400 shadow-[0_0_0_2px_rgba(255,255,255,0.85)] transition-all duration-150"
      />
      <div {...api.getPositionerProps()} className="pointer-events-none flex justify-center">
        <div
          {...api.getContentProps()}
          className="pointer-events-auto relative z-50 min-w-[260px] max-w-xs bg-gray-200 border-2 border-gray-400 shadow-[4px_4px_0px_0px_rgba(255,255,255,1),-4px_-4px_0px_0px_rgba(0,0,0,0.35)]"
        >
          <div className="bg-blue-800 text-white font-bold px-2 py-1 flex items-center justify-between">
            <span {...api.getTitleProps()} className="text-sm">
              {step?.title}
            </span>
            <button
              {...api.getCloseTriggerProps()}
              className="ml-2 h-6 w-6 bg-gray-200 text-black leading-none border-2 border-gray-400 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.25),-1px_-1px_0px_0px_rgba(255,255,255,1)]"
            >
              ×
            </button>
          </div>
          <div className="p-3 space-y-3">
            <p
              {...api.getDescriptionProps()}
              className="text-sm leading-snug text-black"
            >
              {step?.description}
            </p>
            {actions.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-end">
                {actions.map((action) => (
                  <button
                    key={action.label}
                    {...api.getActionTriggerProps({ action })}
                    className="bg-gray-200 text-black px-2 py-1 text-sm border-2 border-gray-400 shadow-[2px_2px_0px_0px_rgba(255,255,255,1),-2px_-2px_0px_0px_rgba(0,0,0,0.25)] disabled:opacity-50"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
            <p
              {...api.getProgressTextProps()}
              className="text-xs text-gray-700"
            >
              Step {api.stepIndex + 1} of {api.totalSteps}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VideoTourProvider({ children }: { children: ReactNode }) {
  const stepsRef = useRef<tour.StepDetails[]>(createTourSteps());
  const startAttemptedRef = useRef(false);
  const tourId = useId();

  const service = useMachine(tour.machine, {
    id: tourId,
    steps: stepsRef.current,
    spotlightRadius: 0,
    onStatusChange(details) {
      if (typeof window === "undefined") return;

      if (details.status === "completed" || details.status === "dismissed") {
        window.localStorage.setItem(TOUR_STORAGE_KEY, "seen");
      }
    },
    translations: {
      close: "Close tour",
      nextStep: "Next step",
      prevStep: "Previous step",
      progressText: ({ current, total }) => {
        if (total === 0) return "";
        const safeIndex = Math.min(Math.max(current, 0), Math.max(total - 1, 0));
        return `Step ${safeIndex + 1} of ${total}`;
      },
    },
  });

  const api = useMemo(() => tour.connect(service, normalizeProps), [service]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (startAttemptedRef.current) return;

    const hasSeenTour = window.localStorage.getItem(TOUR_STORAGE_KEY) === "seen";
    if (hasSeenTour) return;

    const timeoutId = window.setTimeout(() => {
      startAttemptedRef.current = true;
      api.start();
    }, 180);
    return () => window.clearTimeout(timeoutId);
  }, [api]);

  const contextValue: TourContextValue = {
    startTour: (stepId) => {
      startAttemptedRef.current = true;
      api.start(stepId);
    },
    restartTour: () => {
      startAttemptedRef.current = true;
      api.start();
    },
    isTourOpen: api.open,
  };

  return (
    <TourContext.Provider value={contextValue}>
      {children}
      {api.open && api.step ? (
        <Portal>
          <TourOverlay api={api} />
        </Portal>
      ) : null}
    </TourContext.Provider>
  );
}

export function useVideoTour() {
  const context = useContext(TourContext);

  if (!context) {
    throw new Error("useVideoTour must be used within a VideoTourProvider.");
  }

  return context;
}
