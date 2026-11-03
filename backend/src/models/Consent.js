import mongoose from "mongoose";

const consentSchema = new mongoose.Schema(
  {
    accepted: {
      type: Boolean,
      required: true,
    },
    termsVersion: {
      type: String,
      required: true,
    },
    acceptedAt: {
      type: Date,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    emailId: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    accountDeletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Consent = mongoose.model("Consent", consentSchema, "consents");

export default Consent;
