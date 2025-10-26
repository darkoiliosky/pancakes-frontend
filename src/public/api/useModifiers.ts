import { useQuery } from "@tanstack/react-query";
import apiClient from "../../api/client";

export type PublicModifier = { id: number; name: string; price_delta: number };

async function fetchModifiers(menuItemId: number): Promise<PublicModifier[]> {
  const res = await apiClient.get(`/api/menu/${menuItemId}/modifiers`);
  const arr = Array.isArray(res.data?.modifiers) ? res.data.modifiers : (Array.isArray(res.data) ? res.data : []);
  return arr.filter((m: any) => m && typeof m.id === "number" && typeof m.name === "string").map((m: any) => ({
    id: Number(m.id),
    name: String(m.name),
    price_delta: Number(m.price_delta || 0),
  }));
}

export function useModifiers(menuItemId?: number) {
  return useQuery({
    queryKey: ["public", "modifiers", menuItemId || 0],
    queryFn: () => fetchModifiers(menuItemId as number),
    enabled: typeof menuItemId === "number" && menuItemId > 0,
    staleTime: 30_000,
  });
}

