"use client";

import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

type RetroInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label?: ReactNode;
  labelClassName?: string;
  helperText?: ReactNode;
  rootClassName?: string;
  controlClassName?: string;
  className?: string;
  suffix?: ReactNode;
  suffixClassName?: string;
};

export const RetroInput = forwardRef<HTMLInputElement, RetroInputProps>(
  (
    {
      label,
      labelClassName,
      helperText,
      rootClassName,
      controlClassName,
      className,
      suffix,
      suffixClassName,
      disabled,
      id: idProp,
      ...inputProps
    },
    ref,
  ) => {
    const fallbackId = useId();
    const inputId = idProp ?? inputProps.name ?? fallbackId;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    const rootClasses = `inline-flex flex-col ${rootClassName ?? ""}`.trim();
    const controlClasses = [
      "flex items-stretch border-2 border-gray-500 bg-gray-100",
      "shadow-[2px_2px_0px_rgba(255,255,255,1),-2px_-2px_0px_rgba(0,0,0,0.3)]",
      disabled ? "opacity-60 cursor-not-allowed" : "",
      controlClassName ?? "",
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const inputClasses = [
      "flex-1 bg-transparent px-2 py-1 text-sm text-gray-900",
      "focus:outline-none",
      disabled ? "cursor-not-allowed" : "",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const suffixClasses = [
      "flex items-center px-2 py-1 border-l-2 border-gray-500 bg-gray-300",
      "text-xs font-bold leading-none text-gray-700",
      suffixClassName ?? "",
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return (
      <div className={rootClasses} data-retro-input="">
        {label && (
          <label
            htmlFor={inputId}
            className={`block mb-2 text-sm text-gray-900 ${labelClassName ?? ""}`.trim()}
          >
            {label}
          </label>
        )}
        <div className={controlClasses} data-disabled={disabled ? "" : undefined}>
          <input
            {...inputProps}
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={inputClasses}
            aria-disabled={disabled}
            aria-describedby={helperId}
          />
          {suffix !== undefined && suffix !== null && (
            <span className={suffixClasses}>{suffix}</span>
          )}
        </div>
        {helperText && (
          <p className="mt-1 text-xs text-gray-600" id={helperId}>
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

RetroInput.displayName = "RetroInput";
