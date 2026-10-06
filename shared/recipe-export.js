export function recipeText(recipe) {
  const checks = [...(recipe.review?.missing || []), ...(recipe.review?.quantityChecks || []), ...(recipe.review?.labelChecks || [])];
  return `${recipe.title}\nServings: ${recipe.servings || 'Not provided'} | Prep: ${recipe.prepTime || 'Not provided'} | Cook: ${recipe.cookTime || 'Not provided'}\n${recipe.structured ? `Equipment: ${recipe.structured.equipment.join(', ')}\n` : ''}\nINGREDIENTS\n${(recipe.ingredients || []).map(i => `• ${i}`).join('\n')}\n\nPANTRY & LABEL CHECKS\n${checks.join('\n') || 'Verify ingredient labels and availability before cooking.'}\n\nMETHOD & SAFETY\n${(recipe.instructions || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n${recipe.chefNote || ''}\n— Mise Kitchen`;
}
