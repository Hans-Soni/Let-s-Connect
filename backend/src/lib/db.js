import mongoose from "mongoose";
import { ENV } from "./env.js";
import Message from "../models/Message.js";
import { startMessageRetentionCleanup } from "./messageRetention.js";

export const connectDB = async () => {
  try {
    const { MONGO_URI } = ENV;
    if (!MONGO_URI) throw new Error("MONGO_URI is not set");

    const conn = await mongoose.connect(ENV.MONGO_URI);
    const database = mongoose.connection.db;
    const collections = await database
      .listCollections({ name: Message.collection.name }, { nameOnly: true })
      .toArray();
    if (collections.length === 0) {
      await Message.createCollection();
    }

    const indexes = await Message.collection.indexes();
    const legacyTtlIndexes = indexes.filter(
      (index) => index.key?.createdAt === 1 && index.expireAfterSeconds !== undefined
    );
    for (const index of legacyTtlIndexes) {
      await Message.collection.dropIndex(index.name);
      console.log(`Removed message TTL index "${index.name}" for media-aware retention cleanup.`);
    }
    await Message.createIndexes();
    startMessageRetentionCleanup();

    console.log("MONGODB CONNECTED:", conn.connection.host);
  } catch (error) {
    console.error("Error connection to MONGODB:", error);
    process.exit(1); // 1 status code means fail, 0 means success
  }
};
