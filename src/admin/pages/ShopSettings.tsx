import { useAdminShop, useUpdateShop } from "../api/useAdminShop";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  name: z.string().min(1, "Required"),
  is_open: z.boolean().optional(),
  working_hours: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  min_order: z.coerce.number().nonnegative().optional(),
  delivery_fee: z.coerce.number().nonnegative().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ShopSettings() {
  const { data, isLoading, error } = useAdminShop();
  const update = useUpdateShop();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: data ?? undefined,
  });

  const onSubmit = async (payload: FormData) => {
    try {
      await update.mutateAsync(payload);
      alert("Settings saved");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      alert(message || "Failed");
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">Failed to load settings</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-amber-700">Shop Settings</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input className="border rounded w-full px-3 py-2" {...register("name")} />
          {errors.name && <p className="text-red-600 text-sm">{errors.name.message}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input id="is_open" type="checkbox" {...register("is_open")} />
          <label htmlFor="is_open">Open</label>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Working Hours</label>
          <input className="border rounded w-full px-3 py-2" {...register("working_hours")} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Address</label>
          <input className="border rounded w-full px-3 py-2" {...register("address")} />
        </div>
        <div>
          <label className="block text-sm mb-1">Phone</label>
          <input className="border rounded w-full px-3 py-2" {...register("phone")} />
        </div>
        <div>
          <label className="block text-sm mb-1">Min. Order</label>
          <input type="number" step="0.01" className="border rounded w-full px-3 py-2" {...register("min_order")} />
        </div>
        <div>
          <label className="block text-sm mb-1">Delivery Fee</label>
          <input type="number" step="0.01" className="border rounded w-full px-3 py-2" {...register("delivery_fee")} />
        </div>
        <div className="md:col-span-2">
          <button type="submit" disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded">Save</button>
        </div>
      </form>
    </div>
  );
}
