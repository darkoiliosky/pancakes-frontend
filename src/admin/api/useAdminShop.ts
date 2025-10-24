import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import apiClient from "../../api/client";

const shopSchema = z.object({
  name: z.string().optional().default(""),
  is_open: z.boolean().optional().default(true),
  working_hours: z.string().optional().default(""),
  address: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  // Coerce numeric strings like "0.00" into numbers
  min_order: z.coerce.number().optional().default(0),
  delivery_fee: z.coerce.number().optional().default(0),
  currency: z.string().optional().default("$"),
  pickup_only: z.boolean().optional().default(false),
  maintenance_message: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  tax_rate: z.coerce.number().optional().default(0),
  working_hours_json: z.any().nullable().optional(),
  closed_until: z.string().nullable().optional(),
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
