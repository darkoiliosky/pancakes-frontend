import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../api/client";

export type AdminPickup = {
  id: number;
  order_id: number;
  status: string; // pending | preparing | ready | picked_up | cancelled
  created_at?: string;
  picked_up_at?: string | null;
};

async function fetchPickups(params?: { status?: string }) {
  const qp: Record<string, string> = {};
  if (params?.status && params.status.toLowerCase() !== "all") qp.status = params.status.trim().toLowerCase();
  const res = await apiClient.get("/api/admin/pickups", { params: qp });
  const list = Array.isArray(res.data?.pickups) ? res.data.pickups : Array.isArray(res.data) ? res.data : [];
  return (list as any[]).filter((x) => x && typeof x.id === 'number') as AdminPickup[];
}

export function useAdminPickups(filters: { status?: string }) {
  const normalized = filters?.status && filters.status.toLowerCase() !== 'all' ? { status: filters.status } : {};
  return useQuery<AdminPickup[]>({
    queryKey: ["admin", "pickups", normalized],
    queryFn: () => fetchPickups(normalized),
    placeholderData: (prev) => (prev as AdminPickup[] | undefined) ?? [],
    refetchOnWindowFocus: true,
    refetchInterval: 20000,
    refetchIntervalInBackground: true,
  });
}

export function useUpdatePickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: number; status?: string; picked_up_at?: string }) => {
      // reuse deliveries endpoint style by adding a dedicated pickups endpoint later if needed
      const res = await apiClient.patch(`/api/admin/pickups/${id}`, payload);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "pickups"] }),
  });
}

