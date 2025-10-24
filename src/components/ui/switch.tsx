import * as React from "react";

type SwitchProps = {
  id?: string;
  checked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  "aria-label"?: string;
};

export function Switch({ id, checked = false, disabled, onCheckedChange, className = "", ...rest }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onCheckedChange?.(!checked);
      }}
      className={
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 " +
        (checked ? "bg-amber-500" : "bg-gray-200") +
        (disabled ? " opacity-50 cursor-not-allowed" : "") +
        (className ? ` ${className}` : "")
      }
      data-state={checked ? "checked" : "unchecked"}
      {...rest}
    >
      <span
        className={
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out " +
          (checked ? "translate-x-5" : "translate-x-0")
        }
      />
    </button>
  );
}

export default Switch;

