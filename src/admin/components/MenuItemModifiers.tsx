import { useState } from "react";
import { useAdminModifiers, useCreateModifier, useDeleteModifier, useUpdateModifier } from "../api/useAdminModifiers";
import InlineError from "../../components/ui/InlineError";
import { parseAxiosError } from "../../api/errors";
import { moneyFormat } from "../../utils/format";

function toTwoDecimals(n: number) {
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

export default function MenuItemModifiers({ menuItemId, basePrice }: { menuItemId: number; basePrice: number }) {
  const { data: list = [], isLoading, error } = useAdminModifiers(menuItemId);
  const createM = useCreateModifier(menuItemId);
  const updateM = useUpdateModifier(menuItemId);
  const deleteM = useDeleteModifier(menuItemId);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState<string>("");
  const [addError, setAddError] = useState<string>("");
  const [editError, setEditError] = useState<string>("");

  const startEdit = (id: number, name: string, price: number) => {
    setEditingId(id);
    setEditName(name);
    setEditPrice(String(price));
  };
  const stopEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditPrice("");
  };

  const add = async () => {
    setAddError("");
    const nm = newName.trim();
    if (!nm) { setAddError("Name is required"); return; }
    const raw = newPrice === "" ? 0 : Number(newPrice);
    if (!Number.isFinite(raw)) { setAddError("Invalid price"); return; }
    if (raw < 0) { setAddError("Price cannot be negative"); return; }
    const price = toTwoDecimals(raw);
    try {
      await createM.mutateAsync({ name: nm, price_delta: price });
      setNewName("");
      setNewPrice("");
    } catch (e: any) {
      setAddError(parseAxiosError(e));
    }
  };
  const save = async (id: number) => {
    setEditError("");
    const payload: any = {};
    if (editName.trim() !== "") payload.name = editName.trim();
    if (editPrice !== "") {
      const raw = Number(editPrice);
      if (!Number.isFinite(raw)) { setEditError("Invalid price"); return; }
      if (raw < 0) { setEditError("Price cannot be negative"); return; }
      payload.price_delta = toTwoDecimals(raw);
    }
    try {
      await updateM.mutateAsync({ id, ...payload });
      stopEdit();
    } catch (e: any) {
      setEditError(parseAxiosError(e));
    }
  };

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="font-semibold text-amber-700 mb-2">Modifiers</h3>
      {isLoading ? (
        <div className="text-sm text-gray-600">Loading modifiers...</div>
      ) : error ? (
        <div className="text-sm text-red-600">Failed to load modifiers</div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2 items-end">
            <div className="grow">
              <label className="block text-sm mb-1">Name</label>
              <input className="border rounded w-full px-3 py-2" placeholder="e.g. Extra Syrup" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Price (+)</label>
              <input type="number" step="0.01" min="0" className="border rounded px-3 py-2 w-28" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
            </div>
            <button className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded" onClick={add} disabled={createM.isPending}>
              {createM.isPending ? "Adding..." : "Add"}
            </button>
          </div>
          {addError && <InlineError>{addError}</InlineError>}

          <ul className="divide-y rounded border">
            {list.length === 0 && <li className="p-3 text-sm text-gray-500">No modifiers yet.</li>}
            {list.map((m) => (
              <li key={m.id} className="p-3 flex items-center gap-3">
                {editingId === m.id ? (
                  <>
                    <input className="border rounded px-2 py-1 grow" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    <input type="number" step="0.01" min="0" className="border rounded px-2 py-1 w-28" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                    <button className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700 hover:bg-amber-200" onClick={() => save(m.id)} disabled={updateM.isPending}>Save</button>
                    <button className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200" onClick={stopEdit}>Cancel</button>
                    {editError && <InlineError className="ml-auto">{editError}</InlineError>}
                  </>
                ) : (
                  <>
                    <div className="grow">
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-gray-500">+ {moneyFormat(toTwoDecimals(m.price_delta))}</div>
                    </div>
                    <button className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700 hover:bg-amber-200" onClick={() => startEdit(m.id, m.name, m.price_delta)}>Edit</button>
                    <button className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200" onClick={() => deleteM.mutate(m.id)} disabled={deleteM.isPending}>Delete</button>
                  </>
                )}
              </li>
            ))}
          </ul>

          {/* Preview total */}
          <div className="mt-3 rounded border bg-amber-50 p-3 text-sm text-amber-800">
            <div className="font-medium mb-1">Example Total</div>
            <div className="flex items-center gap-2 flex-wrap">
              <span>Base:</span>
              <span className="font-semibold">{moneyFormat(basePrice)}</span>
              <span>+</span>
              <span>Sum of modifiers:</span>
              <span className="font-semibold">{moneyFormat(list.reduce((s, m) => s + (Number(m.price_delta) || 0), 0))}</span>
              <span>=</span>
              <span className="font-semibold">{moneyFormat(basePrice + list.reduce((s, m) => s + (Number(m.price_delta) || 0), 0))}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
