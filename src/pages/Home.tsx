import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useShop } from "../public/api/useShop";
import usePageTitle from "../hooks/usePageTitle";

function Home() {
  const { user } = useAuth();
  const { data: shop, isLoading } = useShop();
  usePageTitle(`${shop?.name || "Pancakes Shop"} — Home`);

  const isOpen = shop?.is_open ?? true;
  const name = shop?.name || "Pancakes Shop";
  const subtitle = (shop as any)?.maintenance_message || "Fluffy pancakes, fresh toppings, cozy vibes.";
  const heroImage = (shop as any)?.logo_url as string | undefined;

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-hidden bg-[#fffdf8]">
      {/* Unified Hero + Info (no extra scroll) */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        {heroImage ? (
          <div className="absolute inset-0 opacity-15">
            <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-amber-100 to-amber-50" />
        )}
        {/* Decorative shapes */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, rgba(251,191,36,0.12) 3px, transparent 3px), radial-gradient(circle at 80% 30%, rgba(245,158,11,0.14) 4px, transparent 4px)",
            backgroundSize: "42px 42px, 56px 56px",
          }}
        />
        {/* Subtle emojis for character */}
        <div className="pointer-events-none select-none absolute -left-6 top-10 text-6xl opacity-20">🥞</div>
        <div className="pointer-events-none select-none absolute right-6 bottom-10 text-6xl opacity-20">☕</div>

        {/* Content centered vertically; occupies full available height */}
        <div className="relative max-w-6xl mx-auto px-4 py-6 md:py-8 flex items-center min-h-full">
          {isLoading ? (
            <div className="w-full space-y-5 animate-pulse text-center">
              <div className="h-10 w-72 bg-amber-200/60 rounded mx-auto" />
              <div className="h-4 w-80 bg-amber-100 rounded mx-auto" />
              <div className="h-4 w-64 bg-amber-100 rounded mx-auto" />
            </div>
          ) : (
            <div className="w-full">
              {/* Elevated container for better visual balance */}
              <div className="mx-auto max-w-4xl rounded-3xl border border-amber-100 bg-white/70 backdrop-blur shadow-xl px-6 py-8 md:px-10 md:py-10 text-center">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-amber-800">{name}</h1>
                <p className="mt-3 text-amber-900/90 max-w-2xl mx-auto">
                  Try our fresh pancakes, mini waffles, and cozy coffee to go.
                </p>

                <div className="mt-5 inline-flex items-center gap-4 px-4 py-3 rounded-2xl bg-white/80 backdrop-blur-sm shadow-md ring-1 ring-amber-100">
                  <span
                    className={`inline-flex items-center gap-3 px-4 py-2 rounded-full text-base md:text-lg font-semibold shadow-lg ring-2 ${
                      isOpen
                        ? "bg-green-500/10 text-green-900 ring-green-300 shadow-green-200"
                        : "bg-gray-400/10 text-gray-900 ring-gray-300 shadow-gray-200"
                    }`}
                  >
                    <span className="text-xl">{isOpen ? "●" : "○"}</span>
                    {isOpen ? "Open" : "Closed"}
                  </span>
                  {shop?.working_hours && (
                    <span className="text-sm md:text-base text-gray-700">Hours: {shop.working_hours}</span>
                  )}
                </div>

                <div className="mt-5 md:mt-6 flex items-center justify-center gap-4">
                  <Link
                    to="/menu"
                    className="px-6 py-3 rounded-xl bg-amber-500 text-white hover:bg-amber-600 shadow-md hover:shadow-lg transition"
                  >
                    View Menu
                  </Link>
                  <Link
                    to="/cart"
                    className="px-6 py-3 rounded-xl border border-amber-500 text-amber-700 bg-white/80 hover:bg-amber-50 shadow-sm hover:shadow transition"
                  >
                    View Cart
                  </Link>
                </div>

                <div className="mt-4 md:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm md:text-base">
                  <div className="rounded-xl bg-white/90 backdrop-blur border p-4 text-left shadow-sm">
                    <div className="font-semibold text-gray-700">Visit us</div>
                    <div className="mt-1 text-gray-600">{shop?.address || "Our address"}</div>
                  </div>
                  <div className="rounded-xl bg-white/90 backdrop-blur border p-4 text-left shadow-sm">
                    <div className="font-semibold text-gray-700">Call us</div>
                    <div className="mt-1 text-gray-600">{shop?.phone || "(000) 000-0000"}</div>
                  </div>
                  <div className="rounded-xl bg-white/90 backdrop-blur border p-4 text-left shadow-sm">
                    <div className="font-semibold text-gray-700">Working hours</div>
                    <div className="mt-1 text-gray-600">{shop?.working_hours || "Mon–Sun"}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;
