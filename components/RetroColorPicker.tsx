"use client";

import { type CSSProperties, type Ref, useEffect, useId, useMemo, useState } from "react";
import {
  connect as connectColorPicker,
  machine as colorPickerMachine,
  parse as parseColor,
} from "@zag-js/color-picker";
import { normalizeProps, Portal, useMachine } from "@zag-js/react";
import { useMediaQuery } from "usehooks-ts";

type RetroColorPickerProps = {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  inputRef?: Ref<HTMLInputElement>;
};

const SWATCH_VALUES = [
  "#000000",
  "#1C1CF0",
  "#FF0000",
  "#008080",
  "#00FF00",
  "#FF00FF",
  "#FFFF00",
  "#FFFFFF",
] as const;

const toHexString = (input?: string) => {
  if (!input) return "#008080";
  const body = input
    .trim()
    .replace(/^#+/, "")
    .replace(/[^0-9a-f]/gi, "")
    .slice(0, 6)
    .padEnd(6, "0")
    .toUpperCase();
  return `#${body}`;
};

const composeHandlers =
  <Event,>(theirHandler?: (event: Event) => void, ourHandler?: (event: Event) => void) =>
  (event: Event) => {
    theirHandler?.(event);
    ourHandler?.(event);
  };

type ColorValue = ReturnType<typeof parseColor>;

const ensureHashHex = (input: string) =>
  input.startsWith("#") ? input.toUpperCase() : `#${input.toUpperCase()}`;

const colorToHex = (color: ColorValue) => ensureHashHex(color.toString("hex"));

export function RetroColorPicker({
  value,
  onChange,
  onBlur,
  name,
  disabled,
  className,
  label,
  inputRef,
}: RetroColorPickerProps) {
  const id = useId();
  const normalizedPropValue = toHexString(value);
  const [colorValue, setColorValue] = useState<ColorValue>(() => parseColor(normalizedPropValue));
  const isSmallViewport = useMediaQuery("(max-width: 640px)");
  const positioning = useMemo(
    () =>
      isSmallViewport
        ? {
            placement: "bottom",
            offset: { mainAxis: 12, crossAxis: 0 },
            strategy: "fixed" as const,
          }
        : {
            placement: "right",
            offset: { mainAxis: 12, crossAxis: 0 },
          },
    [isSmallViewport],
  );

  useEffect(() => {
    setColorValue((previous) => {
      const next = parseColor(normalizedPropValue);
      return previous.toString("hex").toUpperCase() === next.toString("hex").toUpperCase()
        ? previous
        : next;
    });
  }, [normalizedPropValue]);

  const service = useMachine(colorPickerMachine, {
    id,
    name,
    format: "hsla",
    positioning,
    value: colorValue,
    disabled,
    onValueChange(details) {
      setColorValue(details.value);
      const nextHex = colorToHex(details.value);
      onChange(nextHex);
    },
  });

  const api = connectColorPicker(service, normalizeProps);
  const hiddenInputProps = api.getHiddenInputProps();
  const [supportsEyeDropper, setSupportsEyeDropper] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSupportsEyeDropper("EyeDropper" in window);
      setPortalContainer(document.body);
    }
  }, []);
  const {
    style: triggerGridBaseStyle,
    ...triggerGridRest
  } = api.getTransparencyGridProps({ size: "10px" });
  const triggerGridStyle: CSSProperties = {
    ...(triggerGridBaseStyle ?? {}),
    inset: "0",
    position: "absolute",
    opacity: 0.45,
    borderRadius: 0,
  };
  const currentHex = colorToHex(colorValue);
  const { style: positionerBaseStyle, ...positionerProps } = api.getPositionerProps();
  const positionerStyle: CSSProperties = {
    ...(positionerBaseStyle ?? {}),
    zIndex: 9999,
  };
  if (isSmallViewport) {
    positionerStyle.insetInline = "12px";
    positionerStyle.maxWidth = "calc(100vw - 24px)";
    positionerStyle.width = "auto";
  }
  const { style: contentBaseStyle, ...contentProps } = api.getContentProps();
  const contentStyle: CSSProperties = {
    ...(contentBaseStyle ?? {}),
    zIndex: 10000,
  };
  if (isSmallViewport) {
    contentStyle.width = "min(20rem, calc(100vw - 24px))";
    contentStyle.maxWidth = "calc(100vw - 24px)";
  }

  return (
    <div
      {...api.getRootProps()}
      className={`font-sans text-sm ${className ?? ""}`}
      data-color-picker-retro=""
    >
      <input
        {...hiddenInputProps}
        ref={inputRef}
        onBlur={composeHandlers(hiddenInputProps.onBlur, onBlur)}
      />

      {label && (
        <label
          {...api.getLabelProps()}
          className="block mb-2 font-bold text-gray-900"
        >
          {label}
        </label>
      )}

      <div className="space-y-2">
        <button
          {...api.getTriggerProps()}
          className="flex h-9 w-full items-center justify-between border-2 border-gray-500 bg-gray-100 px-2 shadow-[2px_2px_0px_rgba(255,255,255,1),-2px_-2px_0px_rgba(0,0,0,0.35)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
        >
          <span className="sr-only">Select color</span>
          <span className="flex items-center gap-3">
            <span className="relative block h-6 w-10 overflow-hidden border border-gray-700 shadow-inner">
              <div
                {...triggerGridRest}
                style={triggerGridStyle}
              />
              <span
                aria-hidden
                className="absolute inset-0"
                style={{ backgroundColor: currentHex }}
              />
            </span>
            <span className="font-mono text-xs uppercase tracking-wide text-gray-900">
              {currentHex}
            </span>
          </span>
          <span className="inline-flex items-center border-2 border-gray-500 bg-gray-300 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-800 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.9),inset_-1px_-1px_0px_rgba(0,0,0,0.45)]">
            Edit…
          </span>
        </button>
      </div>

      <Portal container={portalContainer as any}>
        <div
          {...positionerProps}
          style={positionerStyle}
          className="z-[9999]"
        >
          <div
            {...contentProps}
            style={contentStyle}
            className="w-80 border-2 border-gray-400 bg-gray-100 shadow-[2px_2px_0px_rgba(255,255,255,1),-3px_-3px_0px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-center justify-between bg-blue-800 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white">
              <span>Color Picker</span>
              <button
                type="button"
                onClick={() => api.setOpen(false)}
                className="ml-2 flex h-6 w-6 items-center justify-center border-2 border-gray-400 bg-gray-200 text-black text-base leading-none shadow-[1px_1px_0px_rgba(0,0,0,0.25),-1px_-1px_0px_rgba(255,255,255,1)] hover:bg-gray-100 active:bg-gray-300"
                aria-label="Close color picker"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 p-3">
              <div className="border-2 border-gray-500 bg-gray-100 p-3 shadow-[2px_2px_0px_rgba(255,255,255,1),-2px_-2px_0px_rgba(0,0,0,0.3)]">
                {(() => {
                  const { style: areaBaseStyle, ...areaProps } = api.getAreaProps();
                  const { style: backgroundBaseStyle, ...areaBackgroundProps } = api.getAreaBackgroundProps();
                  const { style: thumbBaseStyle, ...areaThumbProps } = api.getAreaThumbProps();
                  const { style: transparencyBaseStyle, ...transparencyProps } = api.getTransparencyGridProps({
                    size: "12px",
                  });

                  const areaStyle: CSSProperties = {
                    ...(areaBaseStyle ?? {}),
                    borderRadius: "3px",
                  };
                  const backgroundStyle: CSSProperties = {
                    ...(backgroundBaseStyle ?? {}),
                    position: "absolute",
                    inset: "0",
                    borderRadius: "3px",
                  };
                  const thumbStyle: CSSProperties = {
                    ...(thumbBaseStyle ?? {}),
                    width: "14px",
                    height: "14px",
                    borderRadius: "2px",
                    border: "2px solid #ffffff",
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.6)",
                  };
                  const transparencyStyle: CSSProperties = {
                    ...(transparencyBaseStyle ?? {}),
                    position: "absolute",
                    inset: "0",
                    opacity: 0.5,
                    borderRadius: "3px",
                  };

                  return (
                    <div
                      {...areaProps}
                      className="relative h-40 overflow-hidden border border-gray-600 bg-white"
                      style={areaStyle}
                    >
                      <div
                        {...transparencyProps}
                        style={transparencyStyle}
                      />
                      <div
                        {...areaBackgroundProps}
                        style={backgroundStyle}
                      />
                      <div
                        {...areaThumbProps}
                        style={thumbStyle}
                      />
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="block text-xs font-bold uppercase tracking-wide text-gray-900">
                    Hue
                  </span>
                  {(() => {
                    const { style: sliderBaseStyle, ...sliderProps } = api.getChannelSliderProps({
                      channel: "hue",
                    });
                    const { style: trackBaseStyle, ...trackProps } = api.getChannelSliderTrackProps({
                      channel: "hue",
                    });
                    const { style: thumbBaseStyle, ...thumbProps } = api.getChannelSliderThumbProps({
                      channel: "hue",
                    });

                    const sliderStyle: CSSProperties = {
                      ...(sliderBaseStyle ?? {}),
                    };
                    const trackStyle: CSSProperties = {
                      ...(trackBaseStyle ?? {}),
                      position: "absolute",
                      inset: "3px",
                      borderRadius: "1px",
                    };
                    const thumbStyle: CSSProperties = {
                      ...(thumbBaseStyle ?? {}),
                      width: "6px",
                      height: "calc(100% - 6px)",
                      borderRadius: "0",
                      border: "1px solid #111827",
                      background: "linear-gradient(180deg,#f9fafb 0%,#d1d5db 100%)",
                      boxShadow:
                        "inset 1px 0 0 rgba(255,255,255,0.9), inset -1px 0 0 rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.6)",
                    };

                    return (
                      <div
                        {...sliderProps}
                        className="relative h-7 border-2 border-gray-500 bg-gray-200 shadow-[2px_2px_0px_rgba(255,255,255,1),-2px_-2px_0px_rgba(0,0,0,0.3)]"
                        style={sliderStyle}
                      >
                        <div
                          {...trackProps}
                          style={trackStyle}
                        />
                        <div
                          {...thumbProps}
                          style={thumbStyle}
                        />
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-1">
                  <span className="block text-xs font-bold uppercase tracking-wide text-gray-900">
                    Hex Value
                  </span>
                  <div className="flex items-center border-2 border-gray-500 bg-gray-100 px-2 py-1 shadow-[2px_2px_0px_rgba(255,255,255,1),-2px_-2px_0px_rgba(0,0,0,0.3)]">
                    <input
                      {...api.getChannelInputProps({ channel: "hex" })}
                      className="w-full uppercase bg-transparent text-gray-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="block text-xs font-bold uppercase tracking-wide text-gray-900">
                    Quick Swatches
                  </span>
                  <div
                    {...api.getSwatchGroupProps()}
                    className="grid grid-cols-8 gap-1 border-2 border-gray-500 bg-gray-100 p-2 shadow-[2px_2px_0px_rgba(255,255,255,1),-2px_-2px_0px_rgba(0,0,0,0.3)]"
                  >
                    {SWATCH_VALUES.map((color) => {
                      const isActive = currentHex === color;
                      return (
                        <button
                          key={color}
                          {...api.getSwatchTriggerProps({ value: color })}
                          className={`h-6 w-6 border border-gray-700 shadow-inner ${
                            isActive ? "outline outline-1 outline-offset-1 outline-blue-600" : ""
                          }`}
                          style={{ backgroundColor: color }}
                        >
                          <span className="sr-only">{color}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {supportsEyeDropper && (
                  <div className="space-y-1">
                    <span className="block text-xs font-bold uppercase tracking-wide text-gray-900">
                      Eye Dropper
                    </span>
                    <button
                      {...api.getEyeDropperTriggerProps()}
                      className="w-full border-2 border-gray-500 bg-gray-300 px-3 py-1 text-xs font-bold uppercase tracking-wide shadow-[2px_2px_0px_rgba(255,255,255,1),-2px_-2px_0px_rgba(0,0,0,0.3)]"
                    >
                      Pick From Screen
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Portal>
    </div>
  );
}
