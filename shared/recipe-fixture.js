export const dinner = {
  title: 'Skillet potatoes', servings: 2, prepMinutes: 5, cookMinutes: 15, equipment: ['stovetop', 'skillet'],
  ingredients: [{ id: 'potato', name: 'potato', quantity: 400, quantityMax: null, unit: 'g', preparation: 'diced', packageSize: '' }],
  steps: [{ text: 'Cook {ingredient:potato} in the skillet for 15 minutes, until tender.', ingredientIds: ['potato'] }], chefNote: 'Cut evenly.',
};
export const recipeJSON = JSON.stringify({ recipes: [dinner] });
