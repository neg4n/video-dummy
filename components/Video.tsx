"use client";

import React, { useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFFMPEG } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";

const formSchema = z.object({
  width: z.number().int().positive().max(7680),
  height: z.number().int().positive().max(4320),
  text: z.string().max(100),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

type FormData = z.infer<typeof formSchema>;

export function VideoToolPanel() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { ffmpeg } = useFFMPEG();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      width: 1920,
      height: 1080,
      text: "Hello, World!",
      backgroundColor: "#0000FF",
    },
  });

  const width = watch("width");
  const height = watch("height");

  const generateVideo = useCallback(
    async (data: FormData) => {
      if (!ffmpeg) {
        console.error("FFmpeg is not loaded yet");
        return;
      }

      setIsGenerating(true);
      setSuccessMessage(null);

      try {
        await ffmpeg.writeFile(
          "arial.ttf",
          await fetchFile(
            "https://raw.githubusercontent.com/ffmpegwasm/testdata/master/arial.ttf",
          ),
        );

        await ffmpeg.exec([
          "-f",
          "lavfi",
          "-i",
          `color=c=${data.backgroundColor.substring(1)}:s=${data.width}x${data.height}:d=5`,
          "-vf",
          `drawtext=fontfile=/arial.ttf:text='${data.text}':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2`,
          "-c:v",
          "libx264",
          "-t",
          "5",
          "output.mp4",
        ]);

        const outputData = await ffmpeg.readFile("output.mp4");
        const blob = new Blob([outputData], { type: "video/mp4" });
        const url = URL.createObjectURL(blob);
        setVideoSrc(url);
        setSuccessMessage("Video generated successfully!");
      } catch (error) {
        console.error("Error generating video:", error);
        setSuccessMessage("Error generating video. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    },
    [ffmpeg],
  );

  const onSubmit = (data: FormData) => {
    generateVideo(data);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-1/2">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-gray-100 border-2 border-gray-400 shadow-[2px_2px_0px_0px_rgba(255,255,255,1),-2px_-2px_0px_0px_rgba(0,0,0,0.25)]"
        >
          <div className="bg-blue-800 text-white font-bold px-2 py-1 mb-2">
            Video Settings
          </div>
          <div className="p-2 space-y-4">
            <div>
              <label className="block mb-2">Video Dimensions:</label>
              <div className="flex items-center">
                <input
                  type="number"
                  {...register("width", { valueAsNumber: true })}
                  className="w-16 px-1 py-0.5 border border-gray-400 focus:outline-none focus:border-blue-500"
                />
                <span className="mx-2">x</span>
                <input
                  type="number"
                  {...register("height", { valueAsNumber: true })}
                  className="w-16 px-1 py-0.5 border border-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              {errors.width && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.width.message}
                </p>
              )}
              {errors.height && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.height.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-2">Video Text:</label>
              <input
                type="text"
                {...register("text")}
                className="w-full px-1 py-0.5 border border-gray-400 focus:outline-none focus:border-blue-500"
              />
              {errors.text && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.text.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-2">Background Color:</label>
              <input
                type="color"
                {...register("backgroundColor")}
                className="w-full h-8 border border-gray-400"
              />
              {errors.backgroundColor && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.backgroundColor.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full bg-gray-300 border-2 border-gray-400 px-4 py-1 active:shadow-[1px_1px_0px_0px_rgba(255,255,255,1),-1px_-1px_0px_0px_rgba(0,0,0,0.25)] shadow-[2px_2px_0px_0px_rgba(255,255,255,1),-2px_-2px_0px_0px_rgba(0,0,0,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? "Generating..." : "Generate Video"}
            </button>
          </div>
          {successMessage && (
            <div className="bg-gray-300 border-t-2 border-gray-400 px-2 py-1 text-sm">
              {successMessage}
            </div>
          )}
        </form>
      </div>
      <div className="w-full md:w-1/2">
        <VideoPreview videoSrc={videoSrc} width={width} height={height} />
      </div>
    </div>
  );
}

type VideoPreviewProps = {
  videoSrc: string | null;
  width: number;
  height: number;
};

function VideoPreview({ videoSrc, width, height }: VideoPreviewProps) {
  const handleDownload = () => {
    if (!videoSrc) return;

    const a = document.createElement("a");
    a.href = videoSrc;
    a.download = "generated_video.mp4";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-gray-100 border-2 border-gray-400 shadow-[2px_2px_0px_0px_rgba(255,255,255,1),-2px_-2px_0px_0px_rgba(0,0,0,0.25)]">
      <div className="bg-blue-800 text-white font-bold px-2 py-1 mb-2">
        Video Preview
      </div>
      <div className="p-2 space-y-4">
        <div className="aspect-w-16 aspect-h-9">
          {videoSrc ? (
            <video
              src={videoSrc}
              controls
              className="w-full h-full object-contain"
              style={{ aspectRatio: `${width} / ${height}` }}
            />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600">
              No video generated yet
            </div>
          )}
        </div>
        <button
          onClick={handleDownload}
          disabled={!videoSrc}
          className="w-full bg-gray-300 border-2 border-gray-400 px-4 py-1 active:shadow-[1px_1px_0px_0px_rgba(255,255,255,1),-1px_-1px_0px_0px_rgba(0,0,0,0.25)] shadow-[2px_2px_0px_0px_rgba(255,255,255,1),-2px_-2px_0px_0px_rgba(0,0,0,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Download Video
        </button>
      </div>
    </div>
  );
}
