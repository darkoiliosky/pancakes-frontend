import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import MenuList from "../components/MenuList";
import { useShop } from "../api/useShop";
import { useMenu } from "../api/useMenu";
import { Switch } from "../../components/ui/switch";
import usePageTitle from "../../hooks/usePageTitle";
import "../../assets/forMenu.css";

export default function Menu() {
  const { count } = useCart();
  const { data: shop } = useShop();
  const { data: items = [], isLoading } = useMenu();
  usePageTitle(`${shop?.name || "Pancakes Shop"} — Menu`);
  const [params, setParams] = useSearchParams();

  const qParam = params.get("q") || "";
  const catParam = params.get("category") || "";
  const availParam = params.get("available");
  const available = availParam === null ? undefined : availParam === "true";

  const setParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (!value || value.length === 0) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const categories = Array.from(
    new Set(items.map((it) => (it.category || "").trim()).filter(Boolean))
  ).sort();

  return (
    <div className="menu-view max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-amber-700">Menu</h1>
        <Link to="/cart" className="underline text-amber-700">
          Cart ({count})
        </Link>
      </div>

      {/* Hero banner */}
      <div className="menu-hero relative overflow-hidden rounded-2xl border border-amber-100 mb-6 shadow-sm">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #fbbf24 2px, transparent 2px), radial-gradient(circle at 60% 40%, #fde68a 2px, transparent 2px)",
            backgroundSize: "40px 40px, 50px 50px",
          }}
        />
        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-amber-800">
            Freshly made, always delicious
          </h2>
          <p className="mt-1 text-sm text-amber-900/80 max-w-prose">
            Explore our selection of pancakes and treats. Choose your favorites
            and add them to your cart.
          </p>
        </div>
      </div>

      {/* Sticky Filters */}
      <div className="sticky top-20 z-10">
        <div className="rounded-2xl border bg-white/90 backdrop-blur-sm p-4 shadow-sm">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center animate-pulse">
              <div className="h-10 bg-amber-50 rounded" />
              <div className="h-10 bg-amber-50 rounded" />
              <div className="h-10 bg-amber-50 rounded" />
              <div className="h-10 bg-amber-50 rounded" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-amber-600">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </div>
                  <input
                    placeholder="Search name/description"
                    className="border rounded px-9 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-300"
                    aria-label="Search menu"
                    defaultValue={qParam}
                    onChange={(e) => setParam("q", e.target.value)}
                  />
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-amber-600">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18"></path>
                      <path d="M8 12h8"></path>
                      <path d="M10 18h4"></path>
                    </svg>
                  </div>
                  <select
                    className="border rounded px-9 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-300"
                    aria-label="Filter category"
                    value={catParam}
                    onChange={(e) => setParam("category", e.target.value)}
                  >
                    <option value="">All categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 flex items-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Available only
                  </span>
                  <Switch
                    checked={available === true}
                    onCheckedChange={(v) =>
                      setParam("available", v ? "true" : undefined)
                    }
                  />
                </div>
                <button
                  className="px-3 py-2 border rounded hover:bg-amber-50"
                  onClick={() =>
                    setParams(new URLSearchParams(), { replace: true })
                  }
                >
                  Clear
                </button>
              </div>
              {/* Quick categories under search */}
              {categories.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-1">
                    Quick categories
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={`px-3 py-1 rounded-full border transition transform hover:scale-[1.02] ${!catParam ? "bg-amber-500 text-white border-amber-500 ring-1 ring-amber-300/40" : "bg-white text-amber-700 border-amber-300 hover:ring-amber-300/40 hover:ring-1"}`}
                      onClick={() => {
                        setParam("category", undefined);
                        const el = document.getElementById("cat-__top");
                        el?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                    >
                      All
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c}
                        className={`px-3 py-1 rounded-full border transition transform hover:scale-[1.02] ${catParam === c ? "bg-amber-500 text-white border-amber-500 ring-1 ring-amber-300/40" : "bg-white text-amber-700 border-amber-300 hover:ring-amber-300/40 hover:ring-1"}`}
                        onClick={() => {
                          setParam("category", c);
                          const el = document.getElementById(
                            `cat-${c.replace(/\s+/g, "-").toLowerCase()}`
                          );
                          el?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div id="cat-__top" />
      <MenuList
        items={items}
        isLoading={isLoading}
        filters={{ q: qParam, category: catParam, available }}
      />
    </div>
  );
}
