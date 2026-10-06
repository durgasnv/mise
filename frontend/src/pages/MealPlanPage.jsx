import { getLeftovers, addLeftover, consumeLeftover, removeLeftover } from '../lib/leftovers.js';
import { WorkspaceSyncPanel } from '../components/WorkspaceSyncPanel.jsx';
import { useEffect, useState } from 'react';
import { cookbookOwner, getSavedRecipes } from '../lib/savedRecipes.js';
import { getPantry } from '../lib/pantryInventory.js';
import { getMealPlan, addPlannedMeal, removePlannedMeal, repeatPlanWeek, addLeftoverMeal } from '../lib/mealPlan.js';
import { shoppingList, shoppingText, weekStartDate, weekEntries } from '../../../shared/meal-planning.js';
export function MealPlanPage({ onBack, onOpenRecipe }) {
  const [owner] = useState(cookbookOwner), [entries, setEntries] = useState([]), [recipes, setRecipes] = useState([]), [pantry, setPantry] = useState([]);
  const [leftovers, setLeftovers] = useState([]), [leftoverId, setLeftoverId] = useState(''), [reminderDate, setReminderDate] = useState('');
  const [week, setWeek] = useState(weekStartDate());
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10)), [recipeId, setRecipeId] = useState(''), [servings, setServings] = useState(2), [error, setError] = useState('');
  useEffect(() => {
    const load = () => { try { setEntries(getMealPlan(owner).entries); setRecipes(getSavedRecipes().filter(r => r.structured)); setPantry(getPantry(owner).items); setLeftovers(getLeftovers(owner).items); } catch(e) { setError(e.message); } };
    load(); const events = ['mise-plan_v1-change', 'mise-leftovers_v1-change', 'mise-pantry_v1-change', 'storage'];
    events.forEach(event => window.addEventListener(event, load)); return () => events.forEach(event => window.removeEventListener(event, load));
  }, [owner]);
  const selectedEntries = weekEntries(entries, week);
  const lines = shoppingList(selectedEntries, pantry);
  function add(e) { e.preventDefault(); try { setEntries(addPlannedMeal(date, recipes.find(r => r.id === recipeId), servings, owner).entries); setError(''); } catch(e) { setError(e.message); } }
  return <main className="app-shell max-w-5xl mx-auto px-4 py-10 space-y-6"><button className="underline" onClick={onBack}>← Kitchen</button><h1 className="font-display text-4xl">Meal plan & shopping list</h1>
    <p>Plan dinners from your cookbook. Ingredient ranges use the higher amount when calculating groceries. Plans are saved locally and can sync with your Puter account.</p>
    <label className="block">Week starting <input aria-label="Week starting" type="date" className="border p-2" value={week} onChange={e => { if (e.target.value) { const start = weekStartDate(e.target.value); setWeek(start); setDate(start); } }} /></label>
    <WorkspaceSyncPanel />
    {error && <p role="alert">{error}</p>}
    <form onSubmit={add} className="paper-card p-5 flex flex-wrap items-end gap-4">
      <label>Date<input required type="date" className="block border p-2" value={date} onChange={e => setDate(e.target.value)} /></label>
      <label>Saved recipe<select required className="block border p-2 max-w-full" value={recipeId} onChange={e => { setRecipeId(e.target.value); setServings(recipes.find(r => r.id === e.target.value)?.basePortions || 2); }}><option value="">Choose recipe</option>{recipes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}</select></label>
      <label>Servings<input required type="number" min="1" max="12" className="block border p-2 w-20" value={servings} onChange={e => setServings(Number(e.target.value))} /></label>
      <button className="editorial-button" type="submit">Add dinner</button>
    </form>
    {!recipes.length && <p>Save a structured recipe from the kitchen before adding a dinner.</p>}
    <button className="editorial-button" onClick={() => { try { setEntries(repeatPlanWeek(week, owner).entries); setError(''); } catch(e) { setError(e.message); } }}>Repeat this week next week</button>
    <p>Repetition copies dinners once into the following week. Recorded leftovers are not repeated.</p>
    <ul className="space-y-3">{[...entries].sort((a,b) => a.date.localeCompare(b.date)).map(entry => <li key={entry.id} className="paper-card p-4 flex flex-wrap justify-between gap-3"><button className="underline text-left" onClick={() => onOpenRecipe({ ...entry.recipe, basePortions: entry.servings })}>{entry.date}: {entry.recipe.title} · {entry.servings} servings{entry.kind === 'leftover' ? ' · leftovers' : ''}</button><button className="underline" onClick={() => { try { setEntries(removePlannedMeal(entry.id, owner).entries); } catch(e) { setError(e.message); } }}>Remove dinner</button></li>)}</ul>
    <section className="paper-card p-5 space-y-3" aria-label="Leftovers">
      <h2 className="font-display text-2xl">Leftovers</h2>
      <p>Record portions you have already cooked. Reminder dates are entered by you; check storage and food condition before eating.</p>
      <label className="block">Leftover reminder date<input className="border p-2" type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)} /></label>
      <button className="underline" disabled={!recipeId} onClick={() => { try { addLeftover(recipes.find(r => r.id === recipeId), servings, reminderDate, owner); setError(''); } catch(e) { setError(e.message); } }}>Record selected recipe as leftovers</button>
      <ul>{leftovers.map(item => <li key={item.id} className="border p-3 space-y-2">
        <p>{item.recipe.title}: {item.portions} portions remaining{item.reminderDate ? ` · reminder ${item.reminderDate}` : ''}</p>
        <button className="underline mr-4" disabled={!item.portions} onClick={() => { try { consumeLeftover(item.id, owner); setError(''); } catch(e) { setError(e.message); } }}>I used one portion</button>
        <button className="underline" onClick={() => { try { removeLeftover(item.id, owner); } catch(e) { setError(e.message); } }}>Remove leftovers</button>
      </li>)}</ul>
      <label className="block">Recorded leftovers<select className="border p-2 max-w-full" value={leftoverId} onChange={e => setLeftoverId(e.target.value)}><option value="">Choose leftovers</option>{leftovers.filter(i => i.portions > 0).map(i => <option key={i.id} value={i.id}>{i.recipe.title} · {i.portions} portions</option>)}</select></label>
      <button className="underline" disabled={!leftoverId} onClick={() => { try { addLeftoverMeal(date, leftovers.find(i => i.id === leftoverId), servings, owner); setError(''); } catch(e) { setError(e.message); } }}>Plan leftovers on selected date</button>
      {entries.filter(e => e.kind === 'leftover').some(e => !leftovers.some(i => i.id === e.leftoverId && i.portions >= entries.filter(p => p.leftoverId === i.id).reduce((n,p) => n + p.servings,0))) && <p role="alert">Some planned leftovers are no longer available. Review those dinners before using the shopping list.</p>}
    </section>
    <section className="paper-card p-5 space-y-3"><h2 className="font-display text-2xl">Shopping list for this week</h2>
      <ul>{lines.filter(l => l.shortfall !== 0).map((line,i) => <li key={i} className="py-2">{line.name}: {line.shortfall === null ? `${line.needed} ${line.unit} total needed — ${line.check}` : `${line.shortfall} ${line.unit} missing`}</li>)}</ul>
      {entries.length > 0 && !lines.some(l => l.shortfall !== 0) && selectedEntries.length > 0 && <p>Your recorded pantry covers this week.</p>}
      <a className="underline" download="mise-shopping-list.txt" href={`data:text/plain;charset=utf-8,${encodeURIComponent(shoppingText(lines))}`}>Download shopping list</a>
    </section>
  </main>;
}
