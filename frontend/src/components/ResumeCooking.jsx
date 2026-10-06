import { useEffect, useState } from 'react';
import { cookingSessions } from '../lib/cookingProgress.js';
export function ResumeCooking({ onOpenRecipe }) {
  const [sessions, setSessions] = useState([]), [error, setError] = useState('');
  useEffect(() => {
    const load = () => { try { setSessions(cookingSessions().filter(s => s.phase === 'cooking')); } catch(e) { setError(e.message); } };
    load(); window.addEventListener('mise-cooking_v1-change', load); return () => window.removeEventListener('mise-cooking_v1-change', load);
  }, []);
  if (error) return <p role="alert">{error}</p>;
  if (!sessions.length) return null;
  return <section className="paper-card p-5 space-y-3"><h2 className="font-display text-2xl">Resume cooking</h2>{sessions.map(s => <button key={s.sessionId} className="underline block" onClick={() => onOpenRecipe({ ...s.recipe, resumeCooking: true })}>{s.recipe.title} · Step {s.currentStepIndex + 1}</button>)}</section>;
}
