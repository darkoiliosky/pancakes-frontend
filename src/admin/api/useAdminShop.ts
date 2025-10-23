import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import apiClient from "../../api/client";

const shopSchema = z.object({
  name: z.string().optional().default(""),
  is_open: z.boolean().optional().default(true),
  working_hours: z.string().optional().default(""),
  address: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  min_order: z.number().optional().default(0),
  delivery_fee: z.number().optional().default(0),
});

const getSchema = z.object({ settings: shopSchema.nullable().optional() });

export type ShopSettings = z.infer<typeof shopSchema>;

async function fetchShop() {
  const res = await apiClient.get("/api/admin/shop");
  const parsed = getSchema.parse(res.data);
  return parsed.settings ?? shopSchema.parse({});
}

export function useAdminShop() {
  return useQuery({ queryKey: ["admin", "shop"], queryFn: fetchShop });
}

const patchSchema = shopSchema.partial();

export function useUpdateShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ShopSettings>) => {
      const res = await apiClient.patch("/api/admin/shop", patchSchema.parse(payload));
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "shop"] });
    },
  });
}

