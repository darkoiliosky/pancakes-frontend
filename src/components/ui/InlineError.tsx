import React from "react";

export default function InlineError({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <div className={`text-sm text-red-600 mt-1 ${className}`} role="alert">
      {children}
    </div>
  );
}

