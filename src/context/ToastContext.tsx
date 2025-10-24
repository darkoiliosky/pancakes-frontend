import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastType = "success" | "error" | "info";

export interface ToastOptions {
  type?: ToastType;
  durationMs?: number;
}

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  expiresAt: number;
}

interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => void;
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  info: (message: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function ToastView({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="fixed top-4 right-4 z-[1000] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={
            "min-w-[240px] max-w-[360px] px-3 py-2 rounded shadow text-sm border " +
            (t.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : t.type === "error"
              ? "bg-red-50 text-red-800 border-red-200"
              : "bg-blue-50 text-blue-800 border-blue-200")
          }
          role="status"
          aria-live="polite"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(1);

  // Housekeeping interval to remove expired toasts
  React.useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now();
      setToasts((cur) => cur.filter((t) => t.expiresAt > now));
    }, 500);
    return () => clearInterval(iv);
  }, []);

  const show = useCallback((message: string, options?: ToastOptions) => {
    const id = idRef.current++;
    const type: ToastType = options?.type ?? "info";
    const duration = Math.max(800, options?.durationMs ?? 1800);
    const expiresAt = Date.now() + duration;
    setToasts((cur) => [...cur, { id, message, type, expiresAt }]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (m: string, durationMs?: number) => show(m, { type: "success", durationMs }),
      error: (m: string, durationMs?: number) => show(m, { type: "error", durationMs }),
      info: (m: string, durationMs?: number) => show(m, { type: "info", durationMs }),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastView toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

