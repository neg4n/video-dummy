import { useRef, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

export function useFFMPEG() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const loadingPromiseRef = useRef<Promise<FFmpeg> | null>(null);

  useEffect(() => {
    async function loadFFmpeg() {
      if (ffmpegRef.current) return ffmpegRef.current;

      if (!loadingPromiseRef.current) {
        loadingPromiseRef.current = (async () => {
          const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
          const newFFmpeg = new FFmpeg();

          await newFFmpeg.load({
            coreURL: await toBlobURL(
              `${baseURL}/ffmpeg-core.js`,
              "text/javascript",
            ),
            wasmURL: await toBlobURL(
              `${baseURL}/ffmpeg-core.wasm`,
              "application/wasm",
            ),
          });

          ffmpegRef.current = newFFmpeg;
          return newFFmpeg;
        })();
      }

      return loadingPromiseRef.current;
    }

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => {
        loadFFmpeg();
      });
    } else {
      setTimeout(() => {
        loadFFmpeg();
      }, 1);
    }
  }, []);

  return { ffmpeg: ffmpegRef.current };
}
