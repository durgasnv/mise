export function rankRecipes(recipes) {
  const count = (r, key) => r.review?.[key]?.length || 0;
  return [...recipes].sort((a, b) => count(a, 'missing') - count(b, 'missing') ||
    count(a, 'labelChecks') - count(b, 'labelChecks') || count(a, 'quantityChecks') - count(b, 'quantityChecks') ||
    (a.structured.prepMinutes + a.structured.cookMinutes) - (b.structured.prepMinutes + b.structured.cookMinutes));
}
export function recommendationReason(recipe) {
  const missing = recipe.review?.missing?.length || 0;
  const checks = (recipe.review?.quantityChecks?.length || 0) + (recipe.review?.labelChecks?.length || 0);
  return `${missing ? `${missing} missing or insufficient item${missing === 1 ? '' : 's'}` : 'Uses your confirmed pantry'} • ${recipe.structured.prepMinutes + recipe.structured.cookMinutes} minutes for ${recipe.structured.servings} servings${checks ? ` • ${checks} check${checks === 1 ? '' : 's'} before cooking` : ''}. Ranked by pantry fit, remaining checks, then total time.`;
}
