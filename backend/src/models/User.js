import mongoose from "mongoose";

const dataConsentSchema = new mongoose.Schema(
  {
    accepted: {
      type: Boolean,
      required: true,
      default: false,
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
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    dataConsent: {
      type: dataConsentSchema,
      required: true,
      select: false,
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true } // createdAt & updatedAt
);

// Index email in ascending (A to Z) dictionary order with case-insensitive collation
userSchema.index({ email: 1 }, { collation: { locale: "en", strength: 2 } });

const User = mongoose.model("User", userSchema);

export default User;
