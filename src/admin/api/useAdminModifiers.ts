import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import apiClient from "../../api/client";

export const modifierSchema = z.object({
  id: z.number(),
  name: z.string(),
  price_delta: z.number(),
});
export type AdminModifier = z.infer<typeof modifierSchema>;

const listSchema = z.object({ modifiers: z.array(modifierSchema) });

async function fetchModifiers(menuItemId: number): Promise<AdminModifier[]> {
  const res = await apiClient.get(`/api/admin/menu/${menuItemId}/modifiers`);
  const raw = res.data;
  try {
    if (Array.isArray(raw)) return z.array(modifierSchema).parse(raw);
    return listSchema.parse(raw).modifiers;
  } catch {
    return [];
  }
}

export function useAdminModifiers(menuItemId?: number) {
  return useQuery({
    queryKey: ["admin", "modifiers", menuItemId || 0],
    queryFn: () => fetchModifiers(menuItemId as number),
    enabled: typeof menuItemId === "number" && menuItemId > 0,
    staleTime: 10_000,
  });
}

export function useCreateModifier(menuItemId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; price_delta: number }) => {
      if (!menuItemId) throw new Error("menuItemId required");
      const body = { name: payload.name.trim(), price_delta: Number(payload.price_delta) };
      const res = await apiClient.post(`/api/admin/menu/${menuItemId}/modifiers`, body);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "modifiers", menuItemId] }),
  });
}

export function useUpdateModifier(menuItemId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, price_delta }: { id: number; name?: string; price_delta?: number }) => {
      const body: any = {};
      if (typeof name === "string") body.name = name.trim();
      if (typeof price_delta !== "undefined") body.price_delta = Number(price_delta);
      const res = await apiClient.patch(`/api/admin/modifiers/${id}`, body);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "modifiers", menuItemId] }),
  });
}

export function useDeleteModifier(menuItemId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/api/admin/modifiers/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "modifiers", menuItemId] }),
  });
}

