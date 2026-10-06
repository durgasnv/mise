import { useState } from 'react';
import { RecipeCard } from './RecipeCard';
import { rankRecipes, recommendationReason } from '../../../shared/recipe-ranking.js';
export function MultiRecipeStack({ recipes = [], onSaveChange, onCookAnother }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAlternatives, setShowAlternatives] = useState(false);
  if (!recipes.length) return null;
  const ranked = rankRecipes(recipes), active = ranked[activeIndex] || ranked[0];
  return <div className="recipe-deck space-y-5">
    <section className="border border-[#E3CFB1] rounded-lg p-5 bg-[#FFF8EC] space-y-2">
      <h2 className="font-display text-2xl">Recommended dinner: {ranked[0].title}</h2>
      <p className="text-sm">{recommendationReason(ranked[0])}</p>
      {ranked.length > 1 && <button type="button" className="underline text-sm" aria-expanded={showAlternatives} onClick={() => setShowAlternatives(v => !v)}>{showAlternatives ? 'Hide alternatives' : `Explore ${ranked.length - 1} alternative${ranked.length === 2 ? '' : 's'}`}</button>}
      {showAlternatives && <div className="flex flex-wrap gap-2">{ranked.map((r, i) => <button key={r.id} type="button" className="border p-2 text-sm" aria-pressed={activeIndex === i} onClick={() => setActiveIndex(i)}>{i === 0 ? 'Recommended: ' : ''}{r.title}</button>)}</div>}
      {!showAlternatives && activeIndex !== 0 && <button className="underline text-sm block" onClick={() => setActiveIndex(0)}>Return to recommended dinner</button>}
    </section>
    <RecipeCard key={active.id} recipe={active} onSaveChange={onSaveChange} onCookAnother={onCookAnother} />
  </div>;
}
