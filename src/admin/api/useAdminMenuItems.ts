import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import apiClient from "../../api/client";

export const menuItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  price: z.number(),
  category: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  available: z.boolean().optional(),
});

const listSchema = z.object({ items: z.array(menuItemSchema) });

export type AdminMenuItem = z.infer<typeof menuItemSchema>;

async function fetchMenu(params?: { category?: string; available?: string; q?: string }): Promise<AdminMenuItem[]> {
  const cleanParams: Record<string, string> = {};
  if (params?.category) cleanParams.category = params.category;
  if (params?.q) cleanParams.q = params.q;
  if (params?.available === "true" || params?.available === "false") {
    cleanParams.available = params.available;
  }
  const res = await apiClient.get(`/api/admin/menu`, { params: cleanParams });
  return listSchema.parse(res.data).items;
}

export function useAdminMenuItems(filters: { category?: string; available?: string; q?: string }) {
  return useQuery({
    queryKey: ["admin", "menu", filters],
    queryFn: () => fetchMenu(filters),
  });
}

const upsertSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  category: z.string().optional(),
  image: z.string().url().optional(),
  available: z.boolean().optional(),
});
export type UpsertMenuItem = z.infer<typeof upsertSchema>;

const messageSchema = z.object({ message: z.string() });

export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpsertMenuItem) => {
      const body = upsertSchema.parse(payload);
      const res = await apiClient.post(`/api/admin/menu`, body);
      return messageSchema.parse(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "menu"] });
    },
  });
}

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpsertMenuItem & { id: number }) => {
      const body = upsertSchema.parse(payload);
      const res = await apiClient.patch(`/api/admin/menu/${id}`, body);
      return messageSchema.parse(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "menu"] });
    },
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await apiClient.delete(`/api/admin/menu/${id}`);
      return messageSchema.parse(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "menu"] });
    },
  });
}
