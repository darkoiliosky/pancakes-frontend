import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import OrderSummary from "../components/OrderSummary";
import { useShop } from "../api/useShop";
import { usePlaceOrder } from "../api/usePlaceOrder";
import { useToast } from "../../context/ToastContext";
import usePageTitle from "../../hooks/usePageTitle";
import formatCurrency from "../../utils/formatCurrency";

export default function Checkout() {
  const navigate = useNavigate();
  const toast = useToast();
  const { items, subtotal, clear } = useCart();
  const { data: shop } = useShop();
  const placeOrder = usePlaceOrder();
  usePageTitle(`${shop?.name || "Pancakes Shop"} — Checkout`);

  const currency = shop?.currency || "";
  const minOrder = Number(shop?.min_order || 0);
  const deliveryFee = Number(shop?.delivery_fee || 0);
  const total = subtotal + deliveryFee;
  const canPlace = items.length > 0 && subtotal >= minOrder && !placeOrder.isPending;

  const onPlace = async () => {
    try {
      const payload = {
        items: items.map((it) => ({ item_id: it.item_id, quantity: it.quantity })),
      };
      await placeOrder.mutateAsync(payload);
      clear();
      toast.success("Order placed successfully");
      navigate("/orders");
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || "Failed to place order";
      toast.error(msg);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-amber-700">Checkout</h1>
        <Link to="/cart" className="underline text-amber-700">Back to Cart</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2">
          <OrderSummary />
        </div>
        <div className="md:col-span-1">
          <div className="rounded-xl border bg-white p-4 text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Delivery Fee</span>
              <span>{formatCurrency(deliveryFee, currency)}</span>
            </div>
            <div className="flex items-center justify-between font-semibold border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(total, currency)}</span>
            </div>
            {minOrder > 0 && subtotal < minOrder && (
              <div className="text-xs text-red-600">Minimum order is {currency}{minOrder.toFixed(2)}</div>
            )}
            <button
              className="w-full px-4 py-2 rounded bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
              onClick={onPlace}
              disabled={!canPlace}
            >
              {placeOrder.isPending ? "Placing..." : "Place Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
