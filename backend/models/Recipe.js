import mongoose from "mongoose";

const nonEmptyStringArray = {
  validator(value) {
    return (
      Array.isArray(value) &&
      value.every((item) => typeof item === "string" && item.trim().length > 0)
    );
  },
  message: "All values must be non-empty strings.",
};

const recipeSchema = new mongoose.Schema({
  ingredients: {
    type: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    required: [true, "Exactly 3 ingredients are required."],
    validate: [
      {
        validator(value) {
          return Array.isArray(value) && value.length === 3;
        },
        message: "Exactly 3 ingredients are required.",
      },
      nonEmptyStringArray,
    ],
  },
  recipeName: {
    type: String,
    required: [true, "Recipe name is required."],
    trim: true,
    minlength: [1, "Recipe name cannot be empty."],
  },
  prepTime: {
    type: String,
    required: [true, "Prep time is required."],
    trim: true,
    minlength: [1, "Prep time cannot be empty."],
  },
  ingredientsList: {
    type: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    required: [true, "Ingredients list is required."],
    validate: [
      {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "Ingredients list must include at least one item.",
      },
      nonEmptyStringArray,
    ],
  },
  instructions: {
    type: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    required: [true, "Instructions are required."],
    validate: [
      {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "Instructions must include at least one step.",
      },
      nonEmptyStringArray,
    ],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Recipe = mongoose.model("Recipe", recipeSchema);
