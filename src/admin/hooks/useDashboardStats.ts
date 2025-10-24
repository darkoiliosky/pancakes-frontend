import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAdminStats } from "../api/useAdminStats";
import { useAdminOrders } from "../api/useAdminOrders";
import { useAdminDeliveries } from "../api/useAdminDeliveries";
import { useAdminUsers } from "../api/useAdminUsers";

function isoDate(daysFromToday: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

export function useDashboardStats() {
  // base stats (has mostSoldItems, totals)
  const base = useAdminStats();

  // last 7 days orders
  const from7 = isoDate(-6); // include today
  const to0 = isoDate(0);
  const orders7 = useAdminOrders({ from: from7, to: to0, status: "delivered" });

  // pending orders count
  const pendingOrders = useAdminOrders({ status: "pending" });

  // active deliveries count (normalized to 'delivering')
  const activeDeliveries = useAdminDeliveries({ status: "delivering" });

  // users breakdown
  const usersAll = useAdminUsers();

  // derive metrics
  const derived = useMemo(() => {
    const orders = orders7.data ?? [];
    const byDay = new Map<string, { count: number; income: number }>();
    for (let i = 6; i >= 0; i--) {
      const key = isoDate(-i);
      byDay.set(key, { count: 0, income: 0 });
    }
    orders.forEach((o: any) => {
      const key = new Date(o.created_at).toISOString().slice(0, 10);
      if (!byDay.has(key)) byDay.set(key, { count: 0, income: 0 });
      const entry = byDay.get(key)!;
      entry.count += 1;
      // Prefer total_price if provided by API; fallback to items sum
      const income = typeof o.total_price === "number" && !isNaN(o.total_price)
        ? Number(o.total_price)
        : (o.items || []).reduce((s: number, it: any) => s + (it.price || 0) * (it.quantity || 0), 0);
      entry.income += income;
    });
    const series = Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, ...v }));

    const totalCount = series.reduce((s, d) => s + d.count, 0);
    const totalIncome = series.reduce((s, d) => s + d.income, 0);
    const avgOrderValue = totalCount > 0 ? totalIncome / totalCount : 0;

    const users = usersAll.data ?? [];
    const roleCounts = users.reduce(
      (acc: Record<string, number>, u: any) => {
        const r = (u.role || "customer").toLowerCase();
        acc[r] = (acc[r] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      series,
      avgOrderValue,
      roleCounts,
      pendingCount: Array.isArray(pendingOrders.data) ? pendingOrders.data.length : 0,
      activeDeliveriesCount: Array.isArray(activeDeliveries.data) ? activeDeliveries.data.length : 0,
    };
  }, [orders7.data, usersAll.data, pendingOrders.data, activeDeliveries.data]);

  // wrapper meta
  const isLoading =
    base.isLoading || orders7.isLoading || pendingOrders.isLoading || activeDeliveries.isLoading || usersAll.isLoading;
  const isError = base.isError || orders7.isError || pendingOrders.isError || activeDeliveries.isError || usersAll.isError;
  const updatedAt = Math.max(
    base.dataUpdatedAt || 0,
    orders7.dataUpdatedAt || 0,
    pendingOrders.dataUpdatedAt || 0,
    activeDeliveries.dataUpdatedAt || 0,
    usersAll.dataUpdatedAt || 0
  );

  return {
    base,
    derived,
    isLoading,
    isError,
    updatedAt,
  } as const;
}
