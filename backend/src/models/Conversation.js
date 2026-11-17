import mongoose from "mongoose";

export const getPairKey = (id1, id2) => {
  if (!id1 || !id2) return "";
  return [id1.toString(), id2.toString()].sort().join("_");
};

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    // Deterministic sorted key for the pair of users: `${minId}_${maxId}`
    pairKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Retention policy: "24h" (ephemeral 24 hours) or "15d" (secure 15 days)
    retentionPolicy: {
      type: String,
      enum: ["24h", "15d"],
      default: "24h",
    },
    // Whether a participant has explicitly made a choice
    hasSelectedRetention: {
      type: Boolean,
      default: false,
    },
    retentionSelectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true, autoIndex: false }
);

conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
