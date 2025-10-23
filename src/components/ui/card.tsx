import * as React from "react";

export const Card = ({ children, className = "" }: any) => (
  <div
    className={`bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden ${className}`}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className = "" }: any) => (
  <div className={`px-6 py-4 border-b border-gray-100 ${className}`}>
    {children}
  </div>
);

export const CardContent = ({ children, className = "" }: any) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = "" }: any) => (
  <div className={`px-6 py-4 border-t border-gray-100 ${className}`}>
    {children}
  </div>
);
