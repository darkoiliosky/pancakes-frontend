import { useEffect, useMemo, useState } from "react";
import { useAdminOrders, type AdminOrder, useUpdateOrderStatus } from "../api/useAdminOrders";
import { useAdminShop } from "../api/useAdminShop";
import DataTable from "../components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";

const statuses = ["pending", "accepted", "preparing", "ready", "delivering", "delivered", "cancelled"] as const;

function formatDateTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(n: number, currency = "$") {
  try {
    return `${currency}${n.toFixed(2)}`;
  } catch {
    return `${currency}${Number(n || 0).toFixed(2)}`;
  }
}

function StatusBadge({ s }: { s: string }) {
  const c = (s: string) =>
    s === "pending"
      ? "bg-yellow-100 text-yellow-800"
      : s === "preparing" || s === "accepted" || s === "ready"
      ? "bg-blue-100 text-blue-800"
      : s === "delivering"
      ? "bg-purple-100 text-purple-800"
      : s === "delivered"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c(s)}`}>{s}</span>;
}

export default function Orders() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("");
  const [user, setUser] = useState<string>("");
  const [debounced, setDebounced] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [toast, setToast] = useState<string>("");
  const { data = [], isLoading, error, dataUpdatedAt } = useAdminOrders({ status, user: debounced, from, to });
  const updateStatus = useUpdateOrderStatus();
  const shop = useAdminShop();
  const currency = shop.data?.currency || "$";

  useEffect(() => {
    const t = setTimeout(() => setDebounced(user), 300);
    return () => clearTimeout(t);
  }, [user]);

  const total = data.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pageData = useMemo(() => data.slice((page - 1) * pageSize, page * pageSize), [data, page, pageSize]);

  const columns: ColumnDef<AdminOrder>[] = [
    { header: "ID", accessorKey: "id" },
    {
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <div>{row.original.user?.name || row.original.user?.email || "-"}</div>
          {row.original.user?.email && (
            <div className="text-xs text-gray-500">{row.original.user?.email}</div>
          )}
        </div>
      ),
    },
    {
      header: "Items",
      cell: ({ row }) => (
        <button
          aria-label="View items"
          className="underline text-blue-600 hover:text-blue-700"
          onClick={() => setOpen(row.original)}
        >
          {(row.original.items || []).length} items
        </button>
      ),
    },
    {
      header: "Total",
      cell: ({ row }) => (
        <span className="font-semibold">
          {formatCurrency((row.original.items || []).reduce((s, it: any) => s + it.price * it.quantity, 0), currency)}
        </span>
      ),
    },
    { header: "Status", cell: ({ row }) => <StatusBadge s={(row.original.status || "").toLowerCase()} /> },
    { header: "Created", cell: ({ row }) => formatDateTime(row.original.created_at as any) },
    {
      header: "Actions",
      cell: ({ row }) => {
        const st = (row.original.status || "").toLowerCase();
        const locked = st === "delivered" || st === "cancelled";
        return (
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50"
              onClick={() => setOpen(row.original)}
              disabled={false}
              aria-label="View details"
            >
              View Details
            </button>
            <select
              className="border rounded px-2 py-1 text-xs disabled:opacity-50"
              value={st}
              onChange={async (e) => {
                try {
                  await updateStatus.mutateAsync({ id: row.original.id, status: e.target.value });
                } catch (err: any) {
                  const msg = err?.response?.data?.error || err?.message || "Failed";
                  setToast(msg);
                  setTimeout(() => setToast(""), 2000);
                }
              }}
              aria-label="Change status"
              disabled={locked}
              title={locked ? "Status cannot be changed after delivery/cancellation" : undefined}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {row.original.courier?.name ? (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-1">Courier: {row.original.courier.name}</span>
            ) : (
              <button
                className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                onClick={() => {
                  setToast("Courier assignment will be available soon.");
                  setTimeout(() => setToast(""), 2000);
                }}
                aria-label="Assign courier"
                disabled={locked}
                title={locked ? "Cannot assign courier to delivered/cancelled order" : undefined}
              >
                Assign courier
              </button>
            )}
            {(["pending", "accepted", "preparing", "ready", "delivering"] as string[]).includes(st) && (
              <button
              className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
              onClick={async () => {
                const ok = window.confirm("Mark this order as delivered?");
                if (!ok) return;
                try {
                  await updateStatus.mutateAsync({ id: row.original.id, status: "delivered" });
                  setToast("Order marked as delivered");
                } catch (err: any) {
                  const msg = err?.response?.data?.error || err?.message || "Failed";
                  setToast(msg);
                } finally {
                  setTimeout(() => setToast(""), 1500);
                  refresh();
                }
              }}
              aria-label="Mark delivered"
              disabled={updateStatus.isPending}
            >
              Mark delivered
            </button>
            )}
          </div>
        );
      },
    },
  ];

  const [open, setOpen] = useState<AdminOrder | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "orders"] });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-700">Orders</h1>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>Last updated: {new Date(dataUpdatedAt || 0).toLocaleTimeString()}</span>
          <button className="px-3 py-1 rounded bg-amber-500 text-white hover:bg-amber-600" onClick={refresh}>Refresh</button>
        </div>
      </div>

      {toast && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Search name/email" value={user} onChange={(e) => setUser(e.target.value)} />
        <select className="border rounded px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input type="date" className="border rounded px-3 py-2" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" className="border rounded px-3 py-2" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-8 bg-amber-100 rounded" />
          <div className="h-8 bg-amber-100 rounded" />
          <div className="h-8 bg-amber-100 rounded" />
        </div>
      ) : error ? (
        <div className="text-red-600 flex items-center gap-3">
          <span>Failed to load orders</span>
          <button className="px-2 py-1 border rounded" onClick={refresh}>Retry</button>
        </div>
      ) : (
        <>
          {pageData.length === 0 ? (
            <div className="text-sm text-gray-600 border rounded-xl p-6 bg-white">
              {status || debounced || from || to ? (
                <div className="flex items-center gap-3">
                  <span>No orders match your filters.</span>
                  <button className="px-2 py-1 border rounded" onClick={() => { setStatus(""); setUser(""); setFrom(""); setTo(""); }}>Clear filters</button>
                </div>
              ) : (
                <span>No orders yet.</span>
              )}
            </div>
          ) : (
            <DataTable columns={columns} data={pageData} />
          )}
          <div className="flex items-center justify-between text-sm">
            <div>
              Page {page} of {pages} • {total} orders
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Page size"
                className="border rounded px-2 py-1"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              >
                {[20, 50, 100].map((s) => (
                  <option key={s} value={s}>{s} / page</option>
                ))}
              </select>
              <button disabled={page <= 1} className="px-2 py-1 border rounded disabled:opacity-50" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
              <button disabled={page >= pages} className="px-2 py-1 border rounded disabled:opacity-50" onClick={() => setPage((p) => Math.min(pages, p + 1))}>Next</button>
            </div>
          </div>
        </>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-amber-700">Order #{open.id}</h2>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setOpen(null)}>✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Customer</div>
                <div>{open.user?.name || "-"}</div>
                <div className="text-gray-600">{open.user?.email || "-"}</div>
              </div>
              <div>
                <div className="font-medium">Status</div>
                <div className="flex items-center gap-2">
                  <StatusBadge s={(open.status || "").toLowerCase()} />
                  <select
                    className="border rounded px-2 py-1 text-xs"
                    value={(open.status || "").toLowerCase()}
                    onChange={async (e) => {
                      await updateStatus.mutateAsync({ id: open.id, status: e.target.value });
                      refresh();
                    }}
                    aria-label="Change status in modal"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <div className="font-medium">Created</div>
                <div>{formatDateTime(open.created_at as any)}</div>
              </div>
              <div>
                <div className="font-medium">Updated</div>
                <div>{/* updated_at optional */}</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="font-medium mb-1">Items</div>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#f8f8f8]">
                    <tr>
                      <th className="text-left px-3 py-2">Name</th>
                      <th className="text-left px-3 py-2">Qty</th>
                      <th className="text-left px-3 py-2">Price</th>
                      <th className="text-left px-3 py-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(open.items || []).map((it: any, idx: number) => (
                      <tr key={idx} className="even:bg-amber-50/20">
                        <td className="px-3 py-2">{it.name}</td>
                        <td className="px-3 py-2">{it.quantity}</td>
                        <td className="px-3 py-2">{formatCurrency(it.price, currency)}</td>
                        <td className="px-3 py-2">{formatCurrency(it.price * it.quantity, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-right mt-2 font-semibold">
                Total: {formatCurrency(((open.items || []).reduce((s: number, it: any) => s + it.price * it.quantity, 0)), currency)}
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">Assigned courier: —</div>
          </div>
        </div>
      )}
    </div>
  );
}
