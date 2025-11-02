import { useState } from "react";
import { useAdminPickups, useUpdatePickup, type AdminPickup } from "../api/useAdminPickups";
import DataTable from "../components/DataTable";

function StatusBadge({ s }: { s: string }) {
  const c = (s: string) =>
    s.toLowerCase() === "pending"
      ? "bg-yellow-100 text-yellow-800"
      : s.toLowerCase() === "preparing"
      ? "bg-blue-100 text-blue-800"
      : s.toLowerCase() === "ready"
      ? "bg-purple-100 text-purple-800"
      : s.toLowerCase() === "picked_up"
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c(s)}`}>{s}</span>;
}

export default function Pickups() {
  const [status, setStatus] = useState<string>("");
  const query = useAdminPickups({ status });
  const rows: AdminPickup[] = query.data || [];
  const update = useUpdatePickup();
  const statuses = ["pending", "preparing", "ready", "picked_up"] as const;

  const columns = [
    { header: "ID", accessorKey: "id" },
    { header: "Order", accessorKey: "order_id" },
    { header: "Status", cell: ({ row }: any) => <StatusBadge s={row.original.status} /> },
    { header: "Created", accessorKey: "created_at" },
    { header: "Picked Up", accessorKey: "picked_up_at" },
    {
      header: "Actions",
      cell: ({ row }: any) => {
        const p: AdminPickup = row.original;
        const st = (p.status || '').toLowerCase();
        const locked = st === 'picked_up';
        const idx = statuses.indexOf(st as any);
        return (
          <select
            className="border rounded px-2 py-1 text-xs disabled:opacity-50"
            value={st}
            onChange={async (e) => {
              const next = e.target.value;
              if (next === st) return;
              const targetIdx = statuses.indexOf(next as any);
              if (targetIdx < idx || targetIdx > idx + 1) return; // only next forward
              const payload: any = { id: p.id, status: next };
              if (next === 'picked_up') payload.picked_up_at = new Date().toISOString();
              await update.mutateAsync(payload);
            }}
            disabled={locked || update.isPending}
          >
            {statuses.map((s) => {
              const sIdx = statuses.indexOf(s as any);
              const disabled = sIdx < idx || sIdx > idx + 1;
              return (
                <option key={s} value={s} disabled={disabled}>{s}</option>
              );
            })}
          </select>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-700">Pickups</h1>
        <div className="text-sm text-gray-500">Last updated: {new Date(query.dataUpdatedAt || 0).toLocaleTimeString()}</div>
      </div>
      <div className="flex items-center gap-3">
        <select className="border rounded px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option>Pending</option>
          <option>Preparing</option>
          <option>Ready</option>
          <option>Picked_up</option>
        </select>
        <button className="px-3 py-1 border rounded" onClick={() => query.refetch()}>Refresh</button>
      </div>
      {query.isLoading ? (
        <div>Loading...</div>
      ) : query.error ? (
        <div className="text-red-600">Failed to load pickups</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-600 border rounded-xl p-6 bg-white">No pickups found</div>
      ) : (
        // @ts-ignore
        <DataTable columns={columns as any} data={rows} />
      )}
    </div>
  );
}

