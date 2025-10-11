"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

type IdleCallbackWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

export function useFFMPEG() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const loadingPromiseRef = useRef<Promise<FFmpeg> | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current) {
      setLoaded(true);
      return ffmpegRef.current;
    }

    if (!loadingPromiseRef.current) {
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

      loadingPromiseRef.current = (async () => {
        const instance = new FFmpeg();

        await instance.load({
          coreURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.js`,
            "text/javascript",
          ),
          wasmURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            "application/wasm",
          ),
        });

        ffmpegRef.current = instance;
        return instance;
      })();
    }

    const instance = await loadingPromiseRef.current;
    ffmpegRef.current = instance;
    setLoaded(true);
    return instance;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const idleWindow = window as IdleCallbackWindow;

    if (typeof idleWindow.requestIdleCallback === "function") {
      const idleHandle = idleWindow.requestIdleCallback(() => {
        void loadFFmpeg();
      });

      return () => {
        if (typeof idleWindow.cancelIdleCallback === "function") {
          idleWindow.cancelIdleCallback(idleHandle);
        }
      };
    }

    const timeoutHandle = idleWindow.setTimeout(() => {
      void loadFFmpeg();
    }, 1);

    return () => {
      idleWindow.clearTimeout(timeoutHandle);
    };
  }, [loadFFmpeg]);

  return { ffmpeg: ffmpegRef.current, loaded, getFFMPEG: loadFFmpeg };
}
