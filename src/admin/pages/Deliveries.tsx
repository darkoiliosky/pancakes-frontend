import { useEffect, useMemo, useState } from "react";
import { useAdminDeliveries, type AdminDelivery, useCreateDelivery, useUpdateDelivery } from "../api/useAdminDeliveries";
import DataTable from "../components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { useAdminUsers } from "../api/useAdminUsers";
import { useToast } from "../../context/ToastContext";

function StatusBadge({ s }: { s: string }) {
  const c = (s: string) =>
    s.toLowerCase() === "pending"
      ? "bg-yellow-100 text-yellow-800"
      : s.toLowerCase() === "accepted"
      ? "bg-blue-100 text-blue-800"
      : s.toLowerCase() === "delivering"
      ? "bg-purple-100 text-purple-800"
      : s.toLowerCase() === "delivered"
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c(s)}`}>{s}</span>;
}

export default function Deliveries() {
  const [status, setStatus] = useState<string>("");
  const toast = useToast();
  const query = useAdminDeliveries({ status });
  const isLoading = query.isLoading;
  const error = (query.error as Error) || null;
  const dataUpdatedAt = query.dataUpdatedAt;
  // Hook already returns a plain array
  const rows: AdminDelivery[] = (query.data as AdminDelivery[]) || [];
  const usersQuery = useAdminUsers();
  const couriers = useMemo(() => (usersQuery.data || []).filter((u) => (u.role as string)?.toLowerCase() === "courier"), [usersQuery.data]);
  const createDelivery = useCreateDelivery();
  const updateDelivery = useUpdateDelivery();

  const [assignForOrder, setAssignForOrder] = useState<number | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<number | "">("");
  const statuses = ["pending", "accepted", "delivering", "delivered"] as const;

  const columns: ColumnDef<AdminDelivery>[] = [
    { header: "ID", accessorKey: "id" },
    { header: "Order", accessorKey: "order_id" },
    { header: "Courier", cell: ({ row }) => row.original.courier?.name || row.original.courier?.email || "-" },
    { header: "Status", cell: ({ row }) => <StatusBadge s={row.original.status} /> },
    { header: "Created", accessorKey: "created_at" },
    {
      header: "Actions",
      cell: ({ row }) => {
        const d = row.original;
        const st = (d.status || "").toLowerCase();
        const locked = st === "delivered";
        const currentIdx = Math.max(0, statuses.indexOf(st as any));
        return (
          <div className="flex items-center gap-2">
            {d.courier?.name ? (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-1">Courier: {d.courier.name}</span>
            ) : (
              !locked && (
                <button
                  className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                  onClick={() => setAssignForOrder(d.order_id)}
                  disabled={createDelivery.isPending}
                  title="Assign courier"
                >
                  Assign courier
                </button>
              )
            )}
            {/* Status transition dropdown */}
            <select
              className="border rounded px-2 py-1 text-xs disabled:opacity-50"
              value={st}
              onChange={async (e) => {
                const target = (e.target.value || "").toLowerCase();
                if (target === st) return;
                // Only allow next-in-sequence transition
                const targetIdx = statuses.indexOf(target as any);
                if (targetIdx !== currentIdx + 1) return;
                try {
                  const payload: { id: number; status: string; delivered_at?: string } = { id: d.id, status: target };
                  if (target === "delivered") payload.delivered_at = new Date().toISOString();
                  await updateDelivery.mutateAsync(payload);
                  toast.success(`Status updated to ${target}`);
                } catch (err: any) {
                  const msg = err?.response?.data?.error || err?.message || "Failed to update status";
                  toast.error(msg);
                }
              }}
              disabled={locked || updateDelivery.isPending}
              title={locked ? "Delivery completed" : "Update status"}
              aria-label="Change delivery status"
            >
              {statuses.map((s) => {
                const idx = statuses.indexOf(s as any);
                const isBackward = idx < currentIdx;
                const isSkipForward = idx > currentIdx + 1;
                const disabled = isBackward || isSkipForward;
                return (
                  <option key={s} value={s} disabled={disabled}>
                    {s}
                  </option>
                );
              })}
            </select>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-700">Deliveries</h1>
        <div className="text-sm text-gray-500">Last updated: {new Date(dataUpdatedAt || 0).toLocaleTimeString()}</div>
      </div>
      <div className="flex items-center gap-3">
        <select className="border rounded px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option>Pending</option>
          <option>Accepted</option>
          <option>Delivering</option>
          <option>Delivered</option>
        </select>
        <button className="px-3 py-1 border rounded" onClick={() => query.refetch()}>Refresh</button>
      </div>
      {/* Toasts are globally rendered by ToastProvider */}
      {isLoading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">Failed to load deliveries</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-600 border rounded-xl p-6 bg-white">No deliveries found</div>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}

      {/* Assign courier modal */}
      {assignForOrder !== null && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4" onClick={() => setAssignForOrder(null)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Assign courier</h2>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setAssignForOrder(null)}>✕</button>
            </div>
            <div className="space-y-3">
              <select
                className="border rounded w-full px-3 py-2"
                value={selectedCourier}
                onChange={(e) => setSelectedCourier(Number(e.target.value))}
              >
                <option value="">Select courier</option>
                {couriers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name || c.email}</option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button className="px-3 py-2 border rounded" onClick={() => setAssignForOrder(null)}>Cancel</button>
                <button
                  className="px-3 py-2 rounded bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
                  disabled={!selectedCourier || createDelivery.isPending}
                  onClick={async () => {
                    try {
                      await createDelivery.mutateAsync({ order_id: assignForOrder!, courier_id: Number(selectedCourier) });
                      toast.success("Courier assigned");
                      setAssignForOrder(null);
                      setSelectedCourier("");
                    } catch (e: any) {
                      const msg = e?.response?.data?.error || e?.message || "Failed";
                      toast.error(msg);
                    }
                  }}
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
