import { useState } from "react";
import { useAdminDeliveries, type AdminDelivery } from "../api/useAdminDeliveries";
import DataTable from "../components/DataTable";
import { ColumnDef } from "@tanstack/react-table";

export default function Deliveries() {
  const [status, setStatus] = useState<string>("");
  const { data = [], isLoading, error } = useAdminDeliveries({ status });

  const columns: ColumnDef<AdminDelivery>[] = [
    { header: "ID", accessorKey: "id" },
    { header: "Order", accessorKey: "order_id" },
    { header: "Courier", cell: ({ row }) => row.original.courier?.name || row.original.courier?.email || "-" },
    { header: "Status", accessorKey: "status" },
    { header: "Created", accessorKey: "created_at" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-amber-700">Deliveries</h1>
      <div>
        <select className="border rounded px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option>Pending</option>
          <option>Accepted</option>
          <option>Delivering</option>
          <option>Delivered</option>
        </select>
      </div>
      {isLoading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">Failed to load deliveries</div>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
