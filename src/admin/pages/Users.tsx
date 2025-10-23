import DataTable from "../components/DataTable";
import {
  useAdminUsers,
  type AdminUser,
  useDeactivateUser,
  useInviteCourier,
} from "../api/useAdminUsers";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const inviteSchema = z.object({ email: z.string().email() });
type InviteForm = z.infer<typeof inviteSchema>;

export default function Users() {
  const { data = [], isLoading, error } = useAdminUsers();
  const deactivate = useDeactivateUser();
  const invite = useInviteCourier();
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "courier" | "customer">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return data.filter((u) => (roleFilter === "all" ? true : u.role === roleFilter));
  }, [data, roleFilter]);

  const columns: ColumnDef<AdminUser>[] = useMemo(
    () => [
      { header: "ID", accessorKey: "id" },
      { header: "Name", accessorKey: "name" },
      { header: "Email", accessorKey: "email" },
      { header: "Role", accessorKey: "role" },
      {
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
              onClick={() => deactivate.mutate(row.original.id)}
            >
              Deactivate
            </button>
          </div>
        ),
      },
    ],
    [deactivate]
  );

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
  });

  const onInvite = async (data: InviteForm) => {
    try {
      await invite.mutateAsync(data);
      reset();
      alert("Invitation sent (if supported by backend)");
    } catch (e: any) {
      alert(e?.message || "Failed to invite");
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">Failed to load users</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-700">Users</h1>
        <form onSubmit={handleSubmit(onInvite)} className="flex items-center gap-2">
          <input
            type="email"
            placeholder="Invite courier by email"
            className="border rounded px-3 py-2"
            {...register("email")}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded"
          >
            Invite
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded border overflow-hidden">
          {(["all", "admin", "courier", "customer"] as const).map((r) => (
            <button
              key={r}
              className={`px-3 py-1 text-sm ${roleFilter === r ? "bg-amber-500 text-white" : "bg-white"}`}
              onClick={() => setRoleFilter(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search name/email"
          className="border rounded px-3 py-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered.filter((u) =>
          (u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase()))
        )}
        globalFilter={search}
      />
    </div>
  );
}
