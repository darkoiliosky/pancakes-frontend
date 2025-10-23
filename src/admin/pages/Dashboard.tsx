import SummaryCard from "../components/SummaryCard";
import { useAdminStats } from "../api/useAdminStats";

export default function Dashboard() {
  const { data, isLoading, error } = useAdminStats();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">Failed to load stats</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-amber-700">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Orders" value={data.totalOrders} />
        <SummaryCard title="Total Income" value={`$${data.totalIncome.toFixed(2)}`} />
        <SummaryCard title="Total Users" value={data.totalUsers} />
        <SummaryCard title="Restaurants" value={data.totalRestaurants || data.activeRestaurants} />
      </div>
      {!!data.mostSoldItems?.length && (
        <div className="p-4 rounded-xl bg-white border border-amber-100">
          <div className="font-semibold mb-2">Most Sold Items</div>
          <div className="space-y-2">
            {data.mostSoldItems.slice(0, 5).map((it) => (
              <div key={it.name} className="flex items-center gap-3">
                <div className="w-48 md:w-64 text-sm text-gray-700">{it.name}</div>
                <div className="flex-1 bg-amber-100 h-3 rounded">
                  <div className="bg-amber-500 h-3 rounded" style={{ width: Math.min(100, it.count).toString() + "%" }} />
                </div>
                <div className="w-12 text-right text-sm">{it.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
