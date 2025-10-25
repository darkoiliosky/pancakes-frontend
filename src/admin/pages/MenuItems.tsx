import {
  useAdminMenuItems,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  type AdminMenuItem,
} from "../api/useAdminMenuItems";
import DataTable from "../components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Switch } from "../../components/ui/switch";
import { moneyFormat } from "../../utils/format";
import MenuItemModifiers from "../components/MenuItemModifiers";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative(),
  category: z.string().optional(),
  image: z.string().optional(),
  stock: z.coerce.number().int().min(0).nullable().optional(),
});
type FormData = z.infer<typeof schema>;

export default function MenuItems() {
  const [category, setCategory] = useState<string>("");
  const [available, setAvailable] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const { data: items = [], isLoading, error } = useAdminMenuItems({ category, available, q });
  const createM = useCreateMenuItem();
  const updateM = useUpdateMenuItem();
  const deleteM = useDeleteMenuItem();
  const [editing, setEditing] = useState<AdminMenuItem | null>(null);
  const [imageBase64, setImageBase64] = useState<string>("");
  const [params] = useSearchParams();
  const formRef = useRef<HTMLDivElement | null>(null);

  const columns: ColumnDef<AdminMenuItem>[] = useMemo(() => [
    { header: "ID", accessorKey: "id" },
    {
      header: "Image",
      cell: ({ row }) => (
        row.original.image_url ? (
          <img src={row.original.image_url} alt={row.original.name} className="h-10 w-10 object-cover rounded" />
        ) : (
          <span className="text-xs text-gray-500">—</span>
        )
      ),
    },
    { header: "Name", accessorKey: "name" },
    { header: "Category", accessorKey: "category" },
    { header: "Price", cell: ({ row }) => moneyFormat(row.original.price) },
    {
      header: "Available",
      cell: ({ row }) => {
        const isOn = row.original.available !== false;
        return (
          <div className="inline-flex items-center gap-2 text-xs">
            <Switch
              checked={isOn}
              aria-label="Toggle availability"
              onCheckedChange={async (checked) => {
                try {
                  await updateM.mutateAsync({ id: row.original.id, name: row.original.name, price: row.original.price, available: checked });
                } catch (_) {}
              }}
            />
            <span className={isOn ? "text-green-700" : "text-gray-500"}>{isOn ? "On" : "Off"}</span>
          </div>
        );
      },
    },
    {
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700 hover:bg-amber-200" onClick={() => startEdit(row.original)}>Edit</button>
          <button className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200" onClick={() => deleteM.mutate({ id: row.original.id })}>Delete</button>
        </div>
      ),
    },
  ], [deleteM, updateM]);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (dataForm: FormData) => {
    if (editing) {
      await updateM.mutateAsync({ id: editing.id, ...dataForm, image_base64: imageBase64 || undefined });
    } else {
      await createM.mutateAsync({ ...dataForm, image_base64: imageBase64 || undefined });
    }
    reset({ name: "", description: "", price: 0, category: "", image: "", stock: null as any });
    setEditing(null);
    setImageBase64("");
  };

  const startCreate = () => {
    setEditing(null);
    reset({ name: "", description: "", price: 0, category: "", image: "" });
  };

  const startEdit = (i: AdminMenuItem) => {
    setEditing(i);
    setValue("name", i.name);
    setValue("description", i.description || "");
    setValue("price", i.price);
    setValue("category", i.category || "");
    setValue("image", i.image_url || "");
    setValue("stock", (typeof (i as any).stock === 'number' ? (i as any).stock : null) as any);
    setImageBase64("");
    // focus form and scroll into view
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  };

  // Deep-link edit: /admin/menu-items?edit=<id>
  useEffect(() => {
    if (!items || items.length === 0) return;
    const eid = Number(params.get("edit"));
    if (!eid || Number.isNaN(eid)) return;
    const found = items.find((it) => it.id === eid);
    if (found) startEdit(found);
  }, [items, params]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-amber-700">Menu Items</h1>

      <div className="flex flex-wrap items-center gap-3">
        <input className="border rounded px-3 py-2" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
        <select className="border rounded px-3 py-2" value={available} onChange={(e) => setAvailable(e.target.value)}>
          <option value="">All</option>
          <option value="true">Available</option>
          <option value="false">Unavailable</option>
        </select>
        <button onClick={startCreate} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded">
          Add Item
        </button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">Failed to load menu</div>
      ) : (
        <>
          <DataTable columns={columns} data={items} />
      <div ref={formRef} className="mt-6 p-4 border rounded-xl bg-white max-w-3xl">
        <h2 className="font-semibold mb-3">{editing ? "Edit Item" : "Create Item"}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input className="border rounded w-full px-3 py-2" {...register("name")} />
                {errors.name && <p className="text-red-600 text-sm">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm mb-1">Description</label>
                <textarea className="border rounded w-full px-3 py-2" {...register("description")} />
              </div>
              <div>
                <label className="block text-sm mb-1">Price</label>
                <input type="number" step="0.01" className="border rounded w-full px-3 py-2" {...register("price")} />
                {errors.price && <p className="text-red-600 text-sm">{errors.price.message}</p>}
              </div>
          <div>
            <label className="block text-sm mb-1">Category</label>
            <input className="border rounded w-full px-3 py-2" {...register("category")} />
          </div>
          <div>
            <label className="block text-sm mb-1">Stock (optional)</label>
            <input type="number" min={0} className="border rounded w-full px-3 py-2" {...register("stock", { valueAsNumber: true })} />
            {errors.stock && <p className="text-red-600 text-sm">{String(errors.stock.message)}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">Image URL</label>
            <input className="border rounded w-full px-3 py-2" placeholder="https://..." {...register("image")} />
            {errors.image && <p className="text-red-600 text-sm">{errors.image.message}</p>}
          </div>
              <div>
                <label className="block text-sm mb-1">Or Upload Image</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  className="w-full"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) { setImageBase64(""); return; }
                    if (file.size > 5 * 1024 * 1024) { alert("Max 5MB"); return; }
                    const reader = new FileReader();
                    reader.onload = () => {
                      const result = String(reader.result || "");
                      setImageBase64(result);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                {imageBase64 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-600 mb-1">Preview:</div>
                    <img src={imageBase64} alt="preview" className="h-24 rounded border" />
                  </div>
                )}
              </div>
              <button type="submit" disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded">
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            </form>
            {editing && (
              <MenuItemModifiers menuItemId={editing.id} basePrice={editing.price} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
