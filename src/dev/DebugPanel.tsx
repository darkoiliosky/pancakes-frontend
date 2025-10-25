import { useEffect, useMemo, useState } from "react";
import { queryClient } from "../lib/queryClient";

export default function DebugPanel() {
  const [open, setOpen] = useState<boolean>(() => localStorage.getItem("rqDebug") === "1");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const sub = queryClient.getQueryCache().subscribe(() => {
      // Defer state updates to avoid setState during other component renders
      setTimeout(() => setTick((t) => t + 1), 0);
    });
    return () => sub?.();
  }, []);

  const rows = useMemo(() => {
    return queryClient
      .getQueryCache()
      .getAll()
      .map((q) => ({
        key: q.queryKey.join(":"),
        state: q.state.status,
        dataUpdatedAt: q.state.dataUpdatedAt,
      }));
  }, [tick]);

  if (!open) {
    return (
      <button
        onClick={() => {
          localStorage.setItem("rqDebug", "1");
          setOpen(true);
        }}
        className="fixed bottom-3 right-3 z-[1000] px-2 py-1 rounded border bg-white text-xs shadow"
        aria-label="Open debug panel"
      >
        RQ
      </button>
    );
  }

  return (
    <div className="fixed bottom-3 right-3 z-[1000] w-80 max-h-96 overflow-auto bg-white border rounded-lg shadow">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="text-sm font-medium">React Query Debug</div>
        <button
          className="text-xs text-gray-600 hover:text-gray-800"
          onClick={() => {
            localStorage.removeItem("rqDebug");
            setOpen(false);
          }}
        >
          Close
        </button>
      </div>
      <div className="divide-y">
        {rows.map((r) => (
          <div key={r.key} className="px-3 py-2 text-xs flex justify-between gap-2">
            <span className="truncate max-w-[200px]" title={r.key}>{r.key}</span>
            <span className="text-gray-600">{r.state}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
