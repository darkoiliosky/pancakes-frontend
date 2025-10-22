// src/services/authService.ts
import api from "./api";
import {
  LoginData,
  RegisterData,
  AuthResponse,
  RegisterResponse,
} from "../types/auth";

export const registerUser = async (
  data: RegisterData
): Promise<RegisterResponse> => {
  const res = await api.post("/api/users/register", data);
  return res.data;
};

export const loginUser = async (data: LoginData): Promise<AuthResponse> => {
  const res = await api.post("/api/users/login", data);
  return res.data;
};

export const logoutUser = async (): Promise<void> => {
  await api.post("/api/users/logout");
};

export const getCurrentUser = async (): Promise<AuthResponse> => {
  const res = await api.get("/api/users/me");
  return res.data;
};
