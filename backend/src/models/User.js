import mongoose from "mongoose";

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
  },
  { timestamps: true } // createdAt & updatedAt
);

// Index email in ascending (A to Z) dictionary order with case-insensitive collation
userSchema.index({ email: 1 }, { collation: { locale: "en", strength: 2 } });

// Automatically sort documents inside MongoDB collection in A to Z dictionary order
userSchema.post("save", async function () {
  try {
    const UserModel = mongoose.model("User");
    await UserModel.aggregate([
      { $sort: { email: 1 } },
      { $out: "users" },
    ]);
  } catch (error) {
    console.warn("MongoDB collection auto-sort skipped:", error.message);
  }
});

const User = mongoose.model("User", userSchema);

export default User;
