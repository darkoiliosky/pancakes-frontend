import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
};

export default function Button({
  className,
  variant = "primary",
  ...props
}: Props) {
  return (
    <button
      className={clsx(
        "px-4 py-2 rounded-lg font-medium transition",
        variant === "primary"
          ? "bg-brand text-white hover:bg-yellow-500"
          : "border border-brand text-brand hover:bg-brand hover:text-white",
        className
      )}
      {...props}
    />
  );
}
