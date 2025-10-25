import { useMemo } from "react";
import { useCourierDeliveries, useUpdateCourierDelivery, useAvailableOrders, useSelfAssign } from "../api/useCourierDeliveries";
import { useToast } from "../../context/ToastContext";

function StatusBadge({ s }: { s: string }) {
  const st = (s || "").toLowerCase();
  const cls = st === "pending"
    ? "bg-yellow-100 text-yellow-800"
    : st === "accepted"
    ? "bg-blue-100 text-blue-800"
    : st === "delivering"
    ? "bg-purple-100 text-purple-800"
    : st === "delivered"
    ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-800";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{st}</span>;
}

export default function MyDeliveries() {
  const { data = [], isLoading, isError, refetch } = useCourierDeliveries();
  const update = useUpdateCourierDelivery();
  const available = useAvailableOrders();
  const selfAssign = useSelfAssign();
  const toast = useToast();

  const rows = useMemo(() => data, [data]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-amber-700">My Deliveries</h1>
        <button className="px-3 py-1 rounded bg-amber-500 text-white hover:bg-amber-600" onClick={() => refetch()}>Refresh</button>
      </div>
      {/* Available orders to accept */}
      <div className="rounded-xl border bg-white mb-6">
        <div className="px-4 py-3 border-b font-medium">Available Orders</div>
        {available.isLoading ? (
          <div className="p-4 text-gray-600">Loading...</div>
        ) : (available.data || []).length === 0 ? (
          <div className="p-4 text-gray-600">No available orders.</div>
        ) : (
          <div className="divide-y">
            {(available.data || []).map((o) => (
              <div key={o.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">Order #{o.id} · {(o.status || '').toUpperCase()}</div>
                  <div className="text-gray-600 truncate">{o.delivery_address || "Pickup"}</div>
                </div>
                <button
                  className="px-3 py-1 rounded bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 ml-3"
                  onClick={async () => {
                    try {
                      await selfAssign.mutateAsync({ order_id: o.id });
                      toast.success("Order accepted");
                      available.refetch();
                      refetch();
                    } catch (e: any) {
                      const msg = e?.response?.data?.error || e?.message || "Accept failed";
                      toast.error(msg);
                    }
                  }}
                  disabled={selfAssign.isPending}
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-xl border bg-white p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-gray-600">Loading...</div>
        ) : isError ? (
          <div className="p-6 text-red-600">Failed to load deliveries</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-gray-600">No deliveries assigned.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#f8f8f8]">
              <tr>
                <th className="text-left px-4 py-2">#</th>
                <th className="text-left px-4 py-2">Order</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Created</th>
                <th className="text-right px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const st = (d.status || "").toLowerCase();
                const seq = ["pending", "accepted", "delivering", "delivered"];
                const idx = Math.max(0, seq.indexOf(st as any));
                const next = idx < seq.length - 1 ? seq[idx + 1] : null;
                return (
                  <tr key={d.id} className="even:bg-amber-50/20">
                    <td className="px-4 py-2">{d.id}</td>
                    <td className="px-4 py-2">#{d.order_id}</td>
                    <td className="px-4 py-2"><StatusBadge s={st} /></td>
                    <td className="px-4 py-2">{d.created_at ? new Date(d.created_at).toLocaleString() : ""}</td>
                    <td className="px-4 py-2 text-right">
                      {next ? (
                        <button
                          className="px-3 py-1 rounded bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                          onClick={async () => {
                            await update.mutateAsync({ id: d.id, status: next });
                            refetch();
                          }}
                          disabled={update.isPending}
                        >
                          Mark {next}
                        </button>
                      ) : (
                        <span className="text-gray-500">Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
