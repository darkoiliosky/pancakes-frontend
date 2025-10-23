import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import apiClient from "../../api/client";

const statsSchema = z.object({
  totalOrders: z.number().optional().default(0),
  totalIncome: z.number().optional().default(0),
  totalUsers: z.number().optional().default(0),
  totalRestaurants: z.number().optional().default(0),
  mostSoldItems: z.array(z.object({ name: z.string(), count: z.number() })).optional().default([]),
  activeRestaurants: z.number().optional().default(0),
});

export type AdminStats = z.infer<typeof statsSchema>;

async function fetchAdminStats(): Promise<AdminStats> {
  const res = await apiClient.get("/api/admin/stats");
  return statsSchema.parse(res.data);
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchAdminStats,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
