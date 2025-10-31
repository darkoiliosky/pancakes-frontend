import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useShop } from "../public/api/useShop";
import usePageTitle from "../hooks/usePageTitle";

export default function Home() {
  const { data: shop } = useShop();
  usePageTitle(`${shop?.name || "Pancakes Shop"} — Home`);
  const name = shop?.name || "Pancakes & More";
  const hero = "http://static.photos/food/1200x630/107";
  const maintenance = (shop?.maintenance_message || "").toString().trim();

  // Subtle fade-in + parallax for hero
  const [ready, setReady] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY || 0);
    setReady(true);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const parallax = useMemo(() => Math.max(-16, Math.min(16, (scrollY || 0) * 0.06)), [scrollY]);

  return (
    <main className="bg-[#fdf5ef] text-[#734d26]">
      {/* Announcement bar (maintenance message) */}
      {maintenance && (
        <div className="sticky top-0 z-10 bg-amber-50/90 backdrop-blur border-b border-amber-200 text-amber-800">
          {/* simple marquee */}
          <style>{`@keyframes marquee{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}`}</style>
          <div className="overflow-hidden">
            <div
              className="whitespace-nowrap py-2 text-sm flex items-center gap-2"
              style={{ animation: "marquee 16s linear infinite" }}
            >
              <span className="ml-4">🟡</span>
              <span className="font-medium">Announcement:</span>
              <span>{maintenance}</span>
              <span className="mx-8 opacity-60">•</span>
              <span>🟡</span>
              <span className="font-medium">Announcement:</span>
              <span>{maintenance}</span>
              <span className="mx-8 opacity-60">•</span>
            </div>
          </div>
        </div>
      )}
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
          <div
            className="h-full w-full opacity-[0.15]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 15% 20%, rgba(245,158,11,0.30) 3px, transparent 3px), radial-gradient(circle at 80% 30%, rgba(253,230,138,0.40) 4px, transparent 4px)",
              backgroundSize: "42px 42px, 56px 56px",
            }}
          />
        </div>
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-16 text-center space-y-8">
          <div
            className={`overflow-hidden rounded-3xl shadow-lg transform transition duration-700 ease-out ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ transform: `translateY(${parallax}px)` }}
          >
            <img src={hero} alt="Stack of pancakes with syrup" className="w-full h-auto max-h-[32rem] object-cover object-center" />
          </div>
          <div className={`space-y-4 transform transition duration-700 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#734d26] tracking-tight">
              Fluffy Pancakes & Hearty Bites
            </h1>
            <p className="text-lg max-w-2xl mx-auto text-[#8a5c2e]">
              Freshly made comfort food served with warm hospitality
            </p>
            <Link
              to="/menu"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Order Now
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Menu */}
      <section id="menu" className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { src: "http://static.photos/food/640x360/108", title: "Classic Pancakes", price: 9.5, desc: "With maple syrup & butter" },
            { src: "http://static.photos/food/640x360/109", title: "Toasted Sandwich", price: 7.5, desc: "Crunchy and warm" },
            { src: "http://static.photos/food/640x360/110", title: "Fresh Salad", price: 6.0, desc: "Greens & vinaigrette" },
            { src: "http://static.photos/food/640x360/111", title: "Iced Coffee", price: 4.0, desc: "Cold & refreshing" },
          ].map((c, idx) => (
            <div
              key={idx}
              className="group bg-white p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative rounded-2xl overflow-hidden mb-4 aspect-square">
                <img
                  src={c.src}
                  alt={c.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <span className="absolute top-4 right-4 bg-orange-500 text-white text-sm px-3 py-1 rounded-full shadow">
                  MKD {(c.price * 61.5).toFixed(c.price % 1 ? 2 : 0)}
                </span>
              </div>
              <h3 className="text-xl font-medium mb-1">{c.title}</h3>
              <p className="text-sm text-[#8a5c2e]">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="max-w-5xl mx-auto px-4 pb-20 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="rounded-3xl overflow-hidden shadow-lg">
          <img
            src="http://static.photos/food/1200x630/112"
            alt="Cafe interior"
            className="w-full h-full object-cover transform transition duration-[1200ms] ease-out will-change-transform"
            style={{ transform: `translateY(${parallax * 0.6}px)` }}
          />
        </div>
        <div className={`space-y-4 transform transition duration-700 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
          <h2 className="text-3xl font-serif font-bold text-[#734d26]">Cozy place, tasty plates</h2>
          <p className="text-[#8a5c2e]">We make pancakes, sandwiches, salads and coffee with care, using quality ingredients and classic techniques.</p>
          <div className="flex gap-3">
            <Link to="/menu" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-full shadow hover:-translate-y-0.5 transition">Browse Menu</Link>
            <Link to="/korpa" className="border border-orange-500 text-orange-600 px-5 py-2 rounded-full hover:bg-orange-50 transition">Корпа</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
