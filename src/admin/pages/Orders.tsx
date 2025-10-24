import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminOrders, type AdminOrder, useUpdateOrderStatus } from "../api/useAdminOrders";
import { useAdminShop } from "../api/useAdminShop";
import DataTable from "../components/DataTable";
import { ColumnDef, type Table, type SortingState } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../context/ToastContext";
import apiClient from "../../api/client";

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
  const toast = useToast();
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
  const tableRef = useRef<Table<AdminOrder> | null>(null);

  function copyId(id: number) {
    try {
      navigator.clipboard.writeText(String(id));
      toast.success("Copied");
    } catch (e) {
      toast.error("Copy failed");
    }
  }

  const [loadingItemsId, setLoadingItemsId] = useState<number | null>(null);
  async function openWithItems(order: AdminOrder) {
    try {
      setLoadingItemsId(order.id);
      const res = await apiClient.get(`/api/admin/orders/${order.id}/items`);
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      // Update cache so count and modal reflect latest items
      const prev = qc.getQueriesData<AdminOrder[]>({ queryKey: ["admin", "orders"] });
      prev.forEach(([key, rows]) => {
        if (Array.isArray(rows)) {
          const next = rows.map((o) => (o.id === order.id ? { ...o, items, items_count: items.length } : o));
          qc.setQueryData(key, next as AdminOrder[]);
        }
      });
      setOpen({ ...order, items });
    } catch (e) {
      const msg = (e as any)?.response?.data?.error || (e as Error).message || "Failed to load items";
      toast.error(msg);
      setOpen(order);
    } finally {
      setLoadingItemsId(null);
    }
  }

  function getTotal(o: AdminOrder): number {
    return typeof o.total_price === "number" && !isNaN(o.total_price)
      ? o.total_price
      : (o.items || []).reduce((s: number, it: any) => s + it.price * it.quantity, 0);
  }

  function exportCsv() {
    try {
      const table = tableRef.current;
      const sorting = (table?.getState?.().sorting as SortingState) || [];
      // Sort full filtered dataset using current table sort
      const sortedAll = [...data].sort((a, b) => {
        for (const s of sorting) {
          const { id, desc } = s;
          let av: unknown;
          let bv: unknown;
          switch (id) {
            case "id":
              av = a.id; bv = b.id; break;
            case "created_at":
              av = Date.parse(String(a.created_at || 0));
              bv = Date.parse(String(b.created_at || 0));
              break;
            case "status":
              av = String(a.status || "").toLowerCase();
              bv = String(b.status || "").toLowerCase();
              break;
            case "total": {
              const at = getTotal(a);
              const bt = getTotal(b);
              av = at; bv = bt; break;
            }
            default:
              av = (a as Record<string, unknown>)[id];
              bv = (b as Record<string, unknown>)[id];
          }
          if (av === bv) continue;
          const cmp = (av as any) > (bv as any) ? 1 : (av as any) < (bv as any) ? -1 : 0;
          return desc ? -cmp : cmp;
        }
        return 0;
      });
      const safeRows = sortedAll as AdminOrder[];
      const header = ["id", "customer_name", "customer_email", "status", "created_at", "total"];
      const lines = [header.join(",")];
      for (const o of safeRows) {
        const total = getTotal(o);
        const rec = [
          o.id,
          (o.user?.name || ""),
          (o.user?.email || ""),
          (o.status || ""),
          (o.created_at || ""),
          total,
        ];
        const escaped = rec.map((v) => {
          const s = String(v ?? "");
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        });
        lines.push(escaped.join(","));
      }
      const csv = "\uFEFF" + lines.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      a.download = `orders-page-${page}-${ts}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch (e: any) {
      toast.error("CSV export failed");
    }
  }

  const columns: ColumnDef<AdminOrder>[] = [
    {
      id: "id",
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>#{row.original.id}</span>
          <button
            className="px-2 py-0.5 text-xs rounded border hover:bg-gray-50"
            onClick={() => copyId(row.original.id)}
            aria-label="Copy order ID"
            title="Copy ID"
          >
            Copy
          </button>
        </div>
      ),
    },
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
          className="underline text-blue-600 hover:text-blue-700 disabled:opacity-50"
          onClick={() => openWithItems(row.original)}
          disabled={loadingItemsId === row.original.id}
        >
          {(() => {
            const o = row.original as AdminOrder;
            const itemsLen = Array.isArray(o.items) ? o.items.length : 0;
            const count = itemsLen > 0 ? itemsLen : (typeof (o as any).items_count === "number" ? (o as any).items_count : 0);
            return `${count} items`;
          })()}
        </button>
      ),
    },
    {
      header: "Total",
      cell: ({ row }) => {
        const o = row.original as AdminOrder;
        const total = typeof o.total_price === "number" && !isNaN(o.total_price)
          ? o.total_price
          : (o.items || []).reduce((s, it: any) => s + it.price * it.quantity, 0);
        return <span className="font-semibold">{formatCurrency(total, currency)}</span>;
      },
    },
    { id: "status", accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge s={(row.original.status || "").toLowerCase()} /> },
    { id: "created_at", accessorKey: "created_at", header: "Created", cell: ({ row }) => formatDateTime(row.original.created_at) },
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
                  toast.success("Order status updated");
                } catch (err) {
                  const msg = (err as any)?.response?.data?.error || (err as Error).message || "Failed";
                  toast.error(msg);
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
                onClick={() => toast.info("Courier assignment will be available soon.")}
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
                  toast.success("Order marked as delivered");
                } catch (err) {
                  const msg = (err as any)?.response?.data?.error || (err as Error).message || "Failed";
                  toast.error(msg);
                } finally {
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
          <button className="px-3 py-1 rounded border" onClick={exportCsv} title="Export current page as CSV">Export CSV</button>
        </div>
      </div>

      {/* Toasts are globally rendered by ToastProvider */}

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
            <DataTable columns={columns} data={pageData} onTableReady={(t) => (tableRef.current = t)} />
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
                    {(open.items || []).map((it, idx: number) => (
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
                Total: {formatCurrency(getTotal(open), currency)}
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">Assigned courier: —</div>
          </div>
        </div>
      )}
    </div>
  );
}
