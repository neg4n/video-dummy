"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFFMPEG } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";

const formSchema = z.object({
  width: z
    .number()
    .int()
    .positive()
    .max(7680, "Video width must be less than or equal to 7680"),
  height: z
    .number()
    .int()
    .positive()
    .max(4320, "Video height must be less than or equal to 4320"),
  text: z.string().max(100),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  format: z.enum(["mp4", "webm"]),
});

type FormData = z.infer<typeof formSchema>;

export function VideoToolPanel() {
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [videoSettings, setVideoSettings] = useState<{
    width: number;
    height: number;
    format: "mp4" | "webm";
  }>({
    width: 1280,
    height: 720,
    format: "mp4",
  });
  const { ffmpeg, loaded } = useFFMPEG();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      width: 1280,
      height: 720,
      text: "Hello, World!",
      backgroundColor: "#0000FF",
      format: "mp4",
    },
  });

  const generateVideo = useCallback(
    async (data: FormData) => {
      if (!loaded || !ffmpeg) {
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

        const outputFilename = `output.${data.format}`;
        const videoCodec = data.format === "mp4" ? "libx264" : "libvpx";
        const pixelFormat = data.format === "mp4" ? "yuv420p" : "yuv420p";

        await ffmpeg.exec([
          "-f",
          "lavfi",
          "-i",
          `color=c=${data.backgroundColor.substring(1)}:s=${data.width}x${data.height}:d=2`,
          "-vf",
          `drawtext=fontfile=/arial.ttf:text='${data.text}':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2`,
          "-c:v",
          videoCodec,
          "-pix_fmt",
          pixelFormat,
          "-t",
          "2",
          ...(data.format === "mp4" ? ["-preset", "ultrafast"] : []),
          ...(data.format === "webm" ? ["-b:v", "1M"] : []),
          outputFilename,
        ]);

        const outputData = await ffmpeg.readFile(outputFilename);
        const blob = new Blob([outputData], { type: `video/${data.format}` });
        setVideoBlob(blob);
        setVideoSettings({
          width: data.width,
          height: data.height,
          format: data.format,
        });
        setSuccessMessage("Video generated successfully!");
        setHasGenerated(true);
      } catch (error) {
        console.error("Error generating video:", error);
        setSuccessMessage("Error generating video. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    },
    [ffmpeg, loaded],
  );

  const onSubmit = (data: FormData) => {
    generateVideo(data);
  };

  useEffect(() => {
    if (isDirty && hasGenerated) {
      setSuccessMessage(null);
    }
  }, [isDirty, hasGenerated]);

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-1/2">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-gray-100 border-2 border-gray-400 shadow-[2px_2px_0px_0px_rgba(255,255,255,1),-2px_-2px_0px_0px_rgba(0,0,0,0.25)]"
        >
          <h2 className="bg-blue-800 text-white font-bold px-2 py-1 mb-2">
            Video Settings
          </h2>
          <div className="p-2 space-y-4">
            <div>
              <label className="block mb-2">Video Dimensions:</label>
              <div className="flex items-center">
                <input
                  type="number"
                  {...register("width", { valueAsNumber: true })}
                  className="w-16 px-1 rounded-none py-0.5 border border-gray-400 focus:outline-none focus:border-blue-500"
                />
                <span className="mx-2">x</span>
                <input
                  type="number"
                  {...register("height", { valueAsNumber: true })}
                  className="w-16 px-1 rounded-none py-0.5 border border-gray-400 focus:outline-none focus:border-blue-500"
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
                className="w-full px-1 py-0.5 border rounded-none border-gray-400 focus:outline-none focus:border-blue-500"
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
                className="w-full h-8 border rounded-none border-gray-400"
              />
              {errors.backgroundColor && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.backgroundColor.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-2">Video Format:</label>
              <select
                {...register("format")}
                className="w-full px-1 py-0.5 rounded-none border border-gray-400 focus:outline-none focus:border-blue-500"
              >
                <option value="mp4">MP4</option>
                <option value="webm">WebM</option>
              </select>
              {errors.format && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.format.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isGenerating || !loaded}
              className="w-full bg-gray-300 border-2 border-gray-400 px-4 py-1 active:shadow-[1px_1px_0px_0px_rgba(255,255,255,1),-1px_-1px_0px_0px_rgba(0,0,0,0.25)] shadow-[2px_2px_0px_0px_rgba(255,255,255,1),-2px_-2px_0px_0px_rgba(0,0,0,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating
                ? "Generating..."
                : !loaded
                  ? "ffmpeg is loading..."
                  : hasGenerated
                    ? "Regenerate Video"
                    : "Generate Video"}
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
        <VideoPreview
          videoBlob={videoBlob}
          width={videoSettings.width}
          height={videoSettings.height}
          format={videoSettings.format}
        />
      </div>
    </div>
  );
}

type VideoPreviewProps = {
  videoBlob: Blob | null;
  width: number;
  height: number;
  format: "mp4" | "webm";
};

const fileNameSchema = z.object({
  fileName: z
    .string()
    .min(1, "File name is required")
    .max(255, "File name is too long")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Only letters, numbers, underscores, and hyphens are allowed",
    ),
});

type FileNameFormData = z.infer<typeof fileNameSchema>;

function VideoPreview({ videoBlob, width, height, format }: VideoPreviewProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FileNameFormData>({
    resolver: zodResolver(fileNameSchema),
    defaultValues: {
      fileName: "generated_video",
    },
  });

  useEffect(() => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoBlob]);

  const handleDownload = (data: FileNameFormData) => {
    if (!videoBlob) return;

    const a = document.createElement("a");
    a.href = URL.createObjectURL(videoBlob);
    a.download = `${data.fileName}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-gray-100 border-2 border-gray-400 shadow-[2px_2px_0px_0px_rgba(255,255,255,1),-2px_-2px_0px_0px_rgba(0,0,0,0.25)]">
      <h2 className="bg-blue-800 text-white font-bold px-2 py-1 mb-2">
        Video Preview
      </h2>
      <div className="p-2 space-y-4">
        <div className="aspect-w-16 aspect-h-9">
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              className="w-full h-full object-contain"
              style={{ aspectRatio: `${width} / ${height}` }}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600">
              No video generated yet
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div>
            <label className="block mb-2">File name:</label>
            <div className="flex-grow flex">
              <input
                {...register("fileName")}
                className="flex-grow rounded-none px-1 py-0.5 border-t border-l border-b border-gray-400 focus:outline-none"
              />
              <div className="px-1 py-0.5 bg-gray-300 border border-gray-400 text-gray-600">
                .{format}
              </div>
            </div>
          </div>
          {errors.fileName && (
            <p className="text-red-500 text-sm">{errors.fileName.message}</p>
          )}
        </div>
        <button
          onClick={handleSubmit(handleDownload)}
          disabled={!videoBlob}
          className="w-full bg-gray-300 border-2 border-gray-400 px-4 py-1 active:shadow-[1px_1px_0px_0px_rgba(255,255,255,1),-1px_-1px_0px_0px_rgba(0,0,0,0.25)] shadow-[2px_2px_0px_0px_rgba(255,255,255,1),-2px_-2px_0px_0px_rgba(0,0,0,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Download Video
        </button>
      </div>
    </div>
  );
}
