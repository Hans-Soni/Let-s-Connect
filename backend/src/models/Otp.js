import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["signup", "reset_password"],
      default: "signup",
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // Automatically deletes documents after 10 minutes (600s)
    },
  },
  { timestamps: false }
);

// Compound index for lightning-fast lookups by email and purpose
otpSchema.index({ email: 1, type: 1, createdAt: -1 });

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;

