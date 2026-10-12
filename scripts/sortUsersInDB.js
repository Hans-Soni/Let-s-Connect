import dns from "dns";
try {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
} catch (e) {}

import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve("./backend/.env") });

const MONGO_URI = process.env.MONGO_URI;

/**
 * Utility script to sort all documents in MongoDB's users collection
 * strictly according to the dictionary rule (A to Z by email).
 */
async function sortUsersInDB() {
  if (!MONGO_URI) {
    console.error("MONGO_URI not found in backend/.env");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully.");

    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    console.log("Re-ordering documents in MongoDB 'users' collection in A-to-Z dictionary order...");
    await usersCollection
      .aggregate([{ $sort: { email: 1 } }, { $out: "users" }])
      .toArray();

    // Ensure A-to-Z collation index
    await usersCollection.createIndex(
      { email: 1 },
      { collation: { locale: "en", strength: 2 }, background: true }
    );

    console.log("SUCCESS: MongoDB users collection is now stored in A to Z dictionary order!");
    process.exit(0);
  } catch (error) {
    console.error("Error sorting users in MongoDB:", error);
    process.exit(1);
  }
}

sortUsersInDB();
