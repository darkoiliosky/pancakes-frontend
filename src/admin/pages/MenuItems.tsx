import {
  useAdminMenuItems,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  type AdminMenuItem,
} from "../api/useAdminMenuItems";
import DataTable from "../components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative(),
  category: z.string().optional(),
  image: z.string().url().optional(),
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

  const columns: ColumnDef<AdminMenuItem>[] = useMemo(() => [
    { header: "ID", accessorKey: "id" },
    { header: "Name", accessorKey: "name" },
    { header: "Category", accessorKey: "category" },
    { header: "Price", cell: ({ row }) => `$${row.original.price.toFixed(2)}` },
    {
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700 hover:bg-amber-200" onClick={() => startEdit(row.original)}>Edit</button>
          <button className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200" onClick={() => deleteM.mutate({ id: row.original.id })}>Delete</button>
        </div>
      ),
    },
  ], [deleteM]);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (dataForm: FormData) => {
    if (editing) {
      await updateM.mutateAsync({ id: editing.id, ...dataForm });
    } else {
      await createM.mutateAsync({ ...dataForm });
    }
    reset({ name: "", description: "", price: 0, category: "", image: "" });
    setEditing(null);
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
  };

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
          <div className="mt-6 p-4 border rounded-xl bg-white max-w-xl">
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
                <label className="block text-sm mb-1">Image URL</label>
                <input className="border rounded w-full px-3 py-2" {...register("image")} />
                {errors.image && <p className="text-red-600 text-sm">{errors.image.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded">
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
