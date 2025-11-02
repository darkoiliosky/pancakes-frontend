import { useState } from "react";
import {
  useAdminModifierGroups,
  useCreateModifierGroup,
  useUpdateModifierGroup,
  useDeleteModifierGroup,
  useGroupOptions,
  useCreateGroupOption,
  useUpdateGroupOption,
  useDeleteGroupOption,
} from "../api/useAdminModifierGroups";

export default function ModifierGroups() {
  const { data: groups = [], isLoading } = useAdminModifierGroups();
  const createG = useCreateModifierGroup();
  const updateG = useUpdateModifierGroup();
  const deleteG = useDeleteModifierGroup();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", hint: "", min: 0, max: 0, sort: 0, active: true });

  const startCreate = () => {
    setEditingId(-1);
    setForm({ title: "", hint: "", min: 0, max: 0, sort: 0, active: true });
  };

  const startEdit = (g: any) => {
    setEditingId(g.id);
    setForm({ title: g.title, hint: g.hint || "", min: g.min_select || 0, max: g.max_select || 0, sort: g.sort_order || 0, active: !!g.is_active });
  };

  const save = async () => {
    if (!form.title.trim()) return;
    if (editingId === -1) {
      await createG.mutateAsync({ title: form.title.trim(), hint: form.hint || null, min_select: Number(form.min || 0), max_select: Number(form.max || 0), sort_order: Number(form.sort || 0), is_active: !!form.active });
    } else if (editingId && editingId > 0) {
      await updateG.mutateAsync({ id: editingId, title: form.title.trim(), hint: form.hint || null, min_select: Number(form.min || 0), max_select: Number(form.max || 0), sort_order: Number(form.sort || 0), is_active: !!form.active });
    }
    setEditingId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-amber-700">Modifier Groups</h1>
        <button className="px-3 py-2 rounded bg-amber-500 text-white" onClick={startCreate}>Create Group</button>
      </div>
      {isLoading ? (
        <div className="text-sm text-gray-600">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded border bg-white p-3">
            <h2 className="font-medium mb-2">All Groups</h2>
            <ul className="divide-y">
              {groups.map((g) => (
                <li key={g.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{g.title}</div>
                    <div className="text-xs text-gray-600">min {g.min_select} • {g.max_select === 0 ? "unlimited" : `max ${g.max_select}`} • {g.is_active ? "active" : "inactive"}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700 hover:bg-amber-200" onClick={() => startEdit(g)}>Edit</button>
                    <button className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200" onClick={() => deleteG.mutate(g.id)}>Delete</button>
                  </div>
                </li>
              ))}
              {groups.length === 0 && <li className="py-2 text-sm text-gray-500">No groups</li>}
            </ul>
          </div>
          <div className="rounded border bg-white p-3">
            <h2 className="font-medium mb-2">{editingId ? (editingId === -1 ? "Create Group" : "Edit Group") : "Select a group"}</h2>
            {editingId && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm">Title</label>
                  <input className="border rounded px-2 py-1 w-full" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm">Hint</label>
                  <input className="border rounded px-2 py-1 w-full" value={form.hint} onChange={(e) => setForm({ ...form, hint: e.target.value })} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm">Min</label>
                    <input type="number" className="border rounded px-2 py-1 w-full" value={form.min} onChange={(e) => setForm({ ...form, min: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-sm">Max (0 = unlimited)</label>
                    <input type="number" className="border rounded px-2 py-1 w-full" value={form.max} onChange={(e) => setForm({ ...form, max: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-sm">Sort</label>
                    <input type="number" className="border rounded px-2 py-1 w-full" value={form.sort} onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input id="gactive" type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                  <label htmlFor="gactive">Active</label>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded bg-amber-500 text-white" onClick={save}>{editingId === -1 ? "Create" : "Save"}</button>
                  <button className="px-3 py-1 rounded border" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
                {editingId > 0 && <GroupOptionsEditor groupId={editingId} />}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GroupOptionsEditor({ groupId }: { groupId: number }) {
  const { data: options = [], isLoading } = useGroupOptions(groupId);
  const createO = useCreateGroupOption(groupId);
  const updateO = useUpdateGroupOption(groupId);
  const deleteO = useDeleteGroupOption(groupId);
  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("");
  const [active, setActive] = useState(true);
  const [sort, setSort] = useState<number>(options.length);

  return (
    <div className="mt-4 border-t pt-3">
      <h3 className="font-medium mb-2">Options</h3>
      <div className="grid grid-cols-12 gap-2 items-end mb-3">
        <div className="col-span-6">
          <label className="block text-sm">Name</label>
          <input className="border rounded px-2 py-1 w-full" placeholder="e.g. Буковска" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm">Price (+)</label>
          <input type="number" className="border rounded px-2 py-1 w-full" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm">Sort</label>
          <input type="number" className="border rounded px-2 py-1 w-full" value={sort} onChange={(e) => setSort(Number(e.target.value || 0))} />
        </div>
        <label className="col-span-1 text-xs flex items-center gap-1">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active
        </label>
        <div className="col-span-1 text-right">
          <button className="px-3 py-2 rounded bg-amber-500 text-white" onClick={async () => {
            if (!name.trim()) return;
            await createO.mutateAsync({ name: name.trim(), price: Number(price || 0), sort_order: Number(sort || 0), is_active: active });
            setName(""); setPrice(""); setActive(true); setSort(options.length + 1);
          }}>Add</button>
        </div>
      </div>
      {isLoading ? (
        <div className="text-sm text-gray-600">Loading options...</div>
      ) : (
        <div className="rounded border overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-gray-600 bg-gray-50">
            <div className="col-span-6">Name</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-center">Active</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {options.length === 0 ? (
            <div className="px-3 py-3 text-sm text-gray-500">No options</div>
          ) : (
            options.map((o) => (
              <div key={o.id} className="grid grid-cols-12 gap-2 items-center px-3 py-2 border-t">
                <input
                  className="col-span-6 border rounded px-2 py-1 w-full"
                  defaultValue={o.name}
                  onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== o.name) updateO.mutate({ id: o.id, name: v }); }}
                />
                <input
                  type="number"
                  className="col-span-2 border rounded px-2 py-1 w-full text-right"
                  defaultValue={o.price}
                  onBlur={(e) => { const v = Number(e.target.value || 0); if (v !== o.price) updateO.mutate({ id: o.id, price: v }); }}
                />
                <div className="col-span-2 text-center">
                  <input type="checkbox" defaultChecked={o.is_active} onChange={(e) => updateO.mutate({ id: o.id, is_active: e.target.checked })} />
                </div>
                <div className="col-span-2 text-right">
                  <button className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200" onClick={() => deleteO.mutate(o.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
