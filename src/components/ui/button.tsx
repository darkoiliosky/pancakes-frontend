import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive";
}

export const Button: React.FC<ButtonProps> = ({
  className = "",
  variant = "default",
  children,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    default: "bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500",
    destructive: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className} px-4 py-2`}
      {...props}
    >
      {children}
    </button>
  );
};
