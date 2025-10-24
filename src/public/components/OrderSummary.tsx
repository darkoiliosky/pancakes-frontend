import { useCart } from "../context/CartContext";
import { useShop } from "../api/useShop";

export default function OrderSummary() {
  const { items, subtotal } = useCart();
  const { data: shop } = useShop();
  const currency = shop?.currency || "$";
  return (
    <div className="rounded-xl border bg-white p-4 text-sm">
      <div className="font-semibold mb-2">Order Summary</div>
      <ul className="divide-y">
        {items.map((it) => (
          <li key={it.item_id} className="py-1 flex items-center justify-between">
            <span>
              {it.name} × {it.quantity}
            </span>
            <span>{currency}{(it.price * it.quantity).toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between mt-2 font-semibold">
        <span>Subtotal</span>
        <span>{currency}{subtotal.toFixed(2)}</span>
      </div>
    </div>
  );
}
