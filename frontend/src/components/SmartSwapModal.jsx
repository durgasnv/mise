import { useState } from 'react';
import { UNITS } from '../../../shared/pantry.js';
import { ingredientConflict } from '../../../shared/recipe-safety.js';
import { adaptRecipeApi } from '../lib/api.js';

export function SmartSwapModal({ ingredient, recipe, onSelectSwap, onClose }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('g');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const choices = (recipe.constraints?.pantry || []).filter(i => i.name !== ingredient?.name && !ingredientConflict(i.name, recipe.constraints?.restrictions || [], recipe.constraints?.excludedIngredients || []));
  async function submit(e) {
    e.preventDefault(); if (pending) return;
    setError(''); setPending(true);
    try {
      const replacement = { name: name.trim(), quantity: Number(quantity), unit };
      const conflict = ingredientConflict(replacement.name, recipe.constraints?.restrictions || [], recipe.constraints?.excludedIngredients || []);
      if (conflict) throw new Error(conflict);
      const adapted = await adaptRecipeApi(recipe, ingredient.id, replacement);
      onSelectSwap(adapted);
    } catch (err) { setError(err.message || 'The recipe could not be adapted.'); }
    finally { setPending(false); }
  }
  return <div className="editorial-modal-backdrop fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
    <div role="dialog" aria-modal="true" aria-labelledby="swap-title" className="editorial-modal bg-[#FFF8EC] rounded-lg max-w-md w-full p-6 space-y-4">
      <h3 id="swap-title" className="font-display text-2xl">Replace {ingredient?.name}</h3>
      <p className="text-sm">Confirm what you have. Mise will revise the complete method and quantities, then check your pantry and restrictions again.</p>
      {choices.length > 0 && <div className="flex gap-2 flex-wrap">{choices.map(i => <button key={i.name} type="button" disabled={pending} className="border p-2 text-sm" onClick={() => { setName(i.name); setQuantity(i.quantity === null ? '' : String(i.quantity)); setUnit(i.unit); }}>{i.name}</button>)}</div>}
      <form onSubmit={submit} className="space-y-3">
        <label className="block">Replacement <input required disabled={pending} className="block border p-2 w-full" maxLength={120} value={name} onChange={e => setName(e.target.value)} /></label>
        <label className="block">Amount available <input required disabled={pending} className="border p-2 w-28" type="number" min="0.001" max="100000" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} /> <select disabled={pending} aria-label="Replacement unit" className="border p-2" value={unit} onChange={e => setUnit(e.target.value)}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></label>
        {error && <p role="alert" className="text-sm text-red-700">{error} Your original recipe is still available.</p>}
        <button disabled={pending} className="editorial-button" type="submit">{pending ? 'Adapting method…' : 'Adapt complete recipe'}</button>
        <p className="text-xs">Uses one generation request from your account quota.</p>
      </form>
      <button type="button" disabled={pending} className="text-sm underline" onClick={onClose}>Keep original recipe</button>
    </div>
  </div>;
}
