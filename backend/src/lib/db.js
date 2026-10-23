import mongoose from "mongoose";
import { ENV } from "./env.js";
import Consent from "../models/Consent.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { startMessageRetentionCleanup } from "./messageRetention.js";

const migrateEmbeddedConsentRecords = async () => {
  const legacyUsers = User.collection.find(
    { "dataConsent.accepted": true },
    { projection: { _id: 1, email: 1, dataConsent: 1 } }
  );
  const usersToMigrate = [];

  for await (const user of legacyUsers) {
    const consent = user.dataConsent;
    if (!consent?.acceptedAt || !consent?.termsVersion) {
      console.error(`Skipping incomplete legacy consent record for user ${user._id}.`);
      continue;
    }

    usersToMigrate.push({
      updateOne: {
        filter: { userId: user._id },
        update: {
          $setOnInsert: {
            accepted: true,
            termsVersion: consent.termsVersion,
            acceptedAt: consent.acceptedAt,
            ipAddress: consent.ipAddress || "unknown",
            emailId: consent.emailId || user.email,
            userId: user._id,
          },
        },
        upsert: true,
      },
    });
  }

  if (usersToMigrate.length === 0) return;

  await Consent.collection.bulkWrite(usersToMigrate, { ordered: true });
  await User.collection.updateMany(
    {
      _id: { $in: usersToMigrate.map((operation) => operation.updateOne.filter.userId) },
      "dataConsent.accepted": true,
    },
    { $unset: { dataConsent: "" } }
  );
  console.log(`Migrated ${usersToMigrate.length} embedded consent record(s) to the consents collection.`);
};

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

    await Consent.createCollection().catch((error) => {
      if (error.codeName !== "NamespaceExists") throw error;
    });
    await Consent.createIndexes();
    await migrateEmbeddedConsentRecords();

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
