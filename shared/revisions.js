// Causal parents establish order; device timestamps do not choose concurrent edits.
export function validateRevisions(operations) {
  if (!Array.isArray(operations) || operations.length > 10000) throw new Error('Sync history is too large or unreadable.');
  const ids = new Set();
  for (const op of operations) {
    if (!op || typeof op.opId !== 'string' || op.opId.length > 200 || ids.has(op.opId) || typeof op.entity !== 'string' || op.entity.length > 300 || !Array.isArray(op.parents) || op.parents.length > 100 || op.parents.some(p => typeof p !== 'string' || p === op.opId) || JSON.stringify(op).length > 200000) throw new Error('Invalid sync revision.');
    ids.add(op.opId);
  }
  const map = new Map(operations.map(op => [op.opId, op]));
  for (const op of operations) for (const parent of op.parents) if (!map.has(parent) || map.get(parent).entity !== op.entity) throw new Error('Incomplete sync history.');
  const visiting = new Set(), done = new Set();
  function visit(id) { if (visiting.has(id)) throw new Error('Circular sync history.'); if (done.has(id)) return; visiting.add(id); for (const p of map.get(id).parents) visit(p); visiting.delete(id); done.add(id); }
  for (const op of operations) visit(op.opId);
  return operations;
}
export function mergeRevisions(...logs) {
  const map = new Map();
  for (const log of logs) for (const op of log) {
    if (map.has(op.opId) && JSON.stringify(map.get(op.opId)) !== JSON.stringify(op)) throw new Error('Conflicting sync revision IDs.');
    map.set(op.opId, op);
  }
  return validateRevisions([...map.values()]);
}
export function revisionHeads(operations) {
  const replaced = new Set(operations.flatMap(op => op.parents));
  const entities = new Map();
  for (const op of operations) if (!replaced.has(op.opId)) { const heads = entities.get(op.entity) || []; heads.push(op); entities.set(op.entity, heads); }
  return entities;
}
