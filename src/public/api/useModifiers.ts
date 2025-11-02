import { useQuery } from "@tanstack/react-query";
import apiClient from "../../api/client";

export type PublicModifierOption = { id: number; name: string; price: number };
export type PublicModifierGroup = {
  id: number;
  title: string;
  hint: string | null;
  min: number; // 0..n, 0 means no minimum
  max: number; // 0 means unlimited
  options: PublicModifierOption[];
};

async function fetchGrouped(menuItemId: number): Promise<PublicModifierGroup[]> {
  const res = await apiClient.get(`/api/menu/${menuItemId}/modifiers`);
  const raw = res.data;
  const groups = Array.isArray(raw?.groups) ? raw.groups : [];
  const out: PublicModifierGroup[] = groups
    .filter((g: any) => g && typeof g.id === "number")
    .map((g: any) => ({
      id: Number(g.id),
      title: String(g.title ?? ""),
      hint: (g.hint === null || typeof g.hint === "string") ? g.hint : null,
      min: Number(g.min ?? 0) || 0,
      max: Number(g.max ?? 0) || 0,
      options: Array.isArray(g.options)
        ? g.options
            .filter((o: any) => o && typeof o.id === "number")
            .map((o: any) => ({ id: Number(o.id), name: String(o.name ?? ""), price: Number(o.price ?? 0) }))
        : [],
    }));
  return out;
}

export function useModifiers(menuItemId?: number) {
  return useQuery({
    queryKey: ["public", "modifiers", menuItemId || 0],
    queryFn: () => fetchGrouped(menuItemId as number),
    enabled: typeof menuItemId === "number" && menuItemId > 0,
    staleTime: 30_000,
  });
}
