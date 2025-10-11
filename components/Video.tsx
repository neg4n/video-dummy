"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFFMPEG } from "@/hooks/use-ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { RetroColorPicker } from "@/components/RetroColorPicker";
import { RetroInput } from "@/components/RetroInput";
import { RetroNumberInput } from "@/components/RetroNumberInput";
import { RetroSelect } from "@/components/RetroSelect";
import { VideoDimensionsField } from "@/components/VideoDimensionsField";

const EDGE_SEQUENCE = ["top", "right", "bottom", "left"] as const;

type EdgePosition = (typeof EDGE_SEQUENCE)[number];

const EDGE_COORDINATES: Record<EdgePosition, { x: string; y: string }> = {
  top: {
    x: "(w-text_w)/2",
    y: "0",
  },
  right: {
    x: "w-text_w",
    y: "(h-text_h)/2",
  },
  bottom: {
    x: "(w-text_w)/2",
    y: "h-text_h",
  },
  left: {
    x: "0",
    y: "(h-text_h)/2",
  },
};

const ANIMATION_FPS = 6;
const EDGE_HOLD_SECONDS = 0.75;
const DEFAULT_FONT_SCALE = 0.12;
const MIN_FONT_SIZE = 18;
const DRAW_TEXT_SHADOW_OFFSET = 4;
const ARIAL_FONT_FILE = "arial.ttf";
const ARIAL_FONT_URL =
  "https://raw.githubusercontent.com/ffmpegwasm/testdata/master/arial.ttf";

type AnimationMetrics = {
  framesPerEdge: number;
  totalFrames: number;
  durationSeconds: number;
};

type DrawTextConfig = {
  text: string;
  fontSize: number;
  framesPerEdge: number;
  durationSeconds: number;
};

const buildAnimationMetrics = (fps: number, holdSeconds: number): AnimationMetrics => {
  const framesPerEdge = Math.max(1, Math.round(fps * holdSeconds));
  const totalFrames = framesPerEdge * EDGE_SEQUENCE.length;
  const durationSeconds = Number((totalFrames / fps).toFixed(3));

  return {
    framesPerEdge,
    totalFrames,
    durationSeconds,
  };
};

const escapeDrawTextText = (text: string) =>
  text
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n");

const buildIndexedConditional = (indexExpression: string, values: string[]) =>
  values.reduceRight((acc, value, idx) => {
    if (idx === values.length - 1) {
      return value;
    }

    return `if(eq(${indexExpression},${idx}),${value},${acc})`;
  });

const quoteFilterExpression = (expression: string) => `'${expression.replace(/'/g, "\\'")}'`;

const buildAnimatedDrawTextFilter = ({
  text,
  fontSize,
  framesPerEdge,
  durationSeconds,
}: DrawTextConfig) => {
  const drawTextSafe = escapeDrawTextText(text);
  const edgeIndexExpression = `mod(floor(n/${framesPerEdge}),${EDGE_SEQUENCE.length})`;

  const xPositions = EDGE_SEQUENCE.map((edge) => EDGE_COORDINATES[edge].x);
  const yPositions = EDGE_SEQUENCE.map((edge) => EDGE_COORDINATES[edge].y);

  const xExpression = buildIndexedConditional(edgeIndexExpression, xPositions);
  const yExpression = buildIndexedConditional(edgeIndexExpression, yPositions);

  const options = [
    `fontfile=/arial.ttf`,
    `text='${drawTextSafe}'`,
    `fontsize=${fontSize}`,
    `fontcolor=white`,
    `shadowcolor=0x000000AA`,
    `shadowx=${DRAW_TEXT_SHADOW_OFFSET}`,
    `shadowy=${DRAW_TEXT_SHADOW_OFFSET}`,
    `x=${quoteFilterExpression(xExpression)}`,
    `y=${quoteFilterExpression(yExpression)}`,
    `enable='lte(t,${durationSeconds.toFixed(3)})'`,
  ];

  return `drawtext=${options.join(":")}`;
};

const computeFontSizeForFrame = (width: number, height: number) =>
  Math.max(MIN_FONT_SIZE, Math.round(Math.min(width, height) * DEFAULT_FONT_SCALE));

const ensureFontAvailable = async (ffmpeg: FFmpeg, fontFileName: string, fontURL: string) => {
  try {
    await ffmpeg.readFile(fontFileName);
    return;
  } catch {
    // Font not found; continue to download.
  }

  await ffmpeg.writeFile(fontFileName, await fetchFile(fontURL));
};

const isPositiveFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const greatestCommonDivisor = (a: number, b: number) => {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));

  if (x === 0 || y === 0) {
    return 1;
  }

  while (y !== 0) {
    const remainder = x % y;
    x = y;
    y = remainder;
  }

  return x === 0 ? 1 : x;
};

const formatAspectRatioLabel = (width?: number, height?: number) => {
  if (!isPositiveFiniteNumber(width) || !isPositiveFiniteNumber(height)) {
    return "n/a";
  }

  const roundedWidth = Math.round(width);
  const roundedHeight = Math.round(height);
  const divisor = greatestCommonDivisor(roundedWidth, roundedHeight);
  const simplifiedWidth = Math.max(1, Math.round(roundedWidth / divisor));
  const simplifiedHeight = Math.max(1, Math.round(roundedHeight / divisor));
  const decimalRatio = roundedWidth / roundedHeight;
  const roundedDecimal = Math.round(decimalRatio * 100) / 100;
  const decimalText = Number.isFinite(roundedDecimal) ? roundedDecimal.toFixed(2) : "n/a";

  return `${simplifiedWidth}/${simplifiedHeight} (~${decimalText}:1)`;
};

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
  text: z
    .string()
    .trim()
    .min(1, "Video text must include at least one character")
    .max(100, "Video text must be less than or equal to 100 characters"),
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
  const { ffmpeg, loaded, getFFMPEG } = useFFMPEG();

  const {
    register,
    control,
    handleSubmit,
    watch,
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

  const [currentWidth, currentHeight] = watch(["width", "height"]);
  const aspectLabel = formatAspectRatioLabel(currentWidth, currentHeight);

  const generateVideo = useCallback(
    async (data: FormData) => {
      if (!loaded) {
        console.error("FFmpeg is not loaded yet");
        return;
      }

      setIsGenerating(true);
      setSuccessMessage(null);

      try {
        const ffmpegInstance = ffmpeg ?? (await getFFMPEG());

        if (!ffmpegInstance) {
          throw new Error("FFmpeg instance is unavailable");
        }

        await ensureFontAvailable(ffmpegInstance, ARIAL_FONT_FILE, ARIAL_FONT_URL);

        const animationMetrics = buildAnimationMetrics(ANIMATION_FPS, EDGE_HOLD_SECONDS);
        const fontSize = computeFontSizeForFrame(data.width, data.height);
        const drawTextFilter = buildAnimatedDrawTextFilter({
          text: data.text,
          fontSize,
          framesPerEdge: animationMetrics.framesPerEdge,
          durationSeconds: animationMetrics.durationSeconds,
        });

        const filterChain = `${drawTextFilter},fps=${ANIMATION_FPS}`;
        const outputFilename = `output.${data.format}`;
        const videoCodec = data.format === "mp4" ? "libx264" : "libvpx";
        const pixelFormat = "yuv420p";
        const durationArgument = animationMetrics.durationSeconds.toFixed(3);
        const backgroundColor = data.backgroundColor.substring(1);

        const args = [
          "-y",
          "-f",
          "lavfi",
          "-i",
          `color=c=${backgroundColor}:s=${data.width}x${data.height}:d=${durationArgument}`,
          "-vf",
          filterChain,
          "-c:v",
          videoCodec,
          "-pix_fmt",
          pixelFormat,
          "-r",
          String(ANIMATION_FPS),
          "-t",
          durationArgument,
          ...(data.format === "mp4"
            ? ["-preset", "ultrafast", "-crf", "32", "-movflags", "+faststart"]
            : []),
          ...(data.format === "webm" ? ["-b:v", "800k", "-crf", "33"] : []),
          outputFilename,
        ];

        await ffmpegInstance.exec(args);

        const outputData = await ffmpegInstance.readFile(outputFilename);
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
    [ffmpeg, getFFMPEG, loaded],
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
          data-tour-target="settings-panel"
        >
          <h2 className="bg-blue-800 text-xs font-bold uppercase tracking-wider text-white px-2 py-1 mb-2">
            Video Settings
          </h2>
          <div className="p-2 space-y-4">
            <VideoDimensionsField
              control={control}
              widthName="width"
              heightName="height"
              widthError={errors.width}
              heightError={errors.height}
              aspectLabel={aspectLabel}
            />
            <div>
              <RetroInput
                label="Video Text"
                labelClassName="text-base"
                rootClassName="w-full"
                className="text-sm"
                {...register("text")}
              />
              {errors.text && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.text.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-2">Background Color</label>
              <Controller
                control={control}
                name="backgroundColor"
                render={({ field }) => (
                  <RetroColorPicker
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    inputRef={field.ref}
                    className="w-full"
                  />
                )}
              />
              {errors.backgroundColor && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.backgroundColor.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-2">Video Format</label>
              <Controller
                control={control}
                name="format"
                render={({ field }) => (
                  <RetroSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { label: "MP4", value: "mp4" },
                      { label: "WebM", value: "webm" },
                    ]}
                    label={undefined}
                    name={field.name}
                    className="w-full"
                  />
                )}
              />
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
              data-tour-target="generate-button"
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
    .trim()
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
    <div
      className="bg-gray-100 border-2 border-gray-400 shadow-[2px_2px_0px_0px_rgba(255,255,255,1),-2px_-2px_0px_0px_rgba(0,0,0,0.25)]"
      data-tour-target="preview-panel"
    >
      <h2 className="bg-blue-800 text-xs font-bold uppercase tracking-wider text-white px-2 py-1 mb-2">
        Video Preview
      </h2>
      <div className="p-2 space-y-4">
        <div
          className="relative w-full bg-gray-300"
          style={{ aspectRatio: `${width} / ${height}`, minHeight: "220px" }}
        >
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              className="absolute inset-0 h-full w-full object-contain"
              style={{ aspectRatio: `${width} / ${height}` }}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-600">
              No video generated yet
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div>
            <RetroInput
              label="File Name"
              

              labelClassName="text-base"
              rootClassName="w-full"
              className="text-sm"
              suffix={`.${format}`}
              suffixClassName="min-w-[48px] justify-center text-gray-600"
              {...register("fileName")}
              autoComplete="off"
            />
          </div>
          {errors.fileName && (
            <p className="text-red-500 text-sm">{errors.fileName.message}</p>
          )}
        </div>
        <button
          onClick={handleSubmit(handleDownload)}
          disabled={!videoBlob}
          className="w-full bg-gray-300 border-2 border-gray-400 px-4 py-1 active:shadow-[1px_1px_0px_0px_rgba(255,255,255,1),-1px_-1px_0px_0px_rgba(0,0,0,0.25)] shadow-[2px_2px_0px_0px_rgba(255,255,255,1),-2px_-2px_0px_0px_rgba(0,0,0,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
          data-tour-target="download-button"
        >
          Download Video
        </button>
      </div>
    </div>
  );
}
