import { useQuery } from "@tanstack/react-query";
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
  const res = await apiClient.get("/api/admin/deliveries", { params });
  return listSchema.parse(res.data).deliveries;
}

export function useAdminDeliveries(filters: { status?: string }) {
  return useQuery({ queryKey: ["admin", "deliveries", filters], queryFn: () => fetchDeliveries(filters) });
}

