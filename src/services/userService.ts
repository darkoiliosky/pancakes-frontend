// src/services/userService.ts
import api from "./api";
import { User } from "../types/user";

/**
 * ✅ Земa тековен најавен корисник.
 * Прво пробува /api/auth/me (cookie-based), ако не постои — fallback на /api/users/me.
 */
export const fetchMe = async (): Promise<User> => {
  try {
    const res = await api.get("/api/auth/me", { withCredentials: true });
    return res.data.user as User;
  } catch {
    const res = await api.get("/api/users/me", { withCredentials: true });
    return res.data.user as User;
  }
};

/**
 * ✅ Ажурира профил (име, телефон) на најавениот корисник.
 * Бекенд рута: PATCH /api/users/me
 */
export const updateProfile = async (payload: {
  name: string;
  phone?: string;
}): Promise<User> => {
  const res = await api.patch("/api/users/me", payload, {
    withCredentials: true,
  });
  return res.data.user as User;
};
