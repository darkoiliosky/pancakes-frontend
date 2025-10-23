import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import apiClient from "./client";

// Local Zod schemas for response validation
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.string().optional(),
  created_at: z.string().optional(),
  phone: z.string().optional(),
});

const userResponseSchema = z.object({ user: userSchema });

export type ApiUser = z.infer<typeof userSchema>;

async function fetchCurrentUser(): Promise<ApiUser | null> {
  try {
    const res = await apiClient.get("/api/auth/me");
    return userResponseSchema.parse(res.data).user;
  } catch {
    try {
      const res = await apiClient.get("/api/users/me");
      return userResponseSchema.parse(res.data).user;
    } catch {
      return null;
    }
  }
}

export function useUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchCurrentUser,
    staleTime: 1000 * 60, // 1 minute
  });
}
