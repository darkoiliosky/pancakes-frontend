import React, { useState } from "react";
import { PublicMenuItem } from "../api/useMenu";
import { useCart } from "../context/CartContext";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useShop } from "../api/useShop";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import formatCurrency from "../../utils/formatCurrency";
import { useModifiers } from "../api/useModifiers";

type Filters = { q?: string; category?: string; available?: boolean };

export default function MenuList({ items, isLoading, filters }: { items: PublicMenuItem[]; isLoading?: boolean; filters?: Filters }) {
  const { add } = useCart();
  const [selected, setSelected] = useState<Record<number, Set<number>>>({});
  const [modsByItem, setModsByItem] = useState<Record<number, { id: number; name: string; price_delta: number }[]>>({});
  const [qty, setQty] = useState<Record<number, number>>({});
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
    if (!wh || typeof wh !== 'object') return false;
    const days = ["sun","mon","tue","wed","thu","fri","sat"];
    const now = new Date();
    const d = days[now.getDay()];
    const raw = wh[d] ?? wh[String(now.getDay())];
    const parseRanges = (val: any): Array<[number, number]> => {
      const out: Array<[number, number]> = [];
      const add = (s: string) => {
        String(s).split(',').forEach((chunk) => {
          const [a,b] = String(chunk).trim().split('-');
          if (!a || !b) return;
          const [ah,am] = a.split(':').map(Number);
          const [bh,bm] = b.split(':').map(Number);
          const start = (Number.isFinite(ah)?ah:0)*60 + (Number.isFinite(am)?am:0);
          const end = (Number.isFinite(bh)?bh:0)*60 + (Number.isFinite(bm)?bm:0);
          if (end>start) out.push([start,end]);
        });
      };
      if (typeof val === 'string') add(val);
      else if (Array.isArray(val)) val.forEach((x) => typeof x === 'string' && add(x));
      return out;
    };
    const ranges = parseRanges(raw);
    if (ranges.length === 0) return false;
    const mins = now.getHours()*60 + now.getMinutes();
    const open = ranges.some(([s,e]) => mins>=s && mins<e);
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

  const setQ = (id: number, n: number) => setQty((cur) => ({ ...cur, [id]: Math.max(1, Math.min(99, Math.floor(n || 1))) }));

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
  const orderedGroups = Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));

  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6 text-gray-600">No menu items available.</div>
    );
  }

  return (
    <div className="space-y-8">
      {orderedGroups.map(([group, items]) => (
        <section key={group} id={`cat-${group.replace(/\s+/g, "-").toLowerCase()}`}>
          <div className="sticky top-20 z-10">
            <div className="flex items-center gap-3 mb-3 bg-white/90 backdrop-blur rounded-xl px-3 py-2 shadow-sm border border-amber-100">
              <h2 className="text-lg md:text-xl font-semibold text-amber-800 tracking-tight">{group}</h2>
              <span className="text-xs text-amber-700">· {items.length}</span>
              <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent ml-2" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-7">
            {items.map((item) => (
              <div key={item.id} className="group">
                <Card className="overflow-hidden rounded-2xl border border-amber-100 bg-white/90 backdrop-blur-sm shadow-sm transition transform duration-200 group-hover:shadow-md group-hover:-translate-y-0.5">
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
                        <div className="text-lg font-semibold text-amber-900">{item.name}</div>
                        {item.description && <p className="text-sm text-gray-600 mt-1 max-w-prose">{item.description}</p>}
                      </div>
                      <div className="ml-4 text-amber-700 font-semibold whitespace-nowrap">
                        {formatCurrency(item.price, currency)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {item.available === false && (
                      <div className="text-xs inline-block mb-3 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border">Unavailable</div>
                    )}
                    <Extras
                      menuItemId={item.id}
                      selected={selected[item.id]}
                      onLoaded={(mods) => setModsByItem((m) => ({ ...m, [item.id]: mods }))}
                      onToggle={(id) => {
                        setSelected((cur) => {
                          const s = new Set(cur[item.id] || []);
                          if (s.has(id)) s.delete(id); else s.add(id);
                          return { ...cur, [item.id]: s };
                        });
                      }}
                    />
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={Math.max(1, Math.min(99, typeof (item as any).stock === 'number' && (item as any).stock !== null ? (item as any).stock as number : 99))}
                        value={qty[item.id] ?? 1}
                        onChange={(e) => setQ(item.id, Number(e.target.value))}
                        className="w-20 border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-300"
                      />
                      {isCustomer ? (
                        shopClosed ? (
                          <div className="flex-1 text-center text-xs text-gray-600 bg-gray-50 border rounded px-3 py-2">
                            🕒 The shop is currently closed. We’ll open again soon!
                          </div>
                        ) : (
                          <Button
                            onClick={() => {
                              const sel = selected[item.id] || new Set<number>();
                              const mods = Array.from(sel);
                              const det = (modsByItem[item.id] || []).filter((m) => sel.has(m.id));
                              add({ item_id: item.id, name: item.name, price: item.price, quantity: qty[item.id] ?? 1, modifiers: mods, mods_detail: det });
                            }}
                            disabled={item.available === false || ((item as any).stock !== null && typeof (item as any).stock === 'number' && (item as any).stock <= 0)}
                            className="shadow-sm hover:shadow ring-1 ring-amber-300/30"
                            aria-live="polite"
                          >
                            {item.available === false ? "Unavailable" : (((item as any).stock !== null && typeof (item as any).stock === 'number' && (item as any).stock <= 0) ? "Out of stock" : "Add to Cart")}
                          </Button>
                        )
                      ) : isAdmin ? (
                        <Link to={`/admin/menu-items?edit=${item.id}`} className="inline-flex">
                          <Button className="shadow-sm hover:shadow ring-1 ring-amber-300/30">Edit menu</Button>
                        </Link>
                      ) : (
                        <Button disabled className="opacity-70">Customers only</Button>
                      )}
                      {(typeof (item as any).stock === 'number' && (item as any).stock !== null) && (
                        <span className="text-xs text-gray-600">{(item as any).stock} left</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}



function Extras({ menuItemId, selected, onToggle, onLoaded }: { menuItemId: number; selected?: Set<number>; onToggle: (id: number) => void; onLoaded: (mods: { id: number; name: string; price_delta: number }[]) => void; }) {
  const { data = [], isLoading } = useModifiers(menuItemId);
  React.useEffect(() => { onLoaded(data); }, [data, onLoaded]);
  if (isLoading || !data.length) return null;
  return (
    <div className="mb-3">
      <div className="text-xs font-medium text-amber-800 mb-1">Extras</div>
      <div className="flex flex-wrap gap-2">
        {data.map((m) => (
          <label key={m.id} className="text-xs border rounded-full px-2 py-1 cursor-pointer transition">
            <input type="checkbox" className="mr-1 align-middle" checked={!!selected?.has(m.id)} onChange={() => onToggle(m.id)} />
            {m.name} (<span className="tabular-nums">{formatCurrency(Number(m.price_delta || 0))}</span>)
          </label>
        ))}
      </div>
    </div>
  );
}



