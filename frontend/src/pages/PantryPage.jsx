import { useEffect, useState } from 'react';
import { UNITS } from '../../../shared/pantry.js';
import { cookbookOwner } from '../lib/savedRecipes.js';
import { getPantry, savePantryItem, removePantryItem, expiryStatus } from '../lib/pantryInventory.js';
export function PantryPage({ onBack }) {
  const [owner] = useState(cookbookOwner);
  const [items, setItems] = useState([]), [error, setError] = useState('');
  const [name, setName] = useState(''), [amount, setAmount] = useState(''), [unit, setUnit] = useState('g'), [expiresOn, setExpiresOn] = useState('');
  useEffect(() => { try { setItems(getPantry(owner).items); } catch (e) { setError(e.message); } }, [owner]);
  function save(e) {
    e.preventDefault();
    try { setItems(savePantryItem({ name, quantity: amount === '' ? null : Number(amount), unit, expiresOn: expiresOn || null }, owner).items); setError(''); setName(''); setAmount(''); setExpiresOn(''); }
    catch (e) { setError(e.message); }
  }
  return <main className="app-shell max-w-5xl mx-auto px-4 py-10 space-y-6">
    <button onClick={onBack} className="underline">← Kitchen</button><h1 className="font-display text-4xl">Your pantry</h1>
    <p>Inventory stays on this device for your account. Dates are reminders you enter; review labels and storage conditions when choosing food.</p>
    {error && <p role="alert">{error}</p>}
    <form className="paper-card p-5 flex flex-wrap gap-4 items-end" onSubmit={save}>
      <label>Ingredient<input required maxLength={120} className="block border p-2" value={name} onChange={e => setName(e.target.value)} /></label>
      <label>Amount available<input type="number" min="0" max="100000" step="any" placeholder="Unknown" className="block border p-2 w-32" value={amount} onChange={e => setAmount(e.target.value)} /></label>
      <label>Unit<select className="block border p-2" value={unit} onChange={e => setUnit(e.target.value)}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></label>
      <label>Reminder date<input type="date" className="block border p-2" value={expiresOn} onChange={e => setExpiresOn(e.target.value)} /></label>
      <button className="editorial-button" type="submit">Save pantry item</button>
    </form>
    <ul className="space-y-3">{[...items].sort((a,b) => (a.expiresOn || '9999').localeCompare(b.expiresOn || '9999')).map(item => <li key={item.id} className="paper-card p-4 flex flex-wrap justify-between gap-3">
      <div><strong>{item.name}</strong><p>{item.quantity === null ? 'Amount unknown' : `${item.quantity} ${item.unit}`}</p><p className="text-sm">{expiryStatus(item.expiresOn)}</p></div>
      <div className="flex gap-3"><button className="underline" onClick={() => { setName(item.name); setAmount(item.quantity === null ? '' : String(item.quantity)); setUnit(item.unit); setExpiresOn(item.expiresOn || ''); }}>Edit</button><button className="underline" onClick={() => { try { setItems(removePantryItem(item.id, owner).items); } catch (e) { setError(e.message); } }}>Remove</button></div>
    </li>)}</ul>
    {!items.length && <p>Add ingredients to reuse them in the kitchen and your meal plan.</p>}
  </main>;
}
