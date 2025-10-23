import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import apiClient from "../../api/client";

export const restaurantSchema = z.object({
  id: z.number(),
  name: z.string(),
  cuisine: z.string().optional(),
  is_open: z.boolean().optional(),
});

const listSchema = z.object({ restaurants: z.array(restaurantSchema) });

export type AdminRestaurant = z.infer<typeof restaurantSchema>;

async function fetchRestaurants(): Promise<AdminRestaurant[]> {
  const res = await apiClient.get("/api/admin/restaurants");
  return listSchema.parse(res.data).restaurants;
}

export function useAdminRestaurants() {
  return useQuery({ queryKey: ["admin", "restaurants"], queryFn: fetchRestaurants });
}

const upsertSchema = z.object({
  name: z.string().min(1),
  cuisine: z.string().optional(),
  is_open: z.boolean().optional(),
});
export type UpsertRestaurant = z.infer<typeof upsertSchema>;

const messageSchema = z.object({ message: z.string() });

export function useCreateRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpsertRestaurant) => {
      const body = upsertSchema.parse(payload);
      const res = await apiClient.post("/api/admin/restaurants", body);
      return messageSchema.parse(res.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "restaurants"] }),
  });
}

export function useUpdateRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpsertRestaurant & { id: number }) => {
      const body = upsertSchema.parse(payload);
      const res = await apiClient.patch(`/api/admin/restaurants/${id}`, body);
      return messageSchema.parse(res.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "restaurants"] }),
  });
}

export function useDeleteRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/api/admin/restaurants/${id}`);
      return messageSchema.parse(res.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "restaurants"] }),
  });
}

