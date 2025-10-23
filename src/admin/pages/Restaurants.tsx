import { useAdminRestaurants, useCreateRestaurant, useUpdateRestaurant, useDeleteRestaurant, type AdminRestaurant } from "../api/useAdminRestaurants";
import DataTable from "../components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({ name: z.string().min(1), cuisine: z.string().optional(), is_open: z.boolean().optional() });
type FormData = z.infer<typeof schema>;

export default function Restaurants() {
  const { data = [], isLoading, error } = useAdminRestaurants();
  const createM = useCreateRestaurant();
  const updateM = useUpdateRestaurant();
  const deleteM = useDeleteRestaurant();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminRestaurant | null>(null);

  const columns: ColumnDef<AdminRestaurant>[] = useMemo(() => [
    { header: "ID", accessorKey: "id" },
    { header: "Name", accessorKey: "name" },
    { header: "Cuisine", accessorKey: "cuisine" },
    { header: "Open", cell: ({ row }) => (row.original.is_open ? "Yes" : "No") },
    {
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700 hover:bg-amber-200" onClick={() => setEditing(row.original)}>Edit</button>
          <button className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200" onClick={() => deleteM.mutate(row.original.id)}>Delete</button>
        </div>
      ),
    },
  ], [deleteM]);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (dataForm: FormData) => {
    if (editing) {
      await updateM.mutateAsync({ id: editing.id, ...dataForm });
    } else {
      await createM.mutateAsync(dataForm);
    }
    reset({ name: "", cuisine: "", is_open: true });
    setEditing(null);
  };

  const startCreate = () => {
    setEditing(null);
    reset({ name: "", cuisine: "", is_open: true });
  };

  const startEdit = (r: AdminRestaurant) => {
    setEditing(r);
    setValue("name", r.name);
    setValue("cuisine", r.cuisine || "");
    setValue("is_open", Boolean(r.is_open));
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">Failed to load restaurants</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-700">Restaurants</h1>
        <button onClick={startCreate} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded">Add Restaurant</button>
      </div>

      <div className="flex items-center gap-3">
        <input className="border rounded px-3 py-2" placeholder="Search by name or cuisine" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <DataTable
        columns={columns}
        data={data.filter((r) => (r.name + " " + (r.cuisine || "")).toLowerCase().includes(search.toLowerCase()))}
        globalFilter={search}
      />

      <div className="mt-6 p-4 border rounded-xl bg-white max-w-xl">
        <h2 className="font-semibold mb-3">{editing ? "Edit Restaurant" : "Create Restaurant"}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input className="border rounded w-full px-3 py-2" {...register("name")} />
            {errors.name && <p className="text-red-600 text-sm">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">Cuisine</label>
            <input className="border rounded w-full px-3 py-2" {...register("cuisine")} />
          </div>
          <div className="flex items-center gap-2">
            <input id="is_open" type="checkbox" {...register("is_open")} />
            <label htmlFor="is_open">Open</label>
          </div>
          <button type="submit" disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded">
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
