import { useAdminShop, useUpdateShop } from "../api/useAdminShop";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "../../context/ToastContext";
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
  const toast = useToast();
  
  const days = useMemo(() => ([
    { key: "mon", label: "Monday" },
    { key: "tue", label: "Tuesday" },
    { key: "wed", label: "Wednesday" },
    { key: "thu", label: "Thursday" },
    { key: "fri", label: "Friday" },
    { key: "sat", label: "Saturday" },
    { key: "sun", label: "Sunday" },
  ] as const), []);
  type DayKey = typeof days[number]["key"];
  type Daily = { open: string; close: string; closed: boolean };
  const [schedule, setSchedule] = useState<Record<DayKey, Daily>>({
    mon: { open: "08:00", close: "22:00", closed: false },
    tue: { open: "08:00", close: "22:00", closed: false },
    wed: { open: "08:00", close: "22:00", closed: false },
    thu: { open: "08:00", close: "22:00", closed: false },
    fri: { open: "08:00", close: "22:00", closed: false },
    sat: { open: "08:00", close: "22:00", closed: false },
    sun: { open: "08:00", close: "22:00", closed: false },
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
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
      closed_until:
        (data.closed_until as any)
          ? new Date(data.closed_until as any).toISOString().slice(0, 16)
          : "",
    };
    reset(clean);
    // Initialize schedule from working_hours_json
    try {
      const wh = (data as any).working_hours_json;
      const obj = typeof wh === "string" && wh.trim() ? JSON.parse(wh) : (typeof wh === "object" ? wh : null);
      if (obj && typeof obj === "object") {
        const next: any = { ...schedule };
        (Object.keys(next) as DayKey[]).forEach((k) => {
          const v = (obj as any)[k];
          if (typeof v === 'string' && v.trim().toLowerCase() === 'closed') {
            next[k] = { ...next[k], closed: true };
            return;
          }
          if (!v) { next[k] = { ...next[k], closed: true }; return; }
          const s = String(v);
          const [op, cl] = s.split("-");
          const norm = (t: string) => (t.includes(":") ? t : `${t.padStart(2,"0")}:00`).slice(0,5);
          next[k] = { open: op ? norm(op) : next[k].open, close: cl ? norm(cl) : next[k].close, closed: false };
        });
        setSchedule(next);
      }
    } catch {}
  }, [data, reset]);

  // keep hidden JSON synced
  useEffect(() => {
    const toJson: any = {};
    (Object.keys(schedule) as DayKey[]).forEach((k) => {
      const d = schedule[k];
      toJson[k] = d.closed ? 'closed' : `${d.open}-${d.close}`;
    });
    const el = document.querySelector('input[name="working_hours_json"]') as HTMLInputElement | null;
    if (el) el.value = Object.keys(toJson).length ? JSON.stringify(toJson) : "";
  }, [schedule]);

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
      if (body.closed_until && typeof body.closed_until === 'string' && body.closed_until.trim().length > 0) {
        try {
          body.closed_until = new Date(body.closed_until).toISOString();
        } catch {
          // if parsing fails, send null to avoid invalid format
          body.closed_until = null;
        }
      } else {
        body.closed_until = null;
      }
      await update.mutateAsync(body);
      toast.success("Settings saved");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error(message || "Failed");
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
              Manage your shop's basic information and ordering preferences.
            </p>
          </div>
        </div>
      </div>

      {/* Maintenance preview */}
      {(() => {
        const msg = ((typeof watch === 'function' ? (watch("maintenance_message") as any) : "") || "").toString();
        if (!msg) return null;
        return (
          <div className="max-w-5xl mx-auto px-4 pt-4">
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-900 px-4 py-2 text-sm">
              <b>Maintenance (preview):</b> {msg}
            </div>
          </div>
        );
      })()}

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
                <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours</label>
                <div className="rounded-lg border">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3">
                    {days.map(({ key, label }) => {
                      const d = schedule[key];
                      const invalid = !d.closed && d.open === d.close; // same time is invalid; overnight (close < open) is allowed
                      return (
                        <div key={key} className="flex items-center justify-between gap-3 p-2 rounded hover:bg-amber-50">
                          <div className="min-w-[90px] text-sm font-medium text-gray-800">{label}</div>
                          <label className="text-xs flex items-center gap-1 mr-2">
                            <input type="checkbox" checked={d.closed} onChange={(e) => setSchedule((s) => ({ ...s, [key]: { ...s[key], closed: e.target.checked } }))} /> Closed
                          </label>
                          <div className="flex items-center gap-2">
                            <input type="time" className="border rounded px-2 py-1 text-sm" value={d.open} disabled={d.closed} onChange={(e) => setSchedule((s) => ({ ...s, [key]: { ...s[key], open: e.target.value } }))} />
                            <span className="text-gray-500">-</span>
                            <input type="time" className="border rounded px-2 py-1 text-sm" value={d.close} disabled={d.closed} onChange={(e) => setSchedule((s) => ({ ...s, [key]: { ...s[key], close: e.target.value } }))} />
                          </div>
                          {invalid && <div className="text-[11px] text-red-600">Open and Close cannot be equal</div>}
                          {!invalid && !d.closed && d.open > d.close && (
                            <div className="text-[11px] text-gray-600">Overnight: spans past midnight</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <input type="hidden" {...register("working_hours_json")} />
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
                  placeholder="MKD"
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

      {/* saved banner removed; using toasts */}
    </div>
  );
}

