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
  updated_at: z.string().optional(),
  total_price: z.number().optional(),
  items_count: z.number().optional(),
  items: z.array(orderItemSchema).optional(),
  delivery_address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  order_type: z.string().nullable().optional(),
  courier: z
    .object({ id: z.number(), name: z.string().optional(), email: z.string().optional() })
    .optional(),
});

const listSchema = z.object({ orders: z.array(orderSchema), total: z.number().optional() });

export type AdminOrder = z.infer<typeof orderSchema>;
export type AdminOrderList = { orders: AdminOrder[]; total: number };

async function fetchOrders(params?: { status?: string; from?: string; to?: string; user?: string; type?: string; page?: number; pageSize?: number }): Promise<AdminOrderList> {
  const res = await apiClient.get("/api/admin/orders", { params });
  const parsed = listSchema.parse(res.data);
  return { orders: parsed.orders, total: parsed.total ?? parsed.orders.length };
}

export function useAdminOrders(filters: { status?: string; from?: string; to?: string; user?: string; type?: string; page?: number; pageSize?: number; sortBy?: string; sortDir?: string }) {
  return useQuery<AdminOrderList>({
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
          const next = data.map((o) => (o.id === id ? { ...o, status, updated_at: new Date().toISOString() } : o));
          qc.setQueryData(key, next);
        } else if (data && Array.isArray(data.orders)) {
          const next = { ...data, orders: data.orders.map((o: any) => (o.id === id ? { ...o, status, updated_at: new Date().toISOString() } : o)) };
          qc.setQueryData(key, next);
        }
      });
      return { prev };
    },
    onSuccess: (res, vars) => {
      // Merge server-confirmed status/updated_at into all order queries
      const { id, status, updated_at } = (res || {}) as any;
      const all = qc.getQueriesData<any>({ queryKey: ["admin", "orders"] });
      all.forEach(([key, data]) => {
        if (Array.isArray(data)) {
          const next = data.map((o) => (o.id === (id ?? vars.id) ? { ...o, status: status ?? vars.status, updated_at: updated_at ?? o.updated_at } : o));
          qc.setQueryData(key, next);
        } else if (data && Array.isArray(data.orders)) {
          const next = { ...data, orders: data.orders.map((o: any) => (o.id === (id ?? vars.id) ? { ...o, status: status ?? vars.status, updated_at: updated_at ?? o.updated_at } : o)) };
          qc.setQueryData(key, next);
        }
      });
    },
    onError: (_err, _vars, ctx) => {
      ctx?.prev?.forEach?.(([key, data]: any) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });
}
