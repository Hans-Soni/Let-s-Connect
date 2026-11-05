import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "Anonymous",
      maxLength: 100,
    },
    email: {
      type: String,
      trim: true,
      default: "",
      maxLength: 150,
    },
    category: {
      type: String,
      enum: ["General", "Feature Request", "Bug Report", "Praise"],
      default: "General",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxLength: 3000,
    },
    ipAddress: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Feedback = mongoose.model("Feedback", feedbackSchema, "feedbacks");

export default Feedback;

