import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import apiClient from "../../api/client";

// Client payload: items with item_id and quantity only. Pricing is server-side.
export const placeOrderItemSchema = z.object({
  item_id: z.number(),
  quantity: z.number().int().positive(),
});

export const placeOrderPayloadSchema = z.object({
  items: z.array(placeOrderItemSchema).nonempty(),
});

const placeOrderResponseSchema = z.object({
  message: z.string().optional(),
  order: z.any().optional(),
});

export type PlaceOrderItem = z.infer<typeof placeOrderItemSchema>;

export function usePlaceOrder() {
  return useMutation({
    mutationFn: async (payload: { items: PlaceOrderItem[] }) => {
      const body = placeOrderPayloadSchema.parse(payload);
      const res = await apiClient.post("/api/orders", body);
      return placeOrderResponseSchema.parse(res.data);
    },
  });
}

