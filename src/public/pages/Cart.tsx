import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useShop } from "../api/useShop";
import usePageTitle from "../../hooks/usePageTitle";
import formatCurrency from "../../utils/formatCurrency";

export default function Cart() {
  const navigate = useNavigate();
  const { items, subtotal, setQty, remove } = useCart();
  const { data: shop } = useShop();
  usePageTitle(`${shop?.name || "Pancakes Shop"} — Cart`);
  const currency = shop?.currency || "";
  const minOrder = Number(shop?.min_order || 0);
  const canCheckout = items.length > 0 && subtotal >= minOrder;
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-amber-700">Cart</h1>
        <Link to="/menu" className="underline text-amber-700">Back to Menu</Link>
      </div>
      <div className="rounded-xl border bg-white p-6 text-gray-700">
        {items.length === 0 ? (
          <div>
            <p>Your cart is empty.</p>
            <Link to="/menu" className="underline text-amber-700">Browse menu</Link>
          </div>
        ) : (
          <div>
            <ul className="divide-y">
              {items.map((it) => (
                <li key={it.item_id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate max-w-[260px]">{it.name}</div>
                    <div className="text-sm text-gray-600">{formatCurrency(it.price, currency)} each</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 border rounded" onClick={() => setQty(it.item_id, it.quantity - 1)}>-</button>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      className="w-16 border rounded px-2 py-1 text-center"
                      value={it.quantity}
                      onChange={(e) => setQty(it.item_id, Number(e.target.value))}
                    />
                    <button className="px-2 py-1 border rounded" onClick={() => setQty(it.item_id, it.quantity + 1)}>+</button>
                    <button
                      className="px-2 py-1 text-red-700 border border-red-300 rounded"
                      onClick={() => {
                        if (items.length === 1) {
                          const ok = window.confirm("Remove the last item from the cart?");
                          if (!ok) return;
                        }
                        remove(it.item_id);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="font-semibold w-24 text-right">{formatCurrency(it.price * it.quantity, currency)}</div>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between mt-4">
              <div className="text-gray-600">Subtotal</div>
              <div className="text-lg font-semibold">{formatCurrency(subtotal, currency)}</div>
            </div>
            {minOrder > 0 && subtotal < minOrder && (
              <div className="text-xs text-red-600 mt-2">Minimum order is {formatCurrency(minOrder, currency)}</div>
            )}
            <div className="text-right mt-4">
              <button
                onClick={() => navigate("/checkout")}
                disabled={!canCheckout}
                className="px-4 py-2 rounded bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
              >
                Checkout
              </button>
            </div>
            <div className="mt-3 text-right">
              <button
                className="text-amber-700 underline"
                onClick={() => navigate("/menu")}
              >
                Continue shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
