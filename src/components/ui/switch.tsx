"use client";

import * as React from "react";

type SwitchProps = {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
  "aria-label"?: string;
};

export function Switch({ checked, disabled, onCheckedChange, id, "aria-label": ariaLabel }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-label={ariaLabel}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
      className={[
        "inline-flex h-6 w-10 items-center rounded-full border transition-colors",
        checked ? "bg-primary border-primary" : "bg-muted border-border",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      <span
        className={[
          "h-4 w-4 rounded-full bg-background shadow transform transition-transform",
          checked ? "translate-x-4" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

