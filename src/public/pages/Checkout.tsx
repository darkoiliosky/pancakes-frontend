import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import OrderSummary from "../components/OrderSummary";
import { useShop } from "../api/useShop";
import { useUser } from "../../api/useUser";
import { usePlaceOrder } from "../api/usePlaceOrder";
import { useToast } from "../../context/ToastContext";
import usePageTitle from "../../hooks/usePageTitle";
import formatCurrency from "../../utils/formatCurrency";

export default function Checkout() {
  const navigate = useNavigate();
  const toast = useToast();
  const { items, subtotal, clear } = useCart();
  const { data: shop } = useShop();
  const { data: me } = useUser();
  const placeOrder = usePlaceOrder();
  usePageTitle(`${shop?.name || "Pancakes Shop"} – Checkout`);

  const currency = shop?.currency || "";
  const minOrder = Number(shop?.min_order || 0);
  // Form state
  const [orderType, setOrderType] = useState<"delivery"|"pickup">((localStorage.getItem("checkout_order_type") || "delivery").toLowerCase() === "pickup" ? "pickup" : "delivery");
  const [address, setAddress] = useState<string>(localStorage.getItem("checkout_address") || "");
  const [phone, setPhone] = useState<string>((me?.phone || localStorage.getItem("checkout_phone") || "") as string);
  const [notes, setNotes] = useState<string>(localStorage.getItem("checkout_notes") || "");

  useEffect(() => { localStorage.setItem("checkout_order_type", orderType); }, [orderType]);
  useEffect(() => { localStorage.setItem("checkout_address", address); }, [address]);
  useEffect(() => { localStorage.setItem("checkout_phone", phone); }, [phone]);
  useEffect(() => { localStorage.setItem("checkout_notes", notes); }, [notes]);
  useEffect(() => {
    if ((phone || "").trim().length === 0 && (me?.phone || "").trim().length > 0) {
      setPhone(me!.phone as string);
    }
  }, [me?.phone]);

  const deliveryFee = orderType === "delivery" ? Number(shop?.delivery_fee || 0) : 0;
  const total = subtotal + deliveryFee;
  const phoneValid = (phone || "").trim().length >= 6; // basic client-side check
  const addressValid = orderType === "pickup" || (address || "").trim().length > 0;
  const canPlace = items.length > 0 && subtotal >= minOrder && phoneValid && addressValid && !placeOrder.isPending;

  const onPlace = async () => {
    try {
      const payload: any = {
        items: items.map((it) => ({ item_id: it.item_id, quantity: it.quantity })),
        order_type: orderType,
        phone: phone.trim(),
      };
      if (orderType === "delivery") {
        payload.delivery_address = address.trim();
      }
      if (notes && notes.trim().length > 0) payload.notes = notes.trim();
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
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-xl border bg-white p-4">
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="order_type"
                  value="delivery"
                  checked={orderType === "delivery"}
                  onChange={() => setOrderType("delivery")}
                />
                <span>Delivery</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="order_type"
                  value="pickup"
                  checked={orderType === "pickup"}
                  onChange={() => setOrderType("pickup")}
                />
                <span>Pickup</span>
              </label>
            </div>
            {orderType === "delivery" && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Delivery address</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder="Street, building, apartment..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                className="w-full border rounded px-3 py-2"
                placeholder="Your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Used for contact about your order.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea
                className="w-full border rounded px-3 py-2"
                rows={2}
                placeholder="Any special instructions"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
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
            {!phoneValid && (
              <div className="text-xs text-red-600">Please enter a valid phone number</div>
            )}
            {!addressValid && (
              <div className="text-xs text-red-600">Delivery address is required</div>
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
