import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "../../context/ToastContext";

type ModDetailFlat = { id: number; name: string; price_delta: number };
type ModDetailGroup = { group: string; options: { id: number; name: string; price: number }[] };

export type CartItem = {
  item_id: number;
  name: string;
  price: number; // base price
  quantity: number;
  modifiers?: number[]; // IDs for checkout
  mods_detail?: ModDetailFlat[] | ModDetailGroup[]; // display + totals (flat or grouped)
  note?: string; // customer note/comment
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

export const CartContext = createContext<CartContextValue | undefined>(undefined);

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const [state, setState] = useState<CartState>({ items: [] });
  const hydratedRef = useRef(false);

  // Type guards and normalizers
  function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }

  function isCartItem(it: unknown): it is CartItem {
    if (!isObject(it)) return false;
    return (
      typeof it.item_id === "number" &&
      typeof it.price === "number" &&
      typeof it.quantity === "number" &&
      (typeof it.name === "string" || typeof it.name === "undefined") &&
      (typeof (it as any).note === "string" || typeof (it as any).note === "undefined")
    );
  }

  function normalizeModifiers(input: unknown): number[] | undefined {
    if (!Array.isArray(input)) return undefined;
    const nums = (input as unknown[]).filter((x): x is number => typeof x === "number");
    return nums.length ? nums : undefined;
  }

  function isModLike(m: unknown): m is { id: number | string; name: string; price_delta?: number | string } {
    if (!isObject(m)) return false;
    return (typeof m.id === "number" || typeof m.id === "string") && typeof m.name === "string";
  }

  function normalizeModsDetail(input: unknown): ModDetailFlat[] | ModDetailGroup[] | undefined {
    if (!Array.isArray(input)) return undefined;
    // Try grouped shape first
    const maybeGroups = (input as unknown[]).every((g: any) => isObject(g) && typeof (g as any).group === "string" && Array.isArray((g as any).options));
    if (maybeGroups) {
      const out: ModDetailGroup[] = (input as any[]).map((g: any) => ({
        group: String(g.group || ""),
        options: Array.isArray(g.options)
          ? g.options.filter((o: any) => isObject(o) && (typeof (o as any).id === "number" || typeof (o as any).id === "string")).map((o: any) => ({ id: Number(o.id), name: String(o.name || ""), price: Number(o.price || 0) }))
          : [],
      }));
      return out;
    }
    // Fallback to flat
    const list: ModDetailFlat[] = (input as unknown[])
      .filter(isModLike)
      .map((m) => ({ id: Number(m.id), name: m.name, price_delta: Number(m.price_delta || 0) }));
    return list.length ? list : undefined;
  }

  // Hydrate from localStorage once
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { items?: unknown };
      const itemsRaw: unknown[] = Array.isArray(parsed.items) ? (parsed.items as unknown[]) : [];
      const items: CartItem[] = itemsRaw
        .filter(isCartItem)
        .map((it) => ({
          item_id: it.item_id,
          name: typeof it.name === "string" ? it.name : "",
          price: it.price,
          quantity: it.quantity,
          modifiers: normalizeModifiers(it.modifiers),
          mods_detail: normalizeModsDetail(it.mods_detail),
          note: typeof (it as any).note === "string" ? (it as any).note : undefined,
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
        const keyOf = (it: CartItem) => `${it.item_id}|${(it.modifiers || []).slice().sort((a,b)=>a-b).join(",")}|${(it.note || "").trim()}`;
        const incomingKey = keyOf(payload as CartItem);
        const idx = cur.items.findIndex((it) => keyOf(it) === incomingKey);
        if (idx >= 0) {
          const next = [...cur.items];
          next[idx] = { ...next[idx], quantity: clamp(next[idx].quantity + qty, 1, 99) };
          toast.success(`Added ${qty} x ${payload.name}`);
          return { items: next };
        }
        toast.success(`Added ${qty} x ${payload.name}`);
        return {
          items: [
            ...cur.items,
            {
              item_id: payload.item_id,
              name: payload.name,
              price: payload.price,
              quantity: qty,
              modifiers: payload.modifiers,
              mods_detail: payload.mods_detail,
              note: payload.note,
            },
          ],
        };
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

  const subtotal = useMemo(() =>
    state.items.reduce((s, it) => {
      let extra = 0;
      const md = it.mods_detail as any;
      if (Array.isArray(md) && md.length > 0) {
        if (typeof md[0]?.group === "string") {
          // grouped
          for (const g of md as ModDetailGroup[]) {
            for (const o of g.options) extra += Number(o.price || 0);
          }
        } else {
          // flat
          for (const m of md as ModDetailFlat[]) extra += Number(m.price_delta || 0);
        }
      }
      return s + (it.price + extra) * it.quantity;
    }, 0)
  , [state.items]);

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
