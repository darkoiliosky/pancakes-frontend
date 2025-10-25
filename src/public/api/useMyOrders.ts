import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import apiClient from "../../api/client";

const orderItemSchema = z.object({
  id: z.number(),
  name: z.string().optional().default(""),
  price: z.coerce.number().optional().default(0),
  quantity: z.coerce.number().optional().default(0),
  subtotal: z.coerce.number().optional().default(0),
});

const orderSchema = z.object({
  id: z.number(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string().optional(),
  total_price: z.coerce.number().optional().default(0),
  items_count: z.coerce.number().optional().default(0),
  delivery_address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  order_type: z.string().nullable().optional(),
  items: z.array(orderItemSchema).optional().default([]),
});

const listSchema = z.object({ orders: z.array(orderSchema) });

export type MyOrder = z.infer<typeof orderSchema>;

async function fetchMyOrders(): Promise<MyOrder[]> {
  const res = await apiClient.get("/api/orders/my");
  return listSchema.parse(res.data).orders;
}

export function useMyOrders() {
  return useQuery({ queryKey: ["orders", "my"], queryFn: fetchMyOrders });
}
