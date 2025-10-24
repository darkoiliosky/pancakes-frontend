import SummaryCard from "../components/SummaryCard";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { useAdminShop } from "../api/useAdminShop";

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: "blue" | "green" | "orange" | "yellow";
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    green: "bg-green-50 border-green-200 text-green-800",
    orange: "bg-orange-50 border-orange-200 text-orange-800",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
  };
  return (
    <div className={`p-4 rounded-xl border shadow-sm transition-colors duration-300 ${colorMap[color]} flex items-center gap-3`}>
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="text-sm opacity-80">{title}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { base, derived, isLoading, isError, updatedAt } = useDashboardStats();
  const data = base.data!;
  const shop = useAdminShop();
  const currency = shop.data?.currency || "$";
  const fmt = (n: number) => `${currency}${Number(n || 0).toFixed(2)}`;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-amber-100 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl border bg-white" style={{ height: 90 }} />
          ))}
        </div>
        <div className="p-4 rounded-xl border bg-white h-48" />
      </div>
    );
  }
  if (isError || !data) return <div className="text-red-600">Failed to load stats</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-700">Dashboard</h1>
        <div className="text-xs text-gray-500">Last updated: {new Date(updatedAt).toLocaleTimeString()}</div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Orders" value={data.totalOrders} icon="📦" color="blue" />
        <StatCard title="Total Income" value={fmt(data.totalIncome)} icon="💰" color="green" />
        <StatCard title="Total Users" value={data.totalUsers} icon="👥" color="orange" />
        <StatCard title="Shop" value={data.totalRestaurants || 1} icon="🏪" color="yellow" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border">
          <div className="font-semibold mb-2">Orders (7 days)</div>
          <div className="flex items-end gap-2 h-32">
            {derived.series.map((d) => {
              const h = Math.min(100, d.count * 15);
              return (
                <div key={d.date} className="flex flex-col items-center gap-1">
                  <div className="w-8 bg-blue-400 rounded transition-all duration-300" style={{ height: `${h}%` }} />
                  <div className="text-[10px] text-gray-500">{d.date.slice(5)}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border">
          <div className="font-semibold mb-2">Income (7 days)</div>
          <div className="flex items-end gap-2 h-32">
            {derived.series.map((d) => {
              const max = Math.max(1, ...derived.series.map((x) => x.income));
              const h = Math.min(100, (d.income / max) * 100);
              return (
                <div key={d.date} className="flex flex-col items-center gap-1">
                  <div className="w-8 bg-green-400 rounded transition-all duration-300" style={{ height: `${h}%` }} />
                  <div className="text-[10px] text-gray-500">{d.date.slice(5)}</div>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-gray-600 mt-2">Avg order value: {fmt(derived.avgOrderValue)}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border">
          <div className="font-semibold mb-2">Quick Stats</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 bg-yellow-50 rounded border">Pending orders: <b>{derived.pendingCount}</b></div>
            <div className="p-2 bg-blue-50 rounded border">Active deliveries: <b>{derived.activeDeliveriesCount}</b></div>
            <div className="p-2 bg-orange-50 rounded border">Customers: <b>{derived.roleCounts["customer"] || 0}</b></div>
            <div className="p-2 bg-orange-50 rounded border">Couriers: <b>{derived.roleCounts["courier"] || 0}</b></div>
          </div>
        </div>
      </div>

      {/* Most sold items */}
      {!!data.mostSoldItems?.length && (
        <div className="p-4 rounded-xl bg-white border">
          <div className="font-semibold mb-2">Top Items</div>
          <div className="space-y-2">
            {data.mostSoldItems.slice(0, 3).map((it) => (
              <div key={it.name} className="flex items-center gap-3">
                <div className="w-40 md:w-56 text-sm text-gray-700">{it.name}</div>
                <div className="flex-1 bg-amber-100 h-3 rounded">
                  <div className="bg-amber-500 h-3 rounded transition-all duration-300" style={{ width: Math.min(100, it.count).toString() + "%" }} />
                </div>
                <div className="w-10 text-right text-sm">{it.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
