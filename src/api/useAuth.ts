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

const authResponseSchema = z.object({
  token: z.string().optional(),
  user: userSchema,
});

const registerResponseSchema = z.object({
  message: z.string(),
  user: userSchema.optional(),
});

// Payload schemas (colocated)
export const loginPayloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginData = z.infer<typeof loginPayloadSchema>;

export const registerPayloadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
  phone: z.string().min(1),
});
export type RegisterData = z.infer<typeof registerPayloadSchema>;

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await apiClient.post("/api/users/login", data);
      return authResponseSchema.parse(res.data);
    },
    onSuccess: (data) => {
      const user = data.user;
      queryClient.setQueryData(["auth", "me"], user);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await apiClient.post("/api/users/register", data);
      return registerResponseSchema.parse(res.data);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      await apiClient.post("/api/users/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}
