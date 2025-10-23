import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import apiClient from "./client";

// Colocated payload + response schemas
export const forgotPasswordPayloadSchema = z.object({
  email: z.string().email(),
});
export type ForgotPasswordData = z.infer<typeof forgotPasswordPayloadSchema>;

const messageSchema = z.object({ message: z.string() });

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (payload: ForgotPasswordData) => {
      const parsed = forgotPasswordPayloadSchema.parse(payload);
      const res = await apiClient.post("/api/auth/forgot-password", parsed);
      return messageSchema.parse(res.data);
    },
  });
}

export const resetPasswordPayloadSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});
export type ResetPasswordData = z.infer<typeof resetPasswordPayloadSchema>;

export function useResetPassword() {
  return useMutation({
    mutationFn: async (payload: ResetPasswordData) => {
      const parsed = resetPasswordPayloadSchema.parse(payload);
      const { token, password } = parsed;
      const res = await apiClient.post(`/api/auth/reset-password/${token}`, {
        password,
      });
      return messageSchema.parse(res.data);
    },
  });
}

