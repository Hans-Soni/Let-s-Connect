import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },
    googleId: {
      type: String,
      default: null,
      index: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
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
