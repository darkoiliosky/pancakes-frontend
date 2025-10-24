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
    },
  });
}

