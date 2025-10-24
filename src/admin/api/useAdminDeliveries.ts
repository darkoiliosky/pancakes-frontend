import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import apiClient from "../../api/client";

const deliverySchema = z.object({
  id: z.number(),
  order_id: z.number(),
  status: z.enum(["Pending", "Accepted", "Delivering", "Delivered"]).or(z.string()),
  courier: z.object({ id: z.number().optional(), name: z.string().optional(), email: z.string().optional() }).optional(),
  created_at: z.string().optional(),
  accepted_at: z.string().optional(),
  delivered_at: z.string().optional(),
  location: z.string().optional(),
});

const listSchema = z.object({ deliveries: z.array(deliverySchema) });

export type AdminDelivery = z.infer<typeof deliverySchema>;

async function fetchDeliveries(params?: { status?: string }) {
  // Build params only when status is a concrete filter (not "all" or empty)
  const qp: Record<string, string> = {};
  if (params?.status && params.status.toLowerCase() !== "all") {
    qp.status = params.status.trim().toLowerCase();
  }
  const res = await apiClient.get("/api/admin/deliveries", {
    params: qp,
    headers: {
      "Cache-Control": "no-store, no-cache",
      Pragma: "no-cache",
    },
  });
  const raw = res.data as any;
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.deliveries) ? raw.deliveries : [];
  // Be tolerant: validate items individually, but never throw — filter out invalid entries instead
  const safe = Array.isArray(list)
    ? list.filter((it) => typeof it === "object" && it !== null)
    : [];
  return safe as AdminDelivery[];
}

export function useAdminDeliveries(filters: { status?: string }) {
  const normalized = {
    status:
      filters?.status && filters.status.toLowerCase() !== "all"
        ? filters.status.trim().toLowerCase()
        : undefined,
  };
  return useQuery<AdminDelivery[]>({
    queryKey: ["admin", "deliveries", normalized],
    queryFn: () => fetchDeliveries(normalized),
    // v5 replacement for keepPreviousData
    placeholderData: (prev) => (prev as AdminDelivery[] | undefined) ?? [],
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

const messageSchema = z.object({ message: z.string() }).or(z.any());

export function useCreateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { order_id: number; courier_id: number; status?: string; location?: string }) => {
      const res = await apiClient.post(`/api/admin/deliveries`, payload);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "deliveries"] }),
  });
}

export function useUpdateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: number; status?: string; location?: string; courier_id?: number; delivered_at?: string }) => {
      const res = await apiClient.patch(`/api/admin/deliveries/${id}`, payload);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "deliveries"] }),
  });
}
