import { useEffect, useState } from 'react';
import { workspaceStatus, workspaceConflicts, syncWorkspace, resolveWorkspaceConflict } from '../lib/workspaceSync.js';
function revisionTitle(entity) {
  if (entity.includes('/item/')) return `Pantry: ${entity.split('/item/')[1]}`;
  if (entity.endsWith('/staples')) return 'Confirmed staples';
  if (entity.includes('/deduction/')) return 'Pantry deduction';
  return entity.startsWith('plan_') ? 'Planned dinner' : entity.startsWith('cooking_') ? 'Cooking progress' : 'Leftovers';
}
function RevisionDetails({ value }) {
  if (value === null) return <p>Removed</p>;
  if (Array.isArray(value)) return <p>Confirmed staples: {value.join(', ') || 'None'}</p>;
  if (value.name) return <p>{value.name}: {value.quantity === null ? 'Unknown amount' : `${value.quantity} ${value.unit}`}{value.expiresOn ? ` · reminder ${value.expiresOn}` : ''}</p>;
  if (value.sessionId && value.lines) return <p>Pantry deduction for {value.lines.length} ingredient(s), recorded {new Date(value.at).toLocaleString()}.</p>;
  const seconds = value.timer?.deadline ? Math.max(0, Math.ceil((value.timer.deadline - Date.now()) / 1000)) : value.timer?.remainingSeconds;
  return <div className="space-y-2"><p>{value.recipe?.title}</p>
    {value.date && <p>Planned date: {value.date} · {value.servings} servings</p>}
    {value.portions !== undefined && <p>{value.portions} portions remaining{value.reminderDate ? ` · reminder ${value.reminderDate}` : ''}</p>}
    {value.phase && <p>{value.phase} · Step {value.currentStepIndex + 1}{seconds != null ? ` · timer ${seconds} seconds remaining` : ''}</p>}
    {value.recipe && <details><summary>Recipe details</summary><ul>{value.recipe.ingredients.map((text,i) => <li key={i}>{text}</li>)}</ul><ol>{value.recipe.instructions.map((text,i) => <li key={i}>{text}</li>)}</ol></details>}
  </div>;
}
export function WorkspaceSyncPanel() {
  const [message, setMessage] = useState(workspaceStatus), [conflicts, setConflicts] = useState([]), [error, setError] = useState('');
  useEffect(() => {
    const refresh = () => { setMessage(workspaceStatus()); try { setConflicts(workspaceConflicts()); } catch (e) { setError(e.message); } };
    refresh(); const events = ['mise-workspace-status', 'mise-workspace-change', 'mise-auth-change'];
    events.forEach(event => window.addEventListener(event, refresh));
    return () => events.forEach(event => window.removeEventListener(event, refresh));
  }, []);
  return <section className="paper-card p-4 space-y-3" aria-label="Pantry and plan synchronization">
    <p role="status">{message}</p><button className="underline" onClick={() => { setError(''); syncWorkspace().catch(e => setError(e.message)); }}>Sync pantry, plans & progress</button>
    {error && <p role="alert">{error}</p>}
    {conflicts.map(conflict => <details key={conflict.entity}><summary>Review changes: {revisionTitle(conflict.entity)}</summary>
      <p>These edits were made independently. Choose the version to keep. Both revisions remain in history.</p>
      {conflict.heads.map((head, index) => <div key={head.opId} className="border p-3 my-2"><RevisionDetails value={head.value} />
        <button className="underline" onClick={() => { try { resolveWorkspaceConflict(conflict.entity, head.opId); setError(''); } catch(e) { setError(e.message); } }}>Keep version {index + 1}</button></div>)}
    </details>)}
  </section>;
}
