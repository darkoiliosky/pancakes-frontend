import { useShop } from "../public/api/useShop";
import { useLocation } from "react-router-dom";

export default function Footer() {
  const { data: shop } = useShop();
  const { pathname } = useLocation();
  if (pathname === "/") return null;
  return (
    <footer className="bg-white mt-auto border-t">
      <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-600 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="font-semibold text-gray-700">{shop?.name || "Pancakes Shop"}</div>
          {shop?.address && <div className="mt-1">{shop.address}</div>}
          {shop?.phone && <div className="mt-1">{shop.phone}</div>}
        </div>
        <div>
          <div className="font-semibold text-gray-700">Working hours</div>
          {shop?.working_hours ? (
            <div className="mt-1">{shop.working_hours}</div>
          ) : (
            <div className="mt-1">Mon-Sun</div>
          )}
        </div>
        <div className="text-gray-500 md:text-right">c {new Date().getFullYear()} {shop?.name || "Pancakes Shop"}</div>
      </div>
    </footer>
  );
}

