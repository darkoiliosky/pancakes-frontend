import React from "react";
import { useMemo, useState } from "react";
import {
  useAdminModifierGroups,
  useAssignedGroups,
  useSetAssignedGroups,
} from "../api/useAdminModifierGroups";
import { useToast } from "../../context/ToastContext";

export default function AssignModifierGroups({ menuItemId }: { menuItemId: number }) {
  const toast = useToast();
  const { data: all = [] } = useAdminModifierGroups();
  const { data: assigned = [] } = useAssignedGroups(menuItemId);
  const setAssigned = useSetAssignedGroups(menuItemId);

  const assignedIds = useMemo(() => new Set(assigned.map((g) => g.id)), [assigned]);
  const available = all.filter((g) => !assignedIds.has(g.id));
  const [localOrder, setLocalOrder] = useState<number[]>(assigned.map((g) => g.id));

  // Keep local order in sync with server-provided assignments
  React.useEffect(() => {
    setLocalOrder(assigned.map((g) => g.id));
  }, [assigned]);

  const move = (idx: number, dir: -1 | 1) => {
    setLocalOrder((cur) => {
      const next = [...cur];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return cur;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };
  const add = (id: number) => setLocalOrder((cur) => (cur.includes(id) ? cur : [...cur, id]));
  const remove = (id: number) => setLocalOrder((cur) => cur.filter((x) => x !== id));

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="font-semibold text-amber-700 mb-2">Modifier Groups</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded border bg-white p-3">
          <div className="font-medium mb-2">Available</div>
          <ul className="space-y-2">
            {available.map((g) => (
              <li key={g.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{g.title}</div>
                  <div className="text-xs text-gray-600">
                    min {g.min_select} • {g.max_select === 0 ? "unlimited" : `max ${g.max_select}`}
                  </div>
                </div>
                <button
                  type="button"
                  className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700 hover:bg-amber-200"
                  onClick={() => add(g.id)}
                >
                  Attach
                </button>
              </li>
            ))}
            {available.length === 0 && (
              <li className="text-sm text-gray-500">No groups to attach</li>
            )}
          </ul>
        </div>
        <div className="rounded border bg-white p-3">
          <div className="font-medium mb-2">Assigned (order)</div>
          <ul className="space-y-2">
            {localOrder.map((id, idx) => {
              const g = all.find((x) => x.id === id);
              if (!g) return null;
              return (
                <li key={id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{g.title}</div>
                    <div className="text-xs text-gray-600">
                      min {g.min_select} • {g.max_select === 0 ? "unlimited" : `max ${g.max_select}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-2 py-1 text-xs rounded border"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs rounded border"
                      onClick={() => move(idx, +1)}
                      disabled={idx === localOrder.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                      onClick={() => remove(id)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
            {localOrder.length === 0 && (
              <li className="text-sm text-gray-500">None assigned</li>
            )}
          </ul>
          <div className="text-right mt-3">
            <button
              type="button"
              className="px-3 py-2 rounded bg-amber-500 text-white disabled:opacity-50"
              onClick={async () => {
                try {
                  await setAssigned.mutateAsync(localOrder);
                  toast.success("Modifier groups updated");
                } catch {
                  toast.error("Failed to update groups");
                }
              }}
              disabled={setAssigned.isPending}
            >
              {setAssigned.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

