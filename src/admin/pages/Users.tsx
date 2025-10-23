import DataTable from "../components/DataTable";
import {
  useAdminUsers,
  type AdminUser,
  useDeactivateUser,
  useActivateUser,
  useInviteCourier,
} from "../api/useAdminUsers";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const inviteSchema = z.object({ email: z.string().email() });
type InviteForm = z.infer<typeof inviteSchema>;

export default function Users() {
  const { data = [], isLoading, error } = useAdminUsers();
  const deactivate = useDeactivateUser();
  const activate = useActivateUser();
  const invite = useInviteCourier();
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "courier" | "customer">("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [inviteOk, setInviteOk] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = useMemo(() => {
    const roleMatch = (u: AdminUser) => (roleFilter === "all" ? true : (u.role as string) === roleFilter);
    const text = debounced.trim().toLowerCase();
    const textMatch = (u: AdminUser) =>
      !text || (u.name?.toLowerCase().includes(text) || u.email?.toLowerCase().includes(text));
    return data.filter((u) => roleMatch(u) && textMatch(u));
  }, [data, roleFilter, debounced]);

  const roleChip = (role?: string) => {
    const r = (role || "customer").toLowerCase();
    const map: Record<string, { icon: string; cls: string; label: string }> = {
      admin: { icon: "👑", cls: "text-purple-600", label: "admin" },
      courier: { icon: "🚚", cls: "text-blue-600", label: "courier" },
      customer: { icon: "👤", cls: "text-green-600", label: "customer" },
    };
    const d = map[r] || map.customer;
    return (
      <span className={`inline-flex items-center gap-1 ${d.cls}`}>
        <span>{d.icon}</span>
        <span className="capitalize">{d.label}</span>
      </span>
    );
  };

  const statusBadge = (inactive: boolean) => (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block w-2 h-2 rounded-full ${inactive ? "bg-red-500" : "bg-green-500"}`} />
      <span className="text-sm">{inactive ? "Inactive" : "Active"}</span>
    </span>
  );

  const columns: ColumnDef<AdminUser>[] = useMemo(
    () => [
      { header: "ID", accessorKey: "id" },
      { header: "Name", accessorKey: "name" },
      { header: "Email", accessorKey: "email" },
      { header: "Role", cell: ({ row }) => roleChip(row.original.role as string) },
      { header: "Status", cell: ({ row }) => statusBadge(!!row.original.inactivated_at) },
      {
        header: "Actions",
        cell: ({ row }) => {
          const inactive = !!row.original.inactivated_at;
          const onToggle = async () => {
            const ok = window.confirm(`${inactive ? "Activate" : "Deactivate"} this user?`);
            if (!ok) return;
            if (inactive) activate.mutate(row.original.id);
            else deactivate.mutate(row.original.id);
          };
          return (
            <div className="flex gap-2">
              <button
                title={inactive ? "Activate" : "Deactivate"}
                className={`px-2 py-1 text-xs rounded ${
                  inactive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
                onClick={onToggle}
              >
                {inactive ? "Activate" : "Deactivate"}
              </button>
            </div>
          );
        },
      },
    ],
    [activate, deactivate]
  );

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
  });

  const onInvite = async (data: InviteForm) => {
    try {
      await invite.mutateAsync(data);
      reset();
      setInviteOk(true);
      setTimeout(() => setInviteOk(false), 2000);
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
        <form onSubmit={handleSubmit(onInvite)} className="relative flex items-center gap-2 p-2 border rounded-xl bg-white shadow-sm">
          <span className="absolute left-3 text-gray-500">✉️</span>
          <input
            type="email"
            placeholder="Invite courier by email"
            className="border rounded px-3 py-2 pl-8"
            {...register("email")}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded"
          >
            Invite
          </button>
          {inviteOk && <span className="text-green-600 text-sm ml-2">Invitation sent!</span>}
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          className="border rounded px-3 py-2"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as any)}
        >
          <option value="all">All roles</option>
          <option value="admin">👑 admin</option>
          <option value="courier">🚚 courier</option>
          <option value="customer">👤 customer</option>
        </select>
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
