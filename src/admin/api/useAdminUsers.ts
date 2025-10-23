import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import apiClient from "../../api/client";

export const adminUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["admin", "courier", "customer"]).or(z.string()),
  is_active: z.boolean().optional(),
  created_at: z.string().optional(),
});

const usersResponseSchema = z.object({ users: z.array(adminUserSchema) });

export type AdminUser = z.infer<typeof adminUserSchema>;

async function fetchAdminUsers(): Promise<AdminUser[]> {
  const res = await apiClient.get("/api/admin/users");
  return usersResponseSchema.parse(res.data).users;
}

export function useAdminUsers() {
  return useQuery({ queryKey: ["admin", "users"], queryFn: fetchAdminUsers });
}

// Mutations
const messageSchema = z.object({ message: z.string() });

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.patch(`/api/admin/users/${id}/deactivate`);
      return messageSchema.parse(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export const inviteCourierSchema = z.object({ email: z.string().email() });
export type InviteCourierData = z.infer<typeof inviteCourierSchema>;

export function useInviteCourier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: InviteCourierData) => {
      const parsed = inviteCourierSchema.parse(payload);
      const res = await apiClient.post(`/api/admin/users/invite-courier`, parsed);
      return messageSchema.parse(res.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
