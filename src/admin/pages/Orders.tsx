import { useEffect, useRef, useState } from "react";
import { useAdminOrders, type AdminOrder, useUpdateOrderStatus } from "../api/useAdminOrders";
import { useAdminShop } from "../api/useAdminShop";
import DataTable from "../components/DataTable";
import { ColumnDef, type Table, type SortingState } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../context/ToastContext";
import apiClient from "../../api/client";
import { moneyFormat } from "../../utils/format";
import { parseAxiosError } from "../../api/errors";
import { useCouriers } from "../api/useCouriers";
import { useCreateDelivery } from "../api/useAdminDeliveries";

const statusesDelivery = ["pending", "accepted", "preparing", "ready", "delivering", "delivered", "cancelled"] as const;
const statusesPickup = ["pending", "preparing", "ready", "picked_up", "cancelled"] as const;
type StatusDelivery = typeof statusesDelivery[number];
type StatusPickup = typeof statusesPickup[number];
type Status = StatusDelivery | StatusPickup;
const allStatuses: Status[] = Array.from(new Set([...(statusesDelivery as readonly string[]), ...(statusesPickup as readonly string[])])) as Status[];

type OrderItemDisplay = { name: string; price: number; quantity: number; subtotal?: number; modifiers?: { name: string; price_delta: number }[] };

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

// use moneyFormat instead

function StatusBadge({ s }: { s: string }) {
  const c = (s: string) =>
    s === "pending"
      ? "bg-yellow-100 text-yellow-800"
      : s === "preparing" || s === "accepted" || s === "ready"
      ? "bg-blue-100 text-blue-800"
      : s === "delivering"
      ? "bg-purple-100 text-purple-800"
      : s === "delivered" || s === "picked_up"
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
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);
  const sortBy = sorting[0]?.id && ["id","created_at","status","total"].includes(String(sorting[0].id)) ? String(sorting[0].id) : undefined;
  const sortDir = sorting[0] ? (sorting[0].desc ? "desc" : "asc") : undefined;
  const { data: resp, isLoading, error, dataUpdatedAt } = useAdminOrders({ status, user: debounced, from, to, type: typeFilter, page, pageSize, sortBy, sortDir });
  const data = resp?.orders || [];
  const updateStatus = useUpdateOrderStatus();
  const shop = useAdminShop();
  const currency = shop.data?.currency || "$";

  useEffect(() => {
    const t = setTimeout(() => setDebounced(user), 300);
    return () => clearTimeout(t);
  }, [user]);

  const total = resp?.total ?? data.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pageData = data;
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
  function hasOrdersRows(r: unknown): r is { orders: AdminOrder[] } {
    return typeof r === 'object' && r !== null && 'orders' in r && Array.isArray((r as { orders: unknown }).orders);
  }
  async function openWithItems(order: AdminOrder) {
    try {
      setLoadingItemsId(order.id);
      const res = await apiClient.get(`/api/admin/orders/${order.id}/items`);
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      // Update cache so count and modal reflect latest items
      const prev = qc.getQueriesData({ queryKey: ["admin", "orders"] });
      prev.forEach(([key, rows]) => {
        if (Array.isArray(rows)) {
          const list = rows as AdminOrder[];
          const next = list.map((o) => (o.id === order.id ? { ...o, items, items_count: items.length } : o));
          qc.setQueryData(key, next);
        } else if (hasOrdersRows(rows)) {
          const next = { ...rows, orders: rows.orders.map((o) => (o.id === order.id ? { ...o, items, items_count: items.length } : o)) };
          qc.setQueryData(key, next);
        }
      });
      setOpen({ ...order, items });
    } catch (e) {
      toast.error(parseAxiosError(e));
      setOpen(order);
    } finally {
      setLoadingItemsId(null);
    }
  }

  function getTotal(o: AdminOrder): number {
    return typeof o.total_price === "number" && !isNaN(o.total_price)
      ? o.total_price
      : (o.items || []).reduce((s: number, it: OrderItemDisplay) => s + (typeof it.subtotal === 'number' ? it.subtotal : (it.price * it.quantity)), 0);
  }

  function computeItemSubtotal(it: any): number {
    if (typeof (it as any)?.subtotal === 'number') return Number((it as any).subtotal);
    const price = Number((it as any)?.price || 0);
    const qty = Number((it as any)?.quantity || 0);
    const mods = Array.isArray((it as any)?.modifiers) ? (it as any).modifiers : [];
    const modsSum = mods.reduce((acc: number, m: any) => acc + Number((m?.price_delta) || 0), 0);
    return (price + modsSum) * qty;
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
          const avs = String(av ?? "");
          const bvs = String(bv ?? "");
          const cmp = avs > bvs ? 1 : avs < bvs ? -1 : 0;
          return desc ? -cmp : cmp;
        }
        return 0;
      });
          const safeRows = sortedAll as AdminOrder[];
      const header = ["id", "customer_name", "customer_email", "status", "type", "created_at", "updated_at", "total"];
      const lines = [header.join(",")];
          for (const o of safeRows) {
            const total = getTotal(o);
            const rec = [
              o.id,
              (o.user?.name || ""),
              (o.user?.email || ""),
          (o.status || ""),
          (o.order_type || ""),
          (o.created_at || ""),
          (o.updated_at || ""),
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
    } catch (e: unknown) {
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
            const ic = (o as unknown as { items_count?: number }).items_count;
            const count = itemsLen > 0 ? itemsLen : (typeof ic === 'number' ? ic : 0);
            return `${count} items`;
          })()}
        </button>
      ),
    },
    { id: "order_type", accessorKey: "order_type", header: "Type", cell: ({ row }) => <span className="capitalize">{(row.original.order_type || "-")}</span> },
    {
      id: "total",
      header: "Total",
      cell: ({ row }) => {
        const o = row.original as AdminOrder;
        const total = typeof o.total_price === "number" && !isNaN(o.total_price)
          ? o.total_price
          : (o.items || []).reduce((s, it: any) => {
              const sub: number = typeof (it as any).subtotal === 'number'
                ? Number((it as any).subtotal)
                : Number(it.price || 0) * Number(it.quantity || 0);
              return s + sub;
            }, 0);
        return <span className="font-semibold">{moneyFormat(total, currency)}</span>;
      },
    },
    { id: "status", accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge s={(row.original.status || "").toLowerCase()} /> },
    { id: "created_at", accessorKey: "created_at", header: "Created", cell: ({ row }) => formatDateTime(row.original.created_at) },
    {
      header: "Actions",
      cell: ({ row }) => {
        const st = (row.original.status || "").toLowerCase();
        const locked = st === "delivered" || st === "picked_up" || st === "cancelled";
        return (
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50"
              onClick={() => openWithItems(row.original)}
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
                  toast.error(parseAxiosError(err));
                }
              }}
              aria-label="Change status"
              disabled={locked || updateStatus.isPending}
              title={locked ? "Status cannot be changed after delivery/cancellation" : (updateStatus.isPending ? "Updating..." : undefined)}
            >
              {(row.original.order_type === 'pickup' ? statusesPickup : statusesDelivery).map((s: Status) => {
                const order = row.original as AdminOrder;
                const list = (order.order_type === 'pickup' ? statusesPickup : statusesDelivery) as readonly string[];
                const curIdx = list.indexOf((order.status || "") as string);
                const idx = list.indexOf(s as string);
                const disabled = s !== "cancelled" && (idx < curIdx);
                return (
                  <option key={s} value={s} disabled={disabled}>{s}</option>
                );
              })}
            </select>
            {(row.original.order_type === 'pickup') ? null : (row.original.courier?.name ? (
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
            ))}
            {(() => {
              const isPickup = (row.original.order_type || 'delivery') === 'pickup';
              const active = isPickup ? ["pending","preparing","ready"] : ["pending","accepted","preparing","ready","delivering"];
              return active.includes(st);
            })() && (
              <button
              className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
              onClick={async () => {
                const isPickup = (row.original.order_type || 'delivery') === 'pickup';
                const ok = window.confirm(isPickup ? "Mark this order as picked up?" : "Mark this order as delivered?");
                if (!ok) return;
                try {
                  await updateStatus.mutateAsync({ id: row.original.id, status: ((row.original.order_type || 'delivery') === 'pickup') ? "picked_up" : "delivered" });
                  toast.success(((row.original.order_type || 'delivery') === 'pickup') ? "Order marked as picked up" : "Order marked as delivered");
                } catch (err) {
                  toast.error(parseAxiosError(err));
                } finally {
                  refresh();
                }
              }}
              aria-label={(row.original.order_type || 'delivery') === 'pickup' ? "Mark picked up" : "Mark delivered"}
              disabled={updateStatus.isPending}
            >
              {(row.original.order_type || 'delivery') === 'pickup' ? 'Mark picked up' : 'Mark delivered'}
            </button>
            )}
          </div>
        );
      },
    },
  ];

  const [open, setOpen] = useState<AdminOrder | null>(null);
  const [modalUpdating, setModalUpdating] = useState(false);
  const modalUpdatingRef = useRef(false);
  const couriers = useCouriers();
  const createDelivery = useCreateDelivery();
  const [assignId, setAssignId] = useState<number | "">("");

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

      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Search name/email" value={user} onChange={(e) => setUser(e.target.value)} />
        <select className="border rounded px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {allStatuses.map((s: Status) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className="border rounded px-3 py-2" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          <option value="delivery">delivery</option>
          <option value="pickup">pickup</option>
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
            <DataTable columns={columns} data={pageData} onTableReady={(t) => (tableRef.current = t)} sorting={sorting} onSortingChange={(s: SortingState) => { setSorting(s); setPage(1); }} manualSort />
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
                      if (modalUpdatingRef.current) return;
                      modalUpdatingRef.current = true;
                      setModalUpdating(true);
                      const nextStatus = e.target.value;
                      if (!open) return;
                      const prevOpen = open;
                      // Optimistically reflect new status in modal, same as table does via cache
                      setOpen({ ...prevOpen, status: nextStatus });
                      try {
                        await updateStatus.mutateAsync({ id: open.id, status: nextStatus });
                      } catch (err) {
                        // noop; toast handled in hook caller elsewhere if needed
                        // Revert optimistic local state on error
                        setOpen(prevOpen);
                      } finally {
                        setModalUpdating(false);
                        modalUpdatingRef.current = false;
                      }
                    }}
                    aria-label="Change status in modal"
                    disabled={updateStatus.isPending || modalUpdating}
                  >
                    {(open.order_type === 'pickup' ? statusesPickup : statusesDelivery).map((s: Status) => {
                      const list = (open.order_type === 'pickup' ? statusesPickup : statusesDelivery) as readonly string[];
                      const curIdx = list.indexOf((open.status || "") as string);
                      const idx = list.indexOf(s as string);
                      const disabled = s !== "cancelled" && (idx < curIdx);
                      return (
                        <option key={s} value={s} disabled={disabled}>{s}</option>
                      );
                    })}
                  </select>
                </div>
                {(updateStatus.isPending || modalUpdating) && (
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span className="inline-block h-3 w-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" aria-hidden />
                    Updating...
                  </div>
                )}
              </div>
              <div>
                <div className="font-medium">Created</div>
                <div>{formatDateTime(open.created_at)}</div>
              </div>
              <div>
                <div className="font-medium">Updated</div>
                <div>{open.updated_at ? formatDateTime(open.updated_at) : ""}</div>
              </div>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="font-medium">Order Type</div>
                  <div className="capitalize">{(open.order_type || 'delivery')}</div>
                </div>
                <div>
                  <div className="font-medium">Phone</div>
                  <div>{open.phone || '-'}</div>
                </div>
                {(open.order_type || 'delivery') === 'delivery' && (
                  <div className="md:col-span-2">
                    <div className="font-medium">Delivery Address</div>
                    <div className="whitespace-pre-wrap break-words">{open.delivery_address || '-'}</div>
                  </div>
                )}
                {open.notes && (
                  <div className="md:col-span-2">
                    <div className="font-medium">Notes</div>
                    <div className="whitespace-pre-wrap break-words">{open.notes}</div>
                  </div>
                )}
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
                    {(open.items || []).map((it, idx: number) => {
                      const item = it as any;
                      const mods = Array.isArray(item.modifiers)
                        ? item.modifiers
                        : (Array.isArray(item.mods) ? item.mods : []);
                      const sub = computeItemSubtotal(it);
                      return (
                        <>
                          <tr key={`row-${idx}`} className="even:bg-amber-50/20 align-top">
                            <td className="px-3 py-2">
                              <div>{item.name || item.item_name}</div>
                            </td>
                            <td className="px-3 py-2">{item.quantity}</td>
                            <td className="px-3 py-2">{moneyFormat(Number(item.price || item.item_price || 0), currency)}</td>
                            <td className="px-3 py-2">{moneyFormat(sub, currency)}</td>
                          </tr>
                          {mods.length > 0 && (
                            <tr key={`mods-${idx}`} className="even:bg-amber-50/20">
                              <td className="px-3 py-1 text-xs text-gray-700" colSpan={4}>
                                <span className="font-medium mr-1">Extras:</span>
                                {mods.map((m: any, mi: number) => {
                                  const pd = Number(m.price_delta) || 0;
                                  const sign = pd >= 0 ? "+" : "-";
                                  return (
                                    <span key={mi} className="mr-3 inline-block">
                                      {m.name} <span className={pd >= 0 ? "text-green-700" : "text-red-700"}>{sign}{moneyFormat(Math.abs(pd), currency)}</span>
                                    </span>
                                  );
                                })}
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="text-right mt-2 font-semibold">
                Total: {moneyFormat(getTotal(open), currency)}
              </div>
            </div>
            {(open.order_type || 'delivery') !== 'pickup' && (
            <div className="mt-4 text-sm text-gray-800">
              <div className="font-medium mb-1">Courier</div>
              {open.courier ? (
                <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {open.courier.name || open.courier.email || `#${open.courier.id}`}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    className="border rounded px-2 py-1"
                    value={assignId as number | ""}
                    onChange={(e) => setAssignId(Number(e.target.value))}
                  >
                    <option value="">Select courier…</option>
                    {(couriers.data || []).map((c) => (
                      <option key={c.id} value={c.id}>{c.name || c.email || `#${c.id}`}</option>
                    ))}
                  </select>
                  <button
                    className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    disabled={!assignId || createDelivery.isPending}
                    onClick={async () => {
                      if (!assignId || !open) return;
                      try {
                        await createDelivery.mutateAsync({ order_id: open.id, courier_id: assignId as number, status: "accepted" });
                        toast.success("Courier assigned");
                        setAssignId("");
                        refresh();
                        // reflect in modal
                        const found = (couriers.data || []).find((c) => c.id === assignId);
                        if (!open) return;
                        const nextCourier = found ? { id: found.id, name: found.name, email: found.email } : { id: assignId as number };
                        setOpen({ ...open, courier: nextCourier });
                      } catch (e) {
                        toast.error(parseAxiosError(e));
                      }
                    }}
                  >
                    Assign
                  </button>
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



