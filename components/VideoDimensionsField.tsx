"use client";

import { Controller, type Control, type FieldError, type FieldValues, type Path } from "react-hook-form";
import { RetroNumberInput } from "@/components/RetroNumberInput";

type VideoDimensionsFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  widthName: Path<TFieldValues>;
  heightName: Path<TFieldValues>;
  widthError?: FieldError;
  heightError?: FieldError;
  aspectLabel: string;
};

export function VideoDimensionsField<TFieldValues extends FieldValues>({
  control,
  widthName,
  heightName,
  widthError,
  heightError,
  aspectLabel,
}: VideoDimensionsFieldProps<TFieldValues>) {
  return (
    <div>
      <label className="block mb-2">
        <span>Video Dimensions</span>{" "}
        <span className="text-xs font-normal tracking-wide text-gray-700">
          aspect {aspectLabel}
        </span>
      </label>
      <div className="flex items-center gap-2">
        <Controller<TFieldValues>
          control={control}
          name={widthName}
          render={({ field }) => (
            <RetroNumberInput
              value={field.value}
              onChange={(val) => field.onChange(val ?? NaN)}
              onBlur={field.onBlur}
              name={field.name}
              inputRef={field.ref}
              min={1}
              max={7680}
              step={1}
              className="w-24"
            />
          )}
        />
        <span className="mx-2">x</span>
        <Controller<TFieldValues>
          control={control}
          name={heightName}
          render={({ field }) => (
            <RetroNumberInput
              value={field.value}
              onChange={(val) => field.onChange(val ?? NaN)}
              onBlur={field.onBlur}
              name={field.name}
              inputRef={field.ref}
              min={1}
              max={4320}
              step={1}
              className="w-24"
            />
          )}
        />
<span className="ml-2">pixels</span>
      </div>
      {widthError && (
        <p className="text-red-500 text-sm mt-1">
          {widthError.message}
        </p>
      )}
      {heightError && (
        <p className="text-red-500 text-sm mt-1">
          {heightError.message}
        </p>
      )}
    </div>
  );
}
