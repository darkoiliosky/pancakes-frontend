import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import apiClient from "../../api/client";

const orderItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  subtotal: z.number().optional(),
});

const orderSchema = z.object({
  id: z.number(),
  user: z.object({ id: z.number(), name: z.string().optional(), email: z.string().optional() }).optional(),
  restaurant: z.object({ id: z.number(), name: z.string() }).optional(),
  status: z.string(),
  created_at: z.string(),
  total_price: z.number().optional(),
  items_count: z.number().optional(),
  items: z.array(orderItemSchema).optional(),
  courier: z
    .object({ id: z.number(), name: z.string().optional(), email: z.string().optional() })
    .optional(),
});

const listSchema = z.object({ orders: z.array(orderSchema) });

export type AdminOrder = z.infer<typeof orderSchema>;

async function fetchOrders(params?: { status?: string; from?: string; to?: string; user?: string }) {
  const res = await apiClient.get("/api/admin/orders", { params });
  return listSchema.parse(res.data).orders;
}

export function useAdminOrders(filters: { status?: string; from?: string; to?: string; user?: string }) {
  return useQuery({
    queryKey: ["admin", "orders", filters],
    queryFn: () => fetchOrders(filters),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export const updateStatusSchema = z.object({ id: z.number(), status: z.string() });

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const body = updateStatusSchema.parse({ id, status });
      const res = await apiClient.patch(`/api/admin/orders/${id}/status`, { status: body.status });
      return res.data;
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["admin", "orders"] });
      const prev = qc.getQueriesData<any>({ queryKey: ["admin", "orders"] });
      prev.forEach(([key, data]) => {
        if (Array.isArray(data)) {
          const next = data.map((o) => (o.id === id ? { ...o, status } : o));
          qc.setQueryData(key, next);
        }
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.prev?.forEach?.(([key, data]: any) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });
}
