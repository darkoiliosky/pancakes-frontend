import api from "./api";
import { User } from "../types/user";

export const fetchMe = async (): Promise<User> => {
  const res = await api.get("/api/users/me");
  return res.data.user;
};
