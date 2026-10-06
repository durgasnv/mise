import { useState } from 'react';
import { accountRequest } from '../lib/accountApi.js';
export function NutritionPanel({ recipe, nutrition, onCalculated, onSaveNutrition }) {
  const [query, setQuery] = useState(recipe.structured?.ingredients[0]?.name || ''), [foods,setFoods] = useState([]), [target,setTarget] = useState(recipe.structured?.ingredients[0]?.id || ''), [matches,setMatches] = useState({});
  const [pending,setPending] = useState(false), [error,setError] = useState('');
  if (!recipe.structured) return null;
  async function search(e) { e.preventDefault(); setPending(true); try { setFoods((await accountRequest('nutrition', { action:'search', query })).foods); setError(''); } catch(e) { setError(e.message); } finally { setPending(false); } }
  async function calculate() {
    setPending(true); try {
      const data = await accountRequest('nutrition', { action:'calculate', recipe: recipe.structured, matches: Object.entries(matches).filter(([,m]) => m.fdcId && m.grams).map(([ingredientId,m]) => ({ ingredientId, fdcId: m.fdcId, grams: Number(m.grams) })) });
      onCalculated(data.nutrition); setError('');
    } catch(e) { setError(e.message); } finally { setPending(false); }
  }
  return <section className="border p-4 space-y-3"><h3 className="font-display text-xl">Nutrition from USDA food data</h3>
    {nutrition && <div><p className="text-sm">Estimated per serving. {nutrition.missingIngredients.length ? `Partial calculation: missing ${nutrition.missingIngredients.join(', ')}.` : 'All ingredient weights matched.'}</p><ul>{Object.entries(nutrition.perServing).map(([key,v]) => <li key={key}>{({ energyKcal:'Energy (kcal)', proteinG:'Protein (g)', carbohydrateG:'Carbohydrate (g)', fatG:'Fat (g)', fiberG:'Fiber (g)' })[key]}: {v.amount}{!v.complete ? ' (known ingredients only)' : ''}</li>)}</ul><p className="text-xs">Food matches: {nutrition.matches.map(m => <a className="underline mr-2" key={m.ingredientId} href={m.food.sourceUrl} target="_blank" rel="noreferrer">{m.food.description}</a>)}</p></div>}
    {nutrition && onSaveNutrition && <button className="underline" onClick={onSaveNutrition}>Save nutrition with recipe</button>}
    <details><summary className="cursor-pointer">Match ingredients & confirm weights</summary><p className="text-sm">Choose the correct food and preparation, then confirm edible weight in grams. Count, volume and package quantities need measured weights.</p>
      <label className="block">Ingredient<select className="border p-2 max-w-full" value={target} onChange={e => { setTarget(e.target.value); setQuery(recipe.structured.ingredients.find(i => i.id === e.target.value)?.name || ""); setFoods([]); }}>{recipe.structured.ingredients.map(i => <option value={i.id} key={i.id}>{i.name}</option>)}</select></label>
      <form onSubmit={search} className="flex flex-wrap gap-2 my-3"><label>Food name<input required maxLength={120} className="border p-2" value={query} onChange={e => setQuery(e.target.value)} /></label><button disabled={pending} className="underline">Search USDA foods</button></form>
      {foods.map(food => <button disabled={pending} className="block text-left underline text-sm my-2" key={food.fdcId} onClick={() => { const i = recipe.structured.ingredients.find(i => i.id === target); setMatches(m => ({ ...m, [target]: { fdcId: food.fdcId, description: food.description, grams: ['g','kg'].includes(i.unit) ? String(i.quantity * (i.unit === 'kg' ? 1000 : 1)) : '' } })); }}>{food.description} · {food.dataType}</button>)}
      {Object.entries(matches).map(([id,m]) => <label className="block my-2" key={id}>{recipe.structured.ingredients.find(i => i.id === id)?.name}: {m.description}<input aria-label={`Gram weight of ${recipe.structured.ingredients.find(i => i.id === id)?.name}`} type="number" min="0.001" max="100000" step="any" className="border p-1 w-24" value={m.grams} onChange={e => setMatches(all => ({ ...all, [id]: { ...m, grams: e.target.value } }))} /> g</label>)}
      <button disabled={pending || !Object.keys(matches).length} className="underline" onClick={calculate}>{pending ? 'Looking up food data…' : 'Calculate confirmed weights'}</button>
    </details>{error && <p role="alert" className="text-sm">{error}</p>}
  </section>;
}
