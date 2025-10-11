"use client";

import { useMemo, useId } from "react";
import { connect as connectSelect, machine as selectMachine, collection as createCollection, type CollectionItem } from "@zag-js/select";
import { normalizeProps, Portal, useMachine } from "@zag-js/react";

type RetroSelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type RetroSelectProps = {
  value?: string;
  onChange: (value: string) => void;
  options: RetroSelectOption[];
  label?: string;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
};

const HEADER_CLASSES =
  "flex items-center justify-between bg-blue-800 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white";

export function RetroSelect({
  value,
  onChange,
  options,
  label,
  placeholder = "Select an option",
  name,
  disabled,
  className,
}: RetroSelectProps) {
  const id = useId();

  const selectCollection = useMemo(
    () =>
      createCollection({
        items: options,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.value,
        itemToDisabled: (item) => !!item.disabled,
      }),
    [options],
  );

  const service = useMachine(selectMachine, {
    id,
    name,
    disabled,
    collection: selectCollection,
    value: value ? [value] : [],
    onValueChange(details) {
      const nextValue = details.value?.[0] ?? "";
      onChange(nextValue);
    },
  });

  const api = connectSelect(service, normalizeProps);
  const collectionItems = selectCollection.items as CollectionItem[];
  const selectedItem = api.selectedItems[0];
  const displayLabel = selectedItem?.label ?? placeholder;

  return (
    <div
      {...api.getRootProps()}
      className={`inline-flex flex-col ${className ?? ""}`.trim()}
      data-retro-select=""
    >
      <select {...api.getHiddenSelectProps()}>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      {label && (
        <label
          {...api.getLabelProps()}
          className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-900"
        >
          {label}
        </label>
      )}

      <div
        {...api.getControlProps()}
        className="flex items-center border-2 border-gray-500 bg-gray-100 shadow-[2px_2px_0px_rgba(255,255,255,1),-2px_-2px_0px_rgba(0,0,0,0.3)]"
      >
        <button
          {...api.getTriggerProps()}
          className="flex h-8 w-full items-center justify-between px-2 text-left text-sm text-gray-900 focus:outline-none"
        >
          <span className={selectedItem ? "" : "text-gray-600"}>{displayLabel}</span>
          <span className="ml-3 inline-flex h-6 min-w-[22px] items-center justify-center border-2 border-gray-500 bg-gray-300 text-[11px] font-bold leading-none shadow-[1px_1px_0px_rgba(255,255,255,0.9),-1px_-1px_0px_rgba(0,0,0,0.35)]">
            ▼
          </span>
        </button>
      </div>

      <Portal>
        <div
          {...api.getPositionerProps()}
          className="z-[10000]"
        >
          <div
            {...api.getContentProps()}
            className="w-64 border-2 border-gray-400 bg-gray-100 shadow-[2px_2px_0px_rgba(255,255,255,1),-3px_-3px_0px_rgba(0,0,0,0.4)]"
          >
            <div className={HEADER_CLASSES}>
              <span>Choose Option</span>
              <button
                type="button"
                onClick={() => api.setOpen(false)}
                className="ml-2 flex h-6 w-6 items-center justify-center border-2 border-gray-400 bg-gray-200 text-black text-base leading-none shadow-[1px_1px_0px_rgba(0,0,0,0.25),-1px_-1px_0px_rgba(255,255,255,1)] hover:bg-gray-100 active:bg-gray-300 focus:outline-none"
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto border-t-2 border-gray-400 bg-gray-200 p-2">
              {collectionItems.length === 0 ? (
                <div className="text-sm text-gray-600">No options</div>
              ) : (
                <div
                  {...api.getListProps()}
                  className="space-y-1"
                >
                  {collectionItems.map((item) => {
                    const itemProps = api.getItemProps({ item });
                    const isHighlighted = itemProps["data-highlighted"] === "";
                    const isSelected = itemProps["data-state"] === "checked";
                    const disabledState = itemProps["data-disabled"] === "";

                    return (
                      <button
                        key={item.value}
                        {...itemProps}
                        type="button"
                        className={`flex w-full items-center justify-between border border-gray-500 px-2 py-1 text-left text-sm leading-none shadow-[1px_1px_0px_rgba(255,255,255,0.9),-1px_-1px_0px_rgba(0,0,0,0.35)] ${
                          isHighlighted ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-900"
                        } ${disabledState ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <span>{item.label}</span>
                        {isSelected && <span className="text-xs font-bold">✔</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </Portal>
    </div>
  );
}
