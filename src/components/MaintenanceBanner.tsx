import { useShop } from "../public/api/useShop";

export default function MaintenanceBanner() {
  const { data: shop } = useShop();
  const msg = (shop?.maintenance_message || "").trim();
  if (!msg) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-40">
      <div className="bg-yellow-100 text-yellow-900 border-b border-yellow-300 text-sm px-4 py-2 text-center">
        <b>Maintenance:</b> {msg}
      </div>
    </div>
  );
}

