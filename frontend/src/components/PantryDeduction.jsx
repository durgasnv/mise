import { useState } from 'react';
import { deductionPreview, deductPantry } from '../lib/pantryInventory.js';
export function PantryDeduction({ recipe, sessionId, owner }) {
  const [rows] = useState(() => { try { return deductionPreview(recipe); } catch { return []; } });
  const [amounts, setAmounts] = useState(() => Object.fromEntries(rows.filter(r => r.id).map(r => [r.id, String(Number(r.used.toFixed(6)))])));
  const [confirmed, setConfirmed] = useState(false), [message, setMessage] = useState(''), [done, setDone] = useState(false);
  if (!recipe.structured || !rows.length) return <p className="text-sm">Update your pantry manually if you used ingredients from it.</p>;
  function apply() {
    try {
      const result = deductPantry(sessionId, rows.filter(r => r.id).map(r => ({ id: r.id, used: Number(amounts[r.id]) })), owner);
      setDone(true); setMessage(result.alreadyApplied ? 'This meal already updated your pantry.' : 'Pantry updated for this meal.');
    } catch (e) { setMessage(e.message); }
  }
  return <section className="space-y-2"><h4 className="font-semibold">Confirm actual ingredient use</h4>
    {rows.map((r,i) => r.id ? <label key={r.id} className="block">{r.name} <input aria-label={`Amount used of ${r.name}`} className="border p-1 w-24" type="number" min="0" max={r.available} step="any" disabled={done} value={amounts[r.id]} onChange={e => setAmounts(a => ({ ...a, [r.id]: e.target.value }))} /> {r.unit} (recorded: {r.available})</label> : <p key={i} className="text-sm">{r.name}: {r.check}</p>)}
    <label className="block text-sm"><input type="checkbox" disabled={done} checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /> I reviewed actual use and will update unmatched items manually.</label>
    <button type="button" className="underline" disabled={!confirmed || done} onClick={apply}>Deduct confirmed amounts</button>
    {message && <p role="status">{message}</p>}
  </section>;
}
