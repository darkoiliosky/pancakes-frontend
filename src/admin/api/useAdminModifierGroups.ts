import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../api/client";

export type AdminModifierGroup = {
  id: number;
  title: string;
  hint: string | null;
  min_select: number;
  max_select: number;
  sort_order: number;
  is_active: boolean;
};

export type AdminModifierOption = {
  id: number;
  name: string;
  price: number;
  sort_order: number;
  is_active: boolean;
};

export function useAdminModifierGroups() {
  return useQuery({
    queryKey: ["admin", "modifier-groups"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/modifier-groups");
      return (Array.isArray(res.data?.groups) ? res.data.groups : []) as AdminModifierGroup[];
    },
    staleTime: 10_000,
  });
}

export function useCreateModifierGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<AdminModifierGroup>) => {
      const res = await apiClient.post("/api/admin/modifier-groups", payload);
      return res.data?.group;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "modifier-groups"] }),
  });
}

export function useUpdateModifierGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<AdminModifierGroup> & { id: number }) => {
      const res = await apiClient.patch(`/api/admin/modifier-groups/${id}`, payload);
      return res.data?.group;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "modifier-groups"] }),
  });
}

export function useDeleteModifierGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/admin/modifier-groups/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "modifier-groups"] }),
  });
}

export function useGroupOptions(groupId?: number) {
  return useQuery({
    queryKey: ["admin", "modifier-group-options", groupId || 0],
    queryFn: async () => {
      const res = await apiClient.get(`/api/admin/modifier-groups/${groupId}/options`);
      return (Array.isArray(res.data?.options) ? res.data.options : []) as AdminModifierOption[];
    },
    enabled: typeof groupId === "number" && groupId > 0,
    staleTime: 10_000,
  });
}

export function useCreateGroupOption(groupId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; price?: number; sort_order?: number; is_active?: boolean }) => {
      if (!groupId) throw new Error("groupId required");
      const res = await apiClient.post(`/api/admin/modifier-groups/${groupId}/options`, payload);
      return res.data?.option;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "modifier-group-options", groupId] }),
  });
}

export function useUpdateGroupOption(groupId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: number; name?: string; price?: number; sort_order?: number; is_active?: boolean }) => {
      const res = await apiClient.patch(`/api/admin/modifier-groups/${groupId}/options/${id}`, payload);
      return res.data?.option;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "modifier-group-options", groupId] }),
  });
}

export function useDeleteGroupOption(groupId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/admin/modifier-groups/${groupId}/options/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "modifier-group-options", groupId] }),
  });
}

export function useAssignedGroups(menuItemId?: number) {
  return useQuery({
    queryKey: ["admin", "assigned-groups", menuItemId || 0],
    queryFn: async () => {
      const res = await apiClient.get(`/api/admin/menu/${menuItemId}/modifier-groups`);
      return (Array.isArray(res.data?.groups) ? res.data.groups : []) as { id: number; title: string; sort_order: number; min_select: number; max_select: number; is_active: boolean }[];
    },
    enabled: typeof menuItemId === "number" && menuItemId > 0,
    staleTime: 10_000,
  });
}

export function useSetAssignedGroups(menuItemId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (group_ids: number[]) => {
      if (!menuItemId) throw new Error("menuItemId required");
      const res = await apiClient.put(`/api/admin/menu/${menuItemId}/modifier-groups`, { group_ids });
      return res.data?.groups;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "assigned-groups", menuItemId] }),
  });
}

