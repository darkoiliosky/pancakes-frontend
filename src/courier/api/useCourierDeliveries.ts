import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import apiClient from "../../api/client";

const deliverySchema = z.object({
  id: z.number(),
  order_id: z.number(),
  status: z.string(),
  location: z.string().nullable().optional(),
  created_at: z.string().optional(),
  delivered_at: z.string().nullable().optional(),
});

const listSchema = z.object({ deliveries: z.array(deliverySchema) });

export type CourierDelivery = z.infer<typeof deliverySchema>;

async function fetchMyDeliveries() {
  const res = await apiClient.get("/api/courier/deliveries");
  return listSchema.parse(res.data).deliveries;
}

export function useCourierDeliveries() {
  return useQuery({ queryKey: ["courier", "deliveries"], queryFn: fetchMyDeliveries, refetchInterval: 20000 });
}

export function useUpdateCourierDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, location }: { id: number; status: string; location?: string }) => {
      const res = await apiClient.patch(`/api/courier/deliveries/${id}`, { status, location });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courier", "deliveries"] });
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });
}

// Available orders for self-assign
const availableOrderSchema = z.object({
  id: z.number(),
  created_at: z.string().optional(),
  total_price: z.number().optional(),
  status: z.string().optional(),
  delivery_address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  order_type: z.string().nullable().optional(),
  items_count: z.number().optional(),
});
const availableListSchema = z.object({ orders: z.array(availableOrderSchema) });
export type AvailableOrder = z.infer<typeof availableOrderSchema>;

async function fetchAvailableOrders() {
  const res = await apiClient.get("/api/courier/available");
  return availableListSchema.parse(res.data).orders;
}

export function useAvailableOrders() {
  return useQuery({ queryKey: ["courier", "available"], queryFn: fetchAvailableOrders, refetchInterval: 20000 });
}

export function useSelfAssign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ order_id }: { order_id: number }) => {
      const res = await apiClient.post("/api/courier/deliveries/self-assign", { order_id });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courier", "available"] });
      qc.invalidateQueries({ queryKey: ["courier", "deliveries"] });
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });
}
