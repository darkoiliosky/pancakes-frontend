import { useState } from "react";
import { useAdminOrders, type AdminOrder } from "../api/useAdminOrders";
import DataTable from "../components/DataTable";
import { ColumnDef } from "@tanstack/react-table";

export default function Orders() {
  const [status, setStatus] = useState<string>("");
  const [user, setUser] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const { data = [], isLoading, error } = useAdminOrders({ status, user, from, to });

  const columns: ColumnDef<AdminOrder>[] = [
    { header: "ID", accessorKey: "id" },
    { header: "User", cell: ({ row }) => row.original.user?.name || row.original.user?.email || "-" },
    { header: "Restaurant", cell: ({ row }) => row.original.restaurant?.name || "-" },
    { header: "Status", accessorKey: "status" },
    { header: "Date", accessorKey: "created_at" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-amber-700">Orders</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input className="border rounded px-3 py-2" placeholder="User name/email" value={user} onChange={(e) => setUser(e.target.value)} />
        <select className="border rounded px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option>Pending</option>
          <option>Accepted</option>
          <option>Preparing</option>
          <option>Delivering</option>
          <option>Delivered</option>
          <option>Cancelled</option>
        </select>
        <input type="date" className="border rounded px-3 py-2" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" className="border rounded px-3 py-2" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">Failed to load orders</div>
      ) : (
        <>
          <DataTable columns={columns} data={data} />
          <div className="mt-6 space-y-4">
            {data.map((o) => (
              <div key={o.id} className="p-4 border rounded-xl bg-white">
                <div className="font-semibold text-amber-700">Order #{o.id}</div>
                <div className="text-sm text-gray-600">{o.user?.name || o.user?.email || "-"} • {o.restaurant?.name || "-"} • {o.status}</div>
                {!!o.items?.length && (
                  <div className="mt-2">
                    <div className="text-sm font-medium">Items</div>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {o.items.map((it) => (
                        <li key={it.id}>{it.name} × {it.quantity} — ${it.price.toFixed(2)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
