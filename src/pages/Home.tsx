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

  return (
    <div className="min-h-screen bg-[#fffdf8]">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-8 w-64 bg-amber-100 rounded mx-auto" />
              <div className="h-4 w-40 bg-amber-50 rounded mx-auto" />
              <div className="h-4 w-80 bg-amber-50 rounded mx-auto" />
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto">
                <div className="h-4 bg-amber-50 rounded" />
                <div className="h-4 bg-amber-50 rounded" />
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl md:text-4xl font-bold text-amber-700">{name}</h1>
              <div className="mt-2 inline-flex items-center gap-2 text-sm">
                <span className={`px-2 py-0.5 rounded-full border ${isOpen ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"}`}>
                  {isOpen ? "Open" : "Closed"}
                </span>
                {shop?.working_hours && (
                  <span className="text-gray-600">Hours: {shop.working_hours}</span>
                )}
              </div>
            </>
          )}
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Fluffy pancakes, fresh toppings, and cozy vibes. Order online or pick up in-store.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to="/menu" className="px-5 py-2 rounded bg-amber-500 text-white hover:bg-amber-600">View Menu</Link>
            <Link to="/cart" className="px-5 py-2 rounded border border-amber-500 text-amber-700 hover:bg-amber-50">View Cart</Link>
          </div>
          <div className="mt-6 text-sm text-gray-600">
            {!isLoading && (
              <>
                {shop?.address && <div>Address: {shop.address}</div>}
                {shop?.phone && <div>Phone: {shop.phone}</div>}
              </>
            )}
          </div>
          {user && (
            <div className="mt-4 text-sm text-gray-600">Welcome back, {user.name}.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
