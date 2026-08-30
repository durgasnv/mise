import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "🧑‍🍳",
    },
    dietaryPreferences: {
      type: [String],
      default: [],
    },
    spicePreference: {
      type: String,
      default: "Medium Heat",
    },
    kitchenStaples: {
      type: [String],
      default: ["Olive Oil", "Flake Sea Salt", "Black Pepper", "Garlic", "Butter"],
    },
    savedRecipes: {
      type: [Object],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
