import { useMemo, useState } from "react";
import { useMyOrders } from "../api/useMyOrders";
import { useShop } from "../api/useShop";
import usePageTitle from "../../hooks/usePageTitle";

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function MyOrders() {
  const { data = [], isLoading, isError, refetch } = useMyOrders();
  const { data: shop } = useShop();
  usePageTitle(`${shop?.name || "Pancakes Shop"} — My Orders`);
  const currency = shop?.currency || "$";
  const [openId, setOpenId] = useState<number | null>(null);
  const openOrder = useMemo(() => data.find((o) => o.id === openId), [data, openId]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-amber-700">My Orders</h1>
        <button className="px-3 py-1 rounded bg-amber-500 text-white hover:bg-amber-600" onClick={() => refetch()}>Refresh</button>
      </div>
      <div className="rounded-xl border bg-white p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-gray-600">Loading...</div>
        ) : isError ? (
          <div className="p-6 text-red-600">Failed to load your orders</div>
        ) : data.length === 0 ? (
          <div className="p-6 text-gray-600">No orders yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#f8f8f8]">
              <tr>
                <th className="text-left px-4 py-2">#</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Created</th>
                <th className="text-right px-4 py-2">Total</th>
                <th className="text-right px-4 py-2">Items</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((o) => (
                <tr key={o.id} className="even:bg-amber-50/20">
                  <td className="px-4 py-2">#{o.id}</td>
                  <td className="px-4 py-2 capitalize">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">{o.status}</span>
                  </td>
                  <td className="px-4 py-2">{formatDate(o.created_at)}</td>
                  <td className="px-4 py-2 text-right font-semibold">{currency}{(o.total_price || 0).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{o.items_count}</td>
                  <td className="px-4 py-2 text-right">
                    <button className="underline text-amber-700" onClick={() => setOpenId(o.id)}>Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Details modal */}
      {openOrder && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4" onClick={() => setOpenId(null)}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Order #{openOrder.id}</h2>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setOpenId(null)}>×</button>
            </div>
            <div className="text-sm text-gray-600 mb-2">Status: <span className="capitalize">{openOrder.status}</span></div>
            <div className="text-sm text-gray-600 mb-4">Created: {formatDate(openOrder.created_at)}</div>
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#f8f8f8]">
                  <tr>
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-right px-3 py-2">Qty</th>
                    <th className="text-right px-3 py-2">Price</th>
                    <th className="text-right px-3 py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(openOrder.items || []).map((it, idx) => (
                    <tr key={idx} className="even:bg-amber-50/20">
                      <td className="px-3 py-2">{it.name}</td>
                      <td className="px-3 py-2 text-right">{it.quantity}</td>
                      <td className="px-3 py-2 text-right">{currency}{(it.price || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">{currency}{(it.subtotal || (it.price || 0) * (it.quantity || 0)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-right mt-3 font-semibold">Total: {currency}{(openOrder.total_price || 0).toFixed(2)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
