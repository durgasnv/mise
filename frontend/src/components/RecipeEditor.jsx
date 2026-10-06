import { useDialog } from "../lib/useDialog.js";
import { newId } from "../lib/accountStore.js";
import { useState } from 'react';
import { EQUIPMENT, UNITS, DEFAULT_CONSTRAINTS } from '../../../shared/pantry.js';
import { editRecipe } from '../../../shared/recipe-editing.js';
import { saveRecipe } from '../lib/savedRecipes.js';
import { activePantry } from '../lib/pantryInventory.js';
import { generateRecipeApi } from '../lib/api.js';
function displayStep(step, r) { return step.text.replace(/\{ingredient:([^}]+)\}/g, (_, id) => `[${r.ingredients.find(i => i.id === id)?.name}]`); }
export function RecipeEditor({ recipe, onSave, onClose }) {
  const [source, setSource] = useState(recipe);
  const [draft, setDraft] = useState(recipe.structured ? structuredClone(recipe.structured) : null);
  const [method, setMethod] = useState(recipe.structured?.steps.map(s => displayStep(s, recipe.structured)) || []);
  const [maxMinutes, setMaxMinutes] = useState(recipe.constraints?.maxMinutes || 1440);
  const [strict, setStrict] = useState(recipe.constraints?.strictPantry ?? false);
  const [pending, setPending] = useState(false), [error, setError] = useState(''), [reviewed, setReviewed] = useState(false);
  const dialog = useDialog(onClose, pending);
  async function convert() {
    setPending(true); setError('');
    try {
      const constraints = { ...DEFAULT_CONSTRAINTS, pantry: activePantry().map(({ name, quantity, unit }) => ({ name, quantity, unit })), maxMinutes: 1440, strictPantry: false };
      const [converted] = await generateRecipeApi('Convert this saved recipe for review.', null, constraints, { action: 'convert', legacy: recipe });
      setSource({ ...converted, legacySourceId: recipe.id }); setDraft(converted.structured); setMethod(converted.structured.steps.map(s => displayStep(s, converted.structured)));
    } catch(e) { setError(e.message); } finally { setPending(false); }
  }
  function save(e) {
    e.preventDefault(); setError('');
    try {
      const structured = structuredClone(draft);
      structured.steps = method.map((text, index) => {
        const ids = new Set(structured.steps[index]?.ingredientIds || []);
        const converted = text.replace(/\[([^\]]+)\]/g, (_, name) => {
          const ingredient = structured.ingredients.find(i => i.name === name) || source.structured.ingredients.find(i => i.name === name);
          if (!ingredient) throw new Error(`Choose an ingredient insert for ${name}.`);
          ids.add(ingredient.id); return `{ingredient:${ingredient.id}}`;
        });
        return { text: converted, ingredientIds: [...ids].filter(id => structured.ingredients.some(i => i.id === id)) };
      });
      const constraints = { ...(source.constraints || DEFAULT_CONSTRAINTS), strictPantry: strict, maxMinutes, servings: structured.servings };
      const updated = editRecipe(source, structured, constraints);
      saveRecipe(updated); onSave(updated);
    } catch(e) { setError(e.message); }
  }
  const change = (key, value) => setDraft(d => ({ ...d, [key]: value }));
  return <div className="editorial-modal-backdrop fixed inset-0 z-50 bg-black/60 p-4 overflow-auto"><section ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="editor-title" className="editorial-modal bg-[#FFF8EC] max-w-3xl mx-auto my-4 rounded-lg p-5 space-y-4">
    <div className="flex justify-between gap-3"><h2 id="editor-title" className="font-display text-3xl">{recipe.structured ? 'Edit recipe' : 'Review legacy conversion'}</h2><button aria-label="Close recipe editor" disabled={pending} onClick={onClose}>✕</button></div>
    {!recipe.structured && <details><summary>Original recipe (preserved)</summary><p>{recipe.title}</p><ul>{recipe.ingredients.map((i,n) => <li key={n}>{i}</li>)}</ul><ol>{recipe.instructions.map((s,n) => <li key={n}>{s}</li>)}</ol></details>}
    {!draft ? <div className="space-y-3"><p>Convert this text recipe into quantities and linked instructions. Review all proposed amounts and cooking guidance before saving a separate structured copy.</p><p className="text-sm">Conversion uses one generation request. The original recipe stays in your cookbook.</p><button className="editorial-button" disabled={pending} onClick={convert}>{pending ? 'Preparing conversion…' : 'Prepare conversion'}</button></div> :
      <form className="space-y-4" onSubmit={save}>
        <label className="block">Title<input required maxLength={200} className="block border p-2 w-full" value={draft.title} onChange={e => change('title', e.target.value)} /></label>
        <div className="flex flex-wrap gap-4">{[['servings','Servings',1,12],['prepMinutes','Prep minutes',0,1440],['cookMinutes','Cook minutes',0,1440]].map(([key,label,min,max]) => <label key={key}>{label}<input required type="number" min={min} max={max} className="block border p-2 w-24" value={draft[key]} onChange={e => change(key, Number(e.target.value))} /></label>)}</div>
        <label className="block">Time available (minutes)<input required min="5" max="1440" type="number" className="border p-2 w-24" value={maxMinutes} onChange={e => setMaxMinutes(Number(e.target.value))} /></label>
        <fieldset><legend>Equipment</legend><div className="flex flex-wrap gap-3">{EQUIPMENT.map(item => <label key={item}><input type="checkbox" checked={draft.equipment.includes(item)} onChange={() => change('equipment', draft.equipment.includes(item) ? draft.equipment.filter(i => i !== item) : [...draft.equipment,item])} /> {item}</label>)}</div></fieldset>
        <fieldset className="space-y-3"><legend>Ingredients</legend>{draft.ingredients.map((i,index) => <div key={i.id} className="flex flex-wrap gap-2 border p-3">
          <label>Name<input required className="block border p-1" maxLength={120} value={i.name} onChange={e => setDraft(d => ({ ...d, ingredients: d.ingredients.map((item,n) => n === index ? { ...item, name: e.target.value } : item) }))} /></label>
          <label>Amount<input required type="number" min="0.001" max="100000" step="any" className="block border p-1 w-24" value={i.quantity} onChange={e => setDraft(d => ({ ...d, ingredients: d.ingredients.map((item,n) => n === index ? { ...item, quantity: Number(e.target.value) } : item) }))} /></label>
          <label>Unit<select className="block border p-1" value={i.unit} onChange={e => setDraft(d => ({ ...d, ingredients: d.ingredients.map((item,n) => n === index ? { ...item, unit: e.target.value } : item) }))}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></label>
          <label>Maximum amount (optional range)<input className="block border p-1 w-24" type="number" min={i.quantity} max="100000" step="any" value={i.quantityMax ?? ''} onChange={e => setDraft(d => ({ ...d, ingredients: d.ingredients.map((item,n) => n === index ? { ...item, quantityMax: e.target.value === '' ? null : Number(e.target.value) } : item) }))} /></label>
          <label>Package size label<input className="block border p-1" value={i.packageSize} onChange={e => setDraft(d => ({ ...d, ingredients: d.ingredients.map((item,n) => n === index ? { ...item, packageSize: e.target.value } : item) }))} /></label>
          <label>Preparation<input className="block border p-1" value={i.preparation} onChange={e => setDraft(d => ({ ...d, ingredients: d.ingredients.map((item,n) => n === index ? { ...item, preparation: e.target.value } : item) }))} /></label>
          <button type="button" className="underline text-sm" onClick={() => { setDraft(d => ({ ...d, ingredients: d.ingredients.filter(item => item.id !== i.id) })); setMethod(m => m.map(text => text.split(`[${i.name}]`).join(''))); }}>Remove ingredient</button>
        </div>)}<button type="button" className="underline" onClick={() => setDraft(d => ({ ...d, ingredients: [...d.ingredients, { id: newId().replace(/-/g,'').slice(0,30), name: '', quantity: 1, quantityMax: null, unit: 'g', preparation: '', packageSize: '' }] }))}>Add ingredient</button></fieldset>
        <fieldset className="space-y-3"><legend>Method</legend><p className="text-sm">Use ingredient inserts for amounts; they stay linked when servings change.</p>{method.map((text,index) => <div key={index}><label className="block">Step {index+1}<textarea required className="border p-2 w-full" rows={3} value={text} onChange={e => setMethod(m => m.map((s,n) => n === index ? e.target.value : s))} /></label><div className="flex flex-wrap gap-2">{draft.ingredients.map(i => <button key={i.id} type="button" className="underline text-xs" onClick={() => setMethod(m => m.map((s,n) => n === index ? `${s} [${i.name}]` : s))}>Insert {i.name}</button>)}</div></div>)}</fieldset>
        <button type="button" className="underline" onClick={() => { setDraft(d => ({ ...d, steps: [...d.steps, { text: '', ingredientIds: [] }] })); setMethod(m => [...m, '']); }}>Add method step</button>
        <label className="block">Chef note<textarea className="block border p-2 w-full" maxLength={2000} value={draft.chefNote} onChange={e => change('chefNote', e.target.value)} /></label>
        <label className="block"><input type="checkbox" checked={strict} onChange={e => setStrict(e.target.checked)} /> Require my recorded pantry to cover this recipe</label>
        <label className="block"><input required type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} /> I reviewed amounts, method, dietary restrictions and cooking guidance.</label>
        <button className="editorial-button" disabled={!reviewed} type="submit">{recipe.structured ? 'Save validated revision' : 'Save reviewed structured copy'}</button>
      </form>}
    {error && <p role="alert">{error} Your original recipe has been preserved.</p>}
  </section></div>;
}
