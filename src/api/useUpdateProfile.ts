import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import apiClient from "./client";

// Local Zod schemas
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.string().optional(),
  created_at: z.string().optional(),
  phone: z.string().optional(),
});

const updateResponseSchema = z.object({ user: userSchema });

type UpdatePayload = {
  name: string;
  phone?: string;
};

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdatePayload) => {
      const res = await apiClient.patch("/api/users/me", payload);
      return updateResponseSchema.parse(res.data).user;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["auth", "me"], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}
