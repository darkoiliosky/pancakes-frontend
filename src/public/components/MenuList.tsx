import React, { useState, useMemo, useEffect } from "react";
import { PublicMenuItem } from "../api/useMenu";
import { useCart } from "../context/CartContext";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useShop } from "../api/useShop";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import formatCurrency from "../../utils/formatCurrency";
import { useModifiers, type PublicModifierGroup } from "../api/useModifiers";
import Modal from "../../components/Modal";

type Filters = { q?: string; category?: string; available?: boolean };

export default function MenuList({
  items,
  isLoading,
  filters,
}: {
  items: PublicMenuItem[];
  isLoading?: boolean;
  filters?: Filters;
}) {
  const { add } = useCart();
  const [qty, setQty] = useState<Record<number, number>>({});
  const [customizeFor, setCustomizeFor] = useState<PublicMenuItem | null>(null);
  const { data: shop } = useShop();
  const currency = shop?.currency || "";
  const { user } = useAuth();
  const role = (user?.role || "").toLowerCase();
  const isCustomer = role === "customer";
  const isAdmin = role === "admin";

  // Detect shop closed (same logic as Checkout)
  function isShopClosed(): boolean {
    const s: any = shop || {};
    if (s.is_open === false) return true;
    try {
      const cu = s.closed_until ? new Date(s.closed_until) : null;
      if (cu && cu.getTime() > Date.now()) return true;
    } catch {}
    const wh = s.working_hours_json;
    if (!wh || typeof wh !== "object") return false;
    const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const now = new Date();
    const d = days[now.getDay()];
    const raw = wh[d] ?? wh[String(now.getDay())];
    const parseRanges = (val: any): Array<[number, number]> => {
      const out: Array<[number, number]> = [];
      const add = (s: string) => {
        String(s)
          .split(",")
          .forEach((chunk) => {
            const [a, b] = String(chunk).trim().split("-");
            if (!a || !b) return;
            const [ah, am] = a.split(":").map(Number);
            const [bh, bm] = b.split(":").map(Number);
            const start =
              (Number.isFinite(ah) ? ah : 0) * 60 +
              (Number.isFinite(am) ? am : 0);
            const end =
              (Number.isFinite(bh) ? bh : 0) * 60 +
              (Number.isFinite(bm) ? bm : 0);
            if (end > start) out.push([start, end]);
          });
      };
      if (typeof val === "string") add(val);
      else if (Array.isArray(val))
        val.forEach((x) => typeof x === "string" && add(x));
      return out;
    };
    const ranges = parseRanges(raw);
    if (ranges.length === 0) return false;
    const mins = now.getHours() * 60 + now.getMinutes();
    const open = ranges.some(([s, e]) => mins >= s && mins < e);
    return !open;
  }
  const shopClosed = isShopClosed();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-amber-50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const setQ = (id: number, n: number) =>
    setQty((cur) => ({
      ...cur,
      [id]: Math.max(1, Math.min(99, Math.floor(n || 1))),
    }));

  const q = (filters?.q || "").toLowerCase();
  const cat = (filters?.category || "").toLowerCase();
  const avail = filters?.available;

  const data = items.filter((it) => {
    if (cat && (it.category || "").toLowerCase() !== cat) return false;
    if (avail === true && it.available === false) return false;
    if (q) {
      const hay = `${it.name} ${it.description || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // Group by category for visual separators
  const groups = data.reduce<Record<string, typeof data>>((acc, it) => {
    const key = (it.category || "Other").trim() || "Other";
    (acc[key] ||= []).push(it);
    return acc;
  }, {});
  const orderedGroups = Object.entries(groups).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6 text-gray-600">
        No menu items available.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {orderedGroups.map(([group, items]) => (
        <section
          key={group}
          id={`cat-${group.replace(/\s+/g, "-").toLowerCase()}`}
        >
          <div className="sticky top-20 z-10">
            <div className="flex items-center gap-3 mb-3 bg-white/90 backdrop-blur rounded-xl px-3 py-2 shadow-sm border border-amber-100">
              <h2 className="text-lg md:text-xl font-semibold text-amber-800 tracking-tight">
                {group}
              </h2>
              <span className="text-xs text-amber-700">В· {items.length}</span>
              <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent ml-2" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-7">
            {items.map((item) => (
              <div key={item.id} className="group">
                <Card className="overflow-hidden rounded-2xl border border-amber-100 bg-white/90 backdrop-blur-sm shadow-sm transition hover:shadow-lg hover:-translate-y-1 animate-fade-in-up card-hover">
                  <div className="h-1.5 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200" />
                  {item.image_url ? (
                    <div className="w-full h-40 overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                  ) : null}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-lg font-semibold text-amber-900">
                          {item.name}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1 max-w-prose">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 text-amber-700 font-semibold whitespace-nowrap">
                        {formatCurrency(item.price, currency)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {item.available === false && (
                      <div className="text-xs inline-block mb-3 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border">
                        Unavailable
                      </div>
                    )}
                    <div className="mb-3">
                      <button
                        className="text-sm text-amber-700 underline"
                        onClick={() => setCustomizeFor(item)}
                        aria-label={`Customize ${item.name}`}
                      >
                        Customize
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={Math.max(
                          1,
                          Math.min(
                            99,
                            typeof (item as any).stock === "number" &&
                              (item as any).stock !== null
                              ? ((item as any).stock as number)
                              : 99
                          )
                        )}
                        value={qty[item.id] ?? 1}
                        onChange={(e) => setQ(item.id, Number(e.target.value))}
                        className="w-20 border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-300"
                      />
                      {isCustomer ? (
                        shopClosed ? (
                          <div className="flex-1 text-center text-xs text-gray-600 bg-gray-50 border rounded px-3 py-2">
                            рџ•’ The shop is currently closed. WeвЂ™ll open
                            again soon!
                          </div>
                        ) : (
                          <Button
                            onClick={() => setCustomizeFor(item)}
                            disabled={
                              item.available === false ||
                              ((item as any).stock !== null &&
                                typeof (item as any).stock === "number" &&
                                (item as any).stock <= 0)
                            }
                            className="shadow-sm hover:shadow ring-1 ring-amber-300/30"
                            aria-live="polite"
                          >
                            {item.available === false
                              ? "Unavailable"
                              : (item as any).stock !== null &&
                                  typeof (item as any).stock === "number" &&
                                  (item as any).stock <= 0
                                ? "Out of stock"
                                : "Add to Cart"}
                          </Button>
                        )
                      ) : isAdmin ? (
                        <Link
                          to={`/admin/menu-items?edit=${item.id}`}
                          className="inline-flex"
                        >
                          <Button className="shadow-sm hover:shadow ring-1 ring-amber-300/30">
                            Edit menu
                          </Button>
                        </Link>
                      ) : (
                        <Button disabled className="opacity-70">
                          Customers only
                        </Button>
                      )}
                      {typeof (item as any).stock === "number" &&
                        (item as any).stock !== null && (
                          <span className="text-xs text-gray-600">
                            {(item as any).stock} left
                          </span>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </section>
      ))}
      <ItemCustomizeModal
        open={!!customizeFor}
        item={customizeFor}
        currency={currency}
        initialQty={customizeFor ? (qty[customizeFor.id] ?? 1) : 1}
        onClose={() => setCustomizeFor(null)}
        onConfirm={({ item, quantity, selected, note, details }) => {
          if (!item) return;
          const mods = Array.from(selected.values()).flatMap((s) => Array.from(s));
          add({
            item_id: item.id,
            name: item.name,
            price: item.price,
            quantity,
            modifiers: mods,
            mods_detail: details,
            note: note && note.trim() ? note.trim() : undefined,
          });
          setCustomizeFor(null);
        }}
      />
      
    </div>
  );
}

type ConfirmPayload = {
  item: PublicMenuItem | null;
  quantity: number;
  selected: Map<number, Set<number>>; // groupId -> optionIds
  note?: string;
  details: { group: string; options: { id: number; name: string; price: number }[] }[];
};

function ItemCustomizeModal({
  open,
  item,
  currency,
  initialQty = 1,
  onClose,
  onConfirm,
}: {
  open: boolean;
  item: PublicMenuItem | null;
  currency?: string;
  initialQty?: number;
  onClose: () => void;
  onConfirm: (p: ConfirmPayload) => void;
}) {
  const itemId = item?.id || 0;
  const { data, isLoading, isError } = useModifiers(itemId || 0);
  const groups: PublicModifierGroup[] = Array.isArray(data) ? (data as PublicModifierGroup[]) : [];
  const [selected, setSelected] = useState<Map<number, Set<number>>>(new Map());
  const [qty, setQty] = useState<number>(Math.max(1, Math.min(99, Math.floor(initialQty || 1))));
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    setSelected(new Map());
    setQty(Math.max(1, Math.min(99, Math.floor(initialQty || 1))));
    setNote("");
  }, [open, itemId, initialQty]);

  const extrasSum = useMemo(() => {
    let s = 0;
    for (const g of groups) {
      const sel = selected.get(g.id);
      if (!sel) continue;
      for (const oid of sel) {
        const opt = g.options.find((o) => o.id === oid);
        if (opt) s += Number(opt.price || 0);
      }
    }
    return s;
  }, [selected, groups]);

  const total = useMemo(() => {
    const base = Number(item?.price || 0);
    return (base + extrasSum) * qty;
  }, [item?.price, extrasSum, qty]);

  const confirmText = `Add to order ${formatCurrency(total, currency)}`;

  // Validation: enforce min/max per group
  const allGroupsValid = useMemo(() => {
    for (const g of groups) {
      const sel = selected.get(g.id)?.size || 0;
      const min = Math.max(0, g.min || 0);
      const max = Math.max(0, g.max || 0);
      if (min > 0 && sel < min) return false;
      if (max > 0 && sel > max) return false;
    }
    return true;
  }, [groups, selected]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      onConfirm={() => {
        const details = groups.map((g) => ({
          group: g.title,
          options: g.options.filter((o) => selected.get(g.id)?.has(o.id)),
        })).filter((g) => g.options.length > 0);
        onConfirm({ item, quantity: qty, selected, note, details });
      }}
      title={item ? item.name : "Add to order"}
      confirmText={confirmText}
      confirmDisabled={!allGroupsValid}
      cancelText="Cancel"
    >
      {!item ? null : (
        <div className="space-y-4">
          <div className="flex gap-4">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-24 h-24 rounded-lg object-cover border"
              />
            ) : null}
            <div className="min-w-0">
              <div className="text-lg font-semibold text-amber-800">{item.name}</div>
              <div className="text-sm text-gray-700">{formatCurrency(item.price, currency)}</div>
              {item.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-3">{item.description}</p>
              )}
            </div>
          </div>

          {isError && (
            <div className="text-sm text-gray-600">Extras unavailable right now</div>
          )}

          {!isError && !isLoading && groups.length > 0 && (
            <div className="space-y-4">
              {groups.map((g) => {
                const sel = selected.get(g.id) || new Set<number>();
                const min = Math.max(0, g.min || 0);
                const max = Math.max(0, g.max || 0);
                const isSingle = max === 1;
                const canSelectMore = max === 0 || sel.size < max;
                const showNoThanks = min === 0;
                return (
                  <div key={g.id} className="rounded-lg border p-3 bg-white">
                    <div className="font-medium text-amber-800">{g.title}</div>
                    {g.hint && <div className="text-xs text-gray-600 mb-2">{g.hint}</div>}
                    <div className="space-y-2">
                      {showNoThanks && (
                        <label className="flex items-center justify-between px-3 py-2 rounded-lg border hover:bg-amber-50 cursor-pointer select-none">
                          <input
                            type={isSingle ? "radio" : "checkbox"}
                            name={`group-${g.id}`}
                            className="sr-only"
                            checked={sel.size === 0}
                            onChange={() => {
                              const next = new Map(selected);
                              next.set(g.id, new Set());
                              setSelected(next);
                            }}
                          />
                          <span className="flex items-center gap-3">
                            <span className={`w-5 h-5 inline-flex items-center justify-center rounded ${sel.size === 0 ? "bg-amber-500 text-white" : "border border-amber-300"}`}>
                              {sel.size === 0 && (
                                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M7.629 13.314L4.314 10l-1.257 1.257 4.572 4.571 9.314-9.314L15.686 5l-8.057 8.314z" fill="currentColor" />
                                </svg>
                              )}
                            </span>
                            <span>No thanks</span>
                          </span>
                          <span className="text-sm text-gray-500" />
                        </label>
                      )}
                      {g.options.map((o) => {
                        const checked = sel.has(o.id);
                        const disabled = !checked && !canSelectMore;
                        const inputType = isSingle ? "radio" : "checkbox";
                        const optId = `opt-${g.id}-${o.id}`;
                        return (
                          <label key={o.id} htmlFor={optId} className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer select-none transition ${checked ? "bg-amber-50 border-amber-300" : "bg-white hover:bg-amber-50"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
                            <input
                              id={optId}
                              type={inputType}
                              name={`group-${g.id}`}
                              className="sr-only"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => {
                                const next = new Map(selected);
                                const current = new Set(next.get(g.id) || []);
                                if (isSingle) {
                                  current.clear();
                                  current.add(o.id);
                                } else {
                                  if (current.has(o.id)) current.delete(o.id);
                                  else current.add(o.id);
                                }
                                next.set(g.id, current);
                                setSelected(next);
                              }}
                            />
                            <span className="flex items-center gap-3">
                              <span className={`w-5 h-5 inline-flex items-center justify-center rounded ${checked ? "bg-amber-500 text-white" : "border border-amber-300"}`}>
                                {checked && (
                                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7.629 13.314L4.314 10l-1.257 1.257 4.572 4.571 9.314-9.314L15.686 5l-8.057 8.314z" fill="currentColor" />
                                  </svg>
                                )}
                              </span>
                              <span className="text-sm">{o.name}</span>
                            </span>
                            <span className="tabular-nums text-gray-700">{formatCurrency(Number(o.price || 0), currency)}</span>
                          </label>
                        );
                      })}
                    </div>
                    {max > 0 && sel.size >= max && (
                      <div className="mt-1 text-[11px] text-gray-600">Max {max} selected</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div>
            <label htmlFor="item-note" className="block text-sm font-medium text-gray-700 mb-1">
              Add a note (optional)
            </label>
            <textarea
              id="item-note"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300"
              rows={2}
              placeholder="e.g. no white sauce"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2" aria-label="Quantity selector">
              <button
                type="button"
                className="px-3 py-1 border rounded"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={99}
                className="w-20 border rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-amber-300"
                value={qty}
                onChange={(e) => setQty(Math.max(1, Math.min(99, Math.floor(Number(e.target.value) || 1))))}
                aria-label="Quantity"
              />
              <button
                type="button"
                className="px-3 py-1 border rounded"
                onClick={() => setQty((q) => Math.min(99, q + 1))}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <div className="text-sm text-gray-700">
              Total: <span className="font-semibold">{formatCurrency(total, currency)}</span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

// legacy ExtrasModal removed

// legacy Extras component removed

