import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import apiClient from "../../api/client";

const menuItemSchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  price: z.coerce.number(),
  category: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  stock: z.coerce.number().nullable().optional(),
  available: z.boolean().optional().default(true),
});

const listSchema = z.object({ items: z.array(menuItemSchema) });

export type PublicMenuItem = z.infer<typeof menuItemSchema>;

async function fetchMenu(params?: { category?: string; available?: boolean; q?: string }) {
  try {
    const res = await apiClient.get("/api/menu", { params });
    try {
      const parsed = listSchema.parse(res.data);
      return parsed.items;
    } catch {
      // If backend returns an array directly
      const arr = Array.isArray(res.data) ? res.data : [];
      return z.array(menuItemSchema).parse(arr);
    }
  } catch {
    // On any failure, return empty list
    return [] as PublicMenuItem[];
  }
}

export function useMenu(filters?: { category?: string; available?: boolean; q?: string }) {
  return useQuery({ queryKey: ["menu", filters || {}], queryFn: () => fetchMenu(filters), staleTime: 30_000 });
}
