import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import apiClient from "../../api/client";

// Public shop settings returned from GET /api/shop
const shopSchema = z.object({
  name: z.string().optional().default(""),
  is_open: z.boolean().optional().default(true),
  is_open_effective: z.boolean().optional().default(true),
  working_hours: z.string().optional().default(""),
  address: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  min_order: z.coerce.number().optional().default(0),
  delivery_fee: z.coerce.number().optional().default(0),
  currency: z.string().optional().default("$"),
  pickup_only: z.boolean().optional().default(false),
  working_hours_json: z.any().nullable().optional(),
  closed_until: z.string().nullable().optional(),
  maintenance_message: z.string().optional().default(""),
  logo_url: z.string().nullable().optional(),
});

const getSchema = z.object({ settings: shopSchema.nullable().optional() });

export type PublicShopSettings = z.infer<typeof shopSchema>;

async function fetchShop(): Promise<PublicShopSettings> {
  try {
    const res = await apiClient.get("/api/shop");
    // Support both {settings: {...}} and direct {...}
    try {
      const parsed = getSchema.parse(res.data);
      return parsed.settings ?? shopSchema.parse({});
    } catch {
      return shopSchema.parse(res.data ?? {});
    }
  } catch {
    // On any failure, return safe defaults
    return shopSchema.parse({});
  }
}

export function useShop() {
  return useQuery({ queryKey: ["shop", "public"], queryFn: fetchShop, staleTime: 60_000 });
}
