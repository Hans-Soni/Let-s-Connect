import cloudinary from "./cloudinary.js";
import Message, { MESSAGE_RETENTION_MS } from "../models/Message.js";
import { getReceiverSocketId, io } from "./socket.js";

const CLEANUP_INTERVAL_MS = 60 * 1000;
const CLEANUP_RETRY_DELAY_MS = 5 * 60 * 1000;
const CLEANUP_BATCH_SIZE = 50;

export const getCloudinaryPublicId = (assetUrl) => {
  if (!assetUrl) return null;

  let parsedUrl;
  try {
    parsedUrl = new URL(assetUrl);
  } catch {
    return null;
  }

  if (parsedUrl.hostname !== "res.cloudinary.com") return null;

  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
  const uploadIndex = pathParts.indexOf("upload");
  if (uploadIndex < 0) return null;

  const assetPath = pathParts.slice(uploadIndex + 1);
  if (assetPath[0]?.startsWith("v") && /^v\d+$/.test(assetPath[0])) {
    assetPath.shift();
  }
  if (assetPath.length === 0) return null;

  assetPath[assetPath.length - 1] = assetPath.at(-1).replace(/\.[^.]+$/, "");
  return assetPath.join("/") || null;
};

const messageAssets = (message) => [
  {
    publicId: message.imagePublicId || getCloudinaryPublicId(message.image),
    hasUrl: Boolean(message.image),
    resourceType: "image",
  },
  {
    publicId: message.audioPublicId || getCloudinaryPublicId(message.audio),
    hasUrl: Boolean(message.audio),
    resourceType: "video",
  },
  {
    publicId: message.videoPublicId || getCloudinaryPublicId(message.video),
    hasUrl: Boolean(message.video),
    resourceType: "video",
  },
];

export const deleteMessageMedia = async (message) => {
  for (const asset of messageAssets(message)) {
    if (!asset.hasUrl && !asset.publicId) continue;
    if (!asset.publicId) {
      throw new Error(`Could not determine Cloudinary public ID for message ${message._id}.`);
    }

    const result = await cloudinary.uploader.destroy(asset.publicId, {
      resource_type: asset.resourceType,
      invalidate: true,
    });
    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error(`Cloudinary did not confirm deletion for message ${message._id}.`);
    }
  }
};

export const cleanupExpiredMessages = async () => {
  const now = new Date();
  const expiredMessages = await Message.find({
    createdAt: { $lte: new Date(now.getTime() - MESSAGE_RETENTION_MS) },
    $or: [
      { mediaCleanupRetryAt: null },
      { mediaCleanupRetryAt: { $exists: false } },
      { mediaCleanupRetryAt: { $lte: now } },
    ],
  })
    .sort({ createdAt: 1 })
    .limit(CLEANUP_BATCH_SIZE);

  let deletedCount = 0;
  for (const message of expiredMessages) {
    try {
      await deleteMessageMedia(message);
      const result = await Message.deleteOne({ _id: message._id });
      if (result.deletedCount) {
        deletedCount++;
        const payload = {
          messageId: message._id.toString(),
          senderId: message.senderId.toString(),
          receiverId: message.receiverId.toString(),
        };
        for (const userId of [payload.senderId, payload.receiverId]) {
          const socketId = getReceiverSocketId(userId);
          if (socketId) io.to(socketId).emit("messageExpired", payload);
        }
      }
    } catch (error) {
      await Message.updateOne(
        { _id: message._id },
        { $set: { mediaCleanupRetryAt: new Date(Date.now() + CLEANUP_RETRY_DELAY_MS) } }
      ).catch((retryError) => {
        console.error(
          `Could not schedule expired message cleanup retry for ${message._id}:`,
          retryError instanceof Error ? retryError.message : String(retryError)
        );
      });
      console.error(
        `Expired message cleanup failed for ${message._id}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  return { processedCount: expiredMessages.length, deletedCount };
};

export const startMessageRetentionCleanup = () => {
  let isCleanupRunning = false;

  const runCleanup = async () => {
    if (isCleanupRunning) return;
    isCleanupRunning = true;
    try {
      let result;
      let processedCount = 0;
      let deletedCount = 0;
      do {
        result = await cleanupExpiredMessages();
        processedCount += result.processedCount;
        deletedCount += result.deletedCount;
      } while (result.processedCount === CLEANUP_BATCH_SIZE);

      if (processedCount > 0) {
        console.log(
          `Expired message cleanup processed ${processedCount}; deleted ${deletedCount}.`
        );
      }
    } catch (error) {
      console.error(
        "Expired message cleanup could not complete:",
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      isCleanupRunning = false;
    }
  };

  void runCleanup();
  return setInterval(runCleanup, CLEANUP_INTERVAL_MS);
};
