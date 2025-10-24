import { useAdminShop, useUpdateShop } from "../api/useAdminShop";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Switch } from "../../components/ui/switch";

const schema = z.object({
  name: z.string().min(1, "Required"),
  is_open: z.boolean().optional(),
  working_hours: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  min_order: z.coerce.number().nonnegative().optional(),
  delivery_fee: z.coerce.number().nonnegative().optional(),
  currency: z.string().min(1).optional(),
  pickup_only: z.boolean().optional(),
  maintenance_message: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal("")),
  tax_rate: z.coerce.number().nonnegative().optional(),
  working_hours_json: z.string().optional(),
  closed_until: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ShopSettings() {
  const { data, isLoading, error } = useAdminShop();
  const update = useUpdateShop();
  const [saved, setSaved] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      is_open: true,
      working_hours: "",
      address: "",
      phone: "",
      min_order: 0,
      delivery_fee: 0,
      currency: "$",
      pickup_only: false,
      maintenance_message: "",
      logo_url: "",
      tax_rate: 0,
      working_hours_json: "",
      closed_until: "",
    },
  });

  useEffect(() => {
    if (!data) return;
    const clean: FormData = {
      name: data.name || "",
      is_open: Boolean(data.is_open),
      working_hours: data.working_hours || "",
      address: data.address || "",
      phone: data.phone || "",
      min_order: Number(data.min_order || 0),
      delivery_fee: Number(data.delivery_fee || 0),
      currency: data.currency || "$",
      pickup_only: Boolean(data.pickup_only),
      maintenance_message: (data.maintenance_message as any) ?? "",
      logo_url: (data.logo_url as any) ?? "",
      tax_rate: Number(data.tax_rate || 0),
      working_hours_json:
        typeof data.working_hours_json === "string"
          ? (data.working_hours_json as any)
          : data.working_hours_json
            ? JSON.stringify(data.working_hours_json)
            : "",
      closed_until: (data.closed_until as any) ?? "",
    };
    reset(clean);
  }, [data, reset]);

  const onSubmit = async (payload: FormData) => {
    try {
      const body: any = { ...payload };
      if (!body.logo_url) body.logo_url = null;
      if (!body.maintenance_message) body.maintenance_message = null;
      if (body.working_hours_json) {
        try {
          body.working_hours_json = JSON.parse(body.working_hours_json);
        } catch {
          // keep as string or drop if invalid JSON
        }
      }
      if (!body.closed_until) body.closed_until = null;
      await update.mutateAsync(body);
      alert("Settings saved");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      alert(message || "Failed");
    }
  };

  if (isLoading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  if (error) return <div className="text-red-600">Failed to load settings</div>;

  return (
    <div className="min-h-[80vh] bg-gray-50">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">Shop Settings</h1>
            <p className="text-sm text-gray-500">
              Manage your shop’s basic information and ordering preferences.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-5xl mx-auto px-4 py-6 space-y-8"
      >
        {/* Shop Info */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <div className="text-lg font-semibold">🏪 Shop Info</div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Name
                </label>
                <input
                  className="border border-gray-200 rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-amber-300 outline-none"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-red-600 text-sm">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Logo URL
                </label>
                <input
                  className="border border-gray-200 rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-amber-300 outline-none"
                  placeholder="https://..."
                  {...register("logo_url")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Address
                </label>
                <input
                  className="border border-gray-200 rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-amber-300 outline-none"
                  {...register("address")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Phone
                </label>
                <input
                  className="border border-gray-200 rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-amber-300 outline-none"
                  {...register("phone")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="border-t border-gray-200" />

        {/* Availability */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <div className="text-lg font-semibold">🕒 Availability</div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between md:justify-start gap-3">
                <Controller
                  name="is_open"
                  control={control}
                  render={({ field }) => (
                    <>
                      <label
                        htmlFor="is_open"
                        className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                        onClick={() => field.onChange(!field.value)}
                      >
                        Open
                      </label>
                      <Switch
                        id="is_open"
                        checked={!!field.value}
                        onCheckedChange={(v) => field.onChange(v)}
                      />
                    </>
                  )}
                />
              </div>
              <div className="flex items-center justify-between md:justify-start gap-3">
                <Controller
                  name="pickup_only"
                  control={control}
                  render={({ field }) => (
                    <>
                      <label
                        htmlFor="pickup_only"
                        className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                        onClick={() => field.onChange(!field.value)}
                      >
                        Pickup only
                      </label>
                      <Switch
                        id="pickup_only"
                        checked={!!field.value}
                        onCheckedChange={(v) => field.onChange(v)}
                      />
                    </>
                  )}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Working Hours
                </label>
                <input
                  className="border border-gray-200 rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-amber-300 outline-none"
                  {...register("working_hours")}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Working hours (JSON)
                </label>
                <textarea
                  className="border border-gray-200 rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-amber-300 outline-none"
                  placeholder='{"mon":"08-22", "tue":"08-22"}'
                  {...register("working_hours_json")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Closed until
                </label>
                <input
                  type="datetime-local"
                  className="border border-gray-200 rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-amber-300 outline-none"
                  {...register("closed_until")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="border-t border-gray-200" />

        {/* Ordering Rules */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <div className="text-lg font-semibold">💰 Ordering Rules</div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min. Order
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="border border-gray-200 rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-amber-300 outline-none"
                  {...register("min_order")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Fee
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="border border-gray-200 rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-amber-300 outline-none"
                  {...register("delivery_fee")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="border border-gray-200 rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-amber-300 outline-none"
                  {...register("tax_rate")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <input
                  className="border border-gray-200 rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-amber-300 outline-none"
                  placeholder="$"
                  {...register("currency")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="border-t border-gray-200" />

        {/* Other */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <div className="text-lg font-semibold">⚙️ Other</div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maintenance message
                </label>
                <textarea
                  className="border border-gray-200 rounded-lg w-full px-3 py-2 focus:ring-2 focus:ring-amber-300 outline-none"
                  {...register("maintenance_message")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="transition-colors float-right mt-4 px-5 py-2 rounded-lg"
          >
            {" "}
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </span>
            ) : (
              "Save"
            )}
          </Button>
        </div>

        <p className="text-xs text-gray-500">
          Changes are saved instantly to your database.
        </p>
      </form>

      {saved && (
        <div className="fixed bottom-4 right-4 bg-white border shadow-lg rounded-lg px-4 py-2 text-sm">
          ✅ Settings saved successfully
        </div>
      )}
    </div>
  );
}
