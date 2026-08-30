import mongoose from "mongoose";

const querySchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, "Question is required."],
    trim: true,
  },
  response: {
    type: String,
    required: [true, "Response is required."],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Query = mongoose.model("Query", querySchema);
