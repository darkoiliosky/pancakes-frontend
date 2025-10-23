import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import apiClient from "../../api/client";

const orderItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
});

const orderSchema = z.object({
  id: z.number(),
  user: z.object({ id: z.number(), name: z.string().optional(), email: z.string().optional() }).optional(),
  restaurant: z.object({ id: z.number(), name: z.string() }).optional(),
  status: z.string(),
  created_at: z.string(),
  items: z.array(orderItemSchema).optional(),
});

const listSchema = z.object({ orders: z.array(orderSchema) });

export type AdminOrder = z.infer<typeof orderSchema>;

async function fetchOrders(params?: { status?: string; from?: string; to?: string; user?: string }) {
  const res = await apiClient.get("/api/admin/orders", { params });
  return listSchema.parse(res.data).orders;
}

export function useAdminOrders(filters: { status?: string; from?: string; to?: string; user?: string }) {
  return useQuery({ queryKey: ["admin", "orders", filters], queryFn: () => fetchOrders(filters) });
}

