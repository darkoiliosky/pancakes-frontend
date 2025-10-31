import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type Table,
  type SortingState,
} from "@tanstack/react-table";
import { useEffect } from "react";

type Props<T extends object> = {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  globalFilter?: string;
  onGlobalFilterChange?: (v: string) => void;
  onTableReady?: (table: Table<T>) => void;
  sorting?: SortingState;
  onSortingChange?: (updater: SortingState) => void;
  manualSort?: boolean;
};

export default function DataTable<T extends object>({
  columns,
  data,
  globalFilter,
  onTableReady,
  sorting,
  onSortingChange,
  manualSort,
}: Props<T>) {
  const table = useReactTable({
    columns,
    data,
    state: { globalFilter, sorting },
    manualSorting: !!manualSort,
    onSortingChange: (updater) => {
      onSortingChange?.(
        typeof updater === "function"
          ? updater(table.getState().sorting)
          : updater
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSort ? undefined : getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  useEffect(() => {
    onTableReady?.(table);
  }, [table, onTableReady]);
  return (
    <div className="overflow-x-auto border rounded-xl bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-[#f8f8f8] text-gray-900">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-3 py-2 text-left font-semibold select-none first:rounded-l-lg last:rounded-r-lg"
                >
                  <div
                    className={
                      header.column.getCanSort() ? "cursor-pointer" : ""
                    }
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {{ asc: " ▲", desc: " ▼" }[
                      header.column.getIsSorted() as string
                    ] ?? null}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="even:bg-amber-50/20 hover:bg-amber-50 transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
