import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import apiClient from "../../api/client";

const courierSchema = z.object({ id: z.number(), name: z.string().optional(), email: z.string().optional(), role: z.string().optional() });
const listSchema = z.object({ users: z.array(courierSchema) });

export type AdminCourier = z.infer<typeof courierSchema>;

async function fetchCouriers(): Promise<AdminCourier[]> {
  const res = await apiClient.get("/api/admin/users", { params: { role: "courier" } });
  return listSchema.parse(res.data).users;
}

export function useCouriers() {
  return useQuery({ queryKey: ["admin", "couriers"], queryFn: fetchCouriers, staleTime: 60_000 });
}

