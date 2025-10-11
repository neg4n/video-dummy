"use client";

import { type Ref, useEffect, useId, useMemo, useState } from "react";
import {
  connect as connectNumberInput,
  machine as numberInputMachine,
} from "@zag-js/number-input";
import { normalizeProps, useMachine } from "@zag-js/react";

const composeHandlers =
  <Event,>(theirHandler?: (event: Event) => void, ourHandler?: (event: Event) => void) =>
  (event: Event) => {
    theirHandler?.(event);
    ourHandler?.(event);
  };

const assignRefs = <ElementType,>(...refs: (Ref<ElementType> | undefined)[]) => {
  return (node: ElementType | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref && typeof ref === "object") {
        // @ts-expect-error readonly
        ref.current = node;
      }
    }
  };
};

const toValueString = (value?: number | string | null) => {
  if (value === null || value === undefined) return "";
  const numeric = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(numeric)) return "";
  return String(numeric);
};

type RetroNumberInputProps = {
  value?: number | string | null;
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  name?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
  label?: string;
};

export function RetroNumberInput({
  value,
  onChange,
  onBlur,
  name,
  min,
  max,
  step,
  disabled,
  className,
  inputRef,
  label,
}: RetroNumberInputProps) {
  const id = useId();
  const normalizedValue = toValueString(value);
  const [valueString, setValueString] = useState(normalizedValue);

  useEffect(() => {
    setValueString((prev) => (prev === normalizedValue ? prev : normalizedValue));
  }, [normalizedValue]);

  const service = useMachine(numberInputMachine, {
    id,
    name,
    value: valueString,
    min,
    max,
    step,
    disabled,
    onValueChange(details) {
      setValueString(details.value);
      const numericValue = details.value === "" ? undefined : Number(details.value);
      const nextValue =
        numericValue === undefined || Number.isNaN(numericValue) ? undefined : numericValue;
      onChange(nextValue);
    },
  });

  const api = connectNumberInput(service, normalizeProps);
  const { ref: inputMachineRef, ...inputProps } = api.getInputProps({ inputMode: "numeric" });
  const decrementProps = api.getDecrementTriggerProps();
  const incrementProps = api.getIncrementTriggerProps();
  const { className: controlClassName, ...controlProps } = api.getControlProps();

  const mergedInputRef = useMemo(
    () => assignRefs<HTMLInputElement>(inputMachineRef, inputRef),
    [inputMachineRef, inputRef],
  );

  return (
    <div
      {...api.getRootProps()}
      className={`inline-flex flex-col ${className ?? ""}`.trim()}
      data-retro-number-input=""
    >
      {label && (
        <label
          {...api.getLabelProps()}
          className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-900"
        >
          {label}
        </label>
      )}

      <div
        {...controlProps}
        className={`relative flex items-stretch border-2 border-gray-500 bg-gray-100 px-2 py-1 shadow-[2px_2px_0px_rgba(255,255,255,1),-2px_-2px_0px_rgba(0,0,0,0.3)] ${controlClassName ?? ""}`.trim()}
      >
        <input
          {...inputProps}
          ref={mergedInputRef}
          onBlur={composeHandlers(inputProps.onBlur, onBlur)}
          className="w-full bg-transparent pr-7 text-sm text-gray-900 focus:outline-none"
        />
        <div className="pointer-events-auto absolute right-1 top-[3px] bottom-[3px] flex w-6 flex-col rounded-sm border-2 border-gray-500 bg-gray-300 shadow-[1px_1px_0px_rgba(255,255,255,0.9),-1px_-1px_0px_rgba(0,0,0,0.35)]">
          <button
            {...incrementProps}
            className="flex-1 text-[10px] font-bold leading-none text-gray-900 hover:bg-gray-200 active:bg-gray-400 focus:outline-none"
          >
            +
          </button>
          <div className="h-px bg-gray-500" />
          <button
            {...decrementProps}
            className="flex-1 text-[10px] font-bold leading-none text-gray-900 hover:bg-gray-200 active:bg-gray-400 focus:outline-none"
          >
            -
          </button>
        </div>
      </div>
    </div>
  );
}
