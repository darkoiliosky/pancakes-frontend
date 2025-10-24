import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import apiClient from "../../api/client";

// Public shop settings returned from GET /api/shop
const shopSchema = z.object({
  name: z.string().optional().default(""),
  is_open: z.boolean().optional().default(true),
  working_hours: z.string().optional().default(""),
  address: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  min_order: z.coerce.number().optional().default(0),
  delivery_fee: z.coerce.number().optional().default(0),
  currency: z.string().optional().default("$"),
});

const getSchema = z.object({ settings: shopSchema.nullable().optional() });

export type PublicShopSettings = z.infer<typeof shopSchema>;

async function fetchShop(): Promise<PublicShopSettings> {
  const res = await apiClient.get("/api/shop");
  // Support both {settings: {...}} and direct {...}
  try {
    const parsed = getSchema.parse(res.data);
    return parsed.settings ?? shopSchema.parse({});
  } catch {
    return shopSchema.parse(res.data ?? {});
  }
}

export function useShop() {
  return useQuery({ queryKey: ["shop", "public"], queryFn: fetchShop, staleTime: 60_000 });
}

