import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "../../context/ToastContext";

export type CartItem = {
  item_id: number;
  name: string;
  price: number; // base price
  quantity: number;
  modifiers?: number[]; // IDs for checkout
  mods_detail?: { id: number; name: string; price_delta: number }[]; // display + totals
};

type CartState = {
  items: CartItem[];
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  remove: (item_id: number) => void;
  setQty: (item_id: number, quantity: number) => void;
  clear: () => void;
};

const STORAGE_KEY = "cart:v1";

const CartContext = createContext<CartContextValue | undefined>(undefined);

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const [state, setState] = useState<CartState>({ items: [] });
  const hydratedRef = useRef(false);

  // Type guard for CartItem shape
  function isCartItem(it: any): it is CartItem {
    return (
      it &&
      typeof it.item_id === "number" &&
      typeof it.price === "number" &&
      typeof it.quantity === "number" &&
      (typeof it.name === "string" || typeof it.name === "undefined")
    );
  }

  // Hydrate from localStorage once
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<CartState> | any;
      const itemsRaw: unknown[] = Array.isArray((parsed as any)?.items) ? (parsed as any).items : [];
      const items: CartItem[] = (itemsRaw as any[])
        .filter((it: any): it is CartItem => isCartItem(it))
        .map((it: any) => ({
          item_id: it.item_id,
          name: typeof it.name === "string" ? it.name : "",
          price: it.price,
          quantity: it.quantity,
          modifiers: Array.isArray(it.modifiers) ? (it.modifiers as number[]).filter((x) => typeof x === "number") : undefined,
          mods_detail: Array.isArray(it.mods_detail)
            ? (it.mods_detail as any[])
                .filter((m) => m && typeof m.id === "number" && typeof m.name === "string")
                .map((m) => ({ id: Number(m.id), name: String(m.name), price_delta: Number(m.price_delta || 0) }))
            : undefined,
        }));
      setState({ items });
    } catch {}
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const add = useCallback(
    (payload: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      const qty = clamp(Number(payload.quantity ?? 1) || 1, 1, 99);
      setState((cur) => {
        const keyOf = (it: CartItem) => `${it.item_id}|${(it.modifiers || []).slice().sort((a,b)=>a-b).join(",")}`;
        const incomingKey = keyOf(payload as CartItem);
        const idx = cur.items.findIndex((it) => keyOf(it) === incomingKey);
          next[idx] = { ...next[idx], quantity: clamp(next[idx].quantity + qty, 1, 99) };
          toast.success(`Added ${qty} × ${payload.name}`);
          return { items: next };
        }
        toast.success(`Added ${qty} × ${payload.name}`);
        return { items: [...cur.items, { item_id: payload.item_id, name: payload.name, price: payload.price, quantity: qty, modifiers: (payload as any).modifiers, mods_detail: (payload as any).mods_detail }] };
      });
    },
    [toast]
  );

  const remove = useCallback(
    (item_id: number) => {
      setState((cur) => {
        const item = cur.items.find((it) => it.item_id === item_id);
        if (item) toast.info(`Removed ${item.name}`);
        return { items: cur.items.filter((it) => it.item_id !== item_id) };
      });
    },
    [toast]
  );

  const setQty = useCallback(
    (item_id: number, quantity: number) => {
      const q = clamp(Number(quantity) || 0, 0, 99);
      setState((cur) => {
        const idx = cur.items.findIndex((it) => it.item_id === item_id);
        if (idx < 0) return cur;
        if (q <= 0) {
          const removed = cur.items[idx];
          toast.info(`Removed ${removed.name}`);
          return { items: cur.items.filter((it) => it.item_id !== item_id) };
        }
        const next = [...cur.items];
        next[idx] = { ...next[idx], quantity: q };
        return { items: next };
      });
    },
    [toast]
  );

  const clear = useCallback(() => {
    setState({ items: [] });
  }, []);

  const subtotal = useMemo(() => state.items.reduce((s, it) => { const extra = (it.mods_detail || []).reduce((a, m) => a + (Number(m.price_delta) || 0), 0); return s + (it.price + extra) * it.quantity; }, 0), [state.items]);
  const count = useMemo(() => state.items.reduce((s, it) => s + it.quantity, 0), [state.items]);

  const value = useMemo<CartContextValue>(
    () => ({ items: state.items, count, subtotal, add, remove, setQty, clear }),
    [state.items, count, subtotal, add, remove, setQty, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}





