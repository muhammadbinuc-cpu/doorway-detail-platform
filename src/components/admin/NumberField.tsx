"use client";

import { useState } from "react";

interface NumberFieldProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  min?: number;
  /** Parse as integer (quantities). Default false = decimal (money). */
  integer?: boolean;
  /** Value treated as "empty" — shown as a blank field. Default 0. */
  emptyValue?: number;
  title?: string;
  disabled?: boolean;
}

/**
 * Number input without the "delete the 0 first" annoyance: renders blank when
 * the value is unset, keeps the user's raw typing in a draft string, selects
 * all on focus, and commits the parsed number on every change.
 */
export function NumberField({
  value,
  onChange,
  className,
  placeholder = "0.00",
  min = 0,
  integer = false,
  emptyValue = 0,
  title,
  disabled,
}: NumberFieldProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");
  // While focused the user's raw typing wins; otherwise mirror the prop so
  // external changes (modal reopen, prefill) always show through.
  const shown = focused ? draft : value === emptyValue ? "" : String(value);

  return (
    <input
      type="number"
      inputMode={integer ? "numeric" : "decimal"}
      min={min}
      step={integer ? 1 : "any"}
      value={shown}
      placeholder={placeholder}
      title={title}
      disabled={disabled}
      className={className}
      onFocus={(e) => {
        setDraft(value === emptyValue ? "" : String(value));
        setFocused(true);
        e.target.select();
      }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        const parsed = integer ? parseInt(raw, 10) : parseFloat(raw);
        onChange(Number.isFinite(parsed) ? parsed : emptyValue);
      }}
    />
  );
}
