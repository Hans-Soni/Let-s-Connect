import mongoose from "mongoose";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message, { MESSAGE_RETENTION_MS } from "../models/Message.js";
import User from "../models/User.js";
import { encryptText, decryptText } from "../lib/encryption.js";
import { deleteMessageMedia } from "../lib/messageRetention.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_AUDIO_BYTES = 20 * 1024 * 1024; // 20 MB
const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Extracts mimeType and binary buffer from a base64 data URI or accepts an existing HTTPS url.
 * Handles whitespace, codecs parameters, linebreaks, and various audio/video/image formats.
 */
const parseMediaPayload = (payload) => {
  if (!payload || typeof payload !== "string") return null;
  const trimmed = payload.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return { isUrl: true, url: trimmed };
  }

  const base64Marker = ";base64,";
  const markerIndex = trimmed.indexOf(base64Marker);
  if (!trimmed.startsWith("data:") || markerIndex === -1) {
    return null;
  }

  const header = trimmed.slice(5, markerIndex);
  const rawBase64 = trimmed.slice(markerIndex + base64Marker.length).replace(/[\s\r\n]+/g, "");
  if (!rawBase64) return null;

  const mimeType = header.split(";")[0].toLowerCase().trim();
  try {
    const buffer = Buffer.from(rawBase64, "base64");
    if (!buffer || buffer.length === 0) return null;
    return { isUrl: false, mimeType, buffer, rawBase64, dataUri: `data:${mimeType};base64,${rawBase64}` };
  } catch {
    return null;
  }
};

const uploadMediaBuffer = (buffer, folder, resourceType = "video") =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder,
        chunk_size: 6000000,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (!result?.secure_url) {
          reject(new Error("Cloudinary media upload returned no secure URL."));
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer);
  });

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const me = await User.findById(loggedInUserId).select("blockedUsers").lean();
    const myBlockedList = (me?.blockedUsers || []).map((id) => id.toString());

    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } })
      .select("-password")
      .collation({ locale: "en", strength: 2 })
      .sort({ email: 1 })
      .lean();

    const sanitizedUsers = filteredUsers.map((u) => {
      const hasBlockedMe = u.blockedUsers?.some(
        (bId) => bId.toString() === loggedInUserId.toString()
      );
      const uObj = { ...u };
      if (hasBlockedMe) {
        uObj.profilePic = "";
        uObj.isBlockedByThem = true;
      }
      uObj.isBlockedByMe = myBlockedList.includes(u._id.toString());
      delete uObj.blockedUsers;
      return uObj;
    });

    res.status(200).json(sanitizedUsers);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;
    const retentionCutoff = new Date(Date.now() - MESSAGE_RETENTION_MS);

    if (!isValidObjectId(userToChatId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Automatically mark all messages from userToChatId to myId as seen
    await Message.updateMany(
      {
        senderId: userToChatId,
        receiverId: myId,
        isSeen: { $ne: true },
        createdAt: { $gte: retentionCutoff },
      },
      { $set: { isSeen: true, seenAt: new Date() } }
    ).catch(() => {});

    io.to(userToChatId.toString()).emit("messagesSeen", {
      chatPartnerId: myId.toString(),
      seenBy: myId.toString(),
    });

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
      createdAt: { $gte: retentionCutoff },
    })
      .sort({ createdAt: 1 })
      .lean();

    const decryptedMessages = messages.map((msg) => {
      const msgObj = { ...msg };
      delete msgObj.imagePublicId;
      delete msgObj.audioPublicId;
      delete msgObj.videoPublicId;
      delete msgObj.mediaCleanupRetryAt;
      if (msgObj.text) {
        msgObj.text = decryptText(msgObj.text);
      }
      return msgObj;
    });

    res.status(200).json(decryptedMessages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsSeen = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: senderId } = req.params;

    if (!isValidObjectId(senderId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const updateResult = await Message.updateMany(
      {
        senderId,
        receiverId: myId,
        isSeen: { $ne: true },
        createdAt: { $gte: new Date(Date.now() - MESSAGE_RETENTION_MS) },
      },
      { $set: { isSeen: true, seenAt: new Date() } }
    ).catch(() => ({ modifiedCount: 0 }));

    io.to(senderId.toString()).emit("messagesSeen", {
      chatPartnerId: myId.toString(),
      seenBy: myId.toString(),
    });

    res.status(200).json({ success: true, count: updateResult?.modifiedCount || 0 });
  } catch (error) {
    console.log("Error in markMessagesAsSeen controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio, video } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!isValidObjectId(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver ID" });
    }

    if (!text && !image && !audio && !video) {
      return res.status(400).json({ message: "Text, image, audio, or video is required." });
    }

    if (text && typeof text === "string" && text.length > 2000) {
      return res.status(400).json({ message: "Message cannot exceed 2000 characters." });
    }

    let parsedImage = null;
    if (image !== undefined && image !== null && image !== "") {
      parsedImage = parseMediaPayload(image);
      if (!parsedImage) {
        return res.status(400).json({ message: "Invalid image format. Supported formats: JPG, PNG, WebP, GIF, SVG, etc." });
      }
      if (!parsedImage.isUrl && parsedImage.buffer.length > MAX_IMAGE_BYTES) {
        return res.status(400).json({ message: "Image must be 15 MB or smaller." });
      }
    }

    let parsedAudio = null;
    if (audio !== undefined && audio !== null && audio !== "") {
      parsedAudio = parseMediaPayload(audio);
      if (!parsedAudio) {
        return res.status(400).json({ message: "Invalid audio format. Supported formats: MP3, WAV, WebM, OGG, M4A, AAC, etc." });
      }
      if (!parsedAudio.isUrl && parsedAudio.buffer.length > MAX_AUDIO_BYTES) {
        return res.status(400).json({ message: "Audio must be 20 MB or smaller." });
      }
    }

    let parsedVideo = null;
    if (video !== undefined && video !== null && video !== "") {
      parsedVideo = parseMediaPayload(video);
      if (!parsedVideo) {
        return res.status(400).json({ message: "Invalid video format. Supported formats: MP4, WebM, MOV, MKV, AVI, etc." });
      }
      if (!parsedVideo.isUrl && parsedVideo.buffer.length > MAX_VIDEO_BYTES) {
        return res.status(400).json({ message: "Video must be 25 MB or smaller." });
      }
    }

    if (senderId.equals(receiverId)) {
      return res.status(400).json({ message: "Cannot send messages to yourself." });
    }
    const sender = await User.findById(senderId).select("blockedUsers");
    const receiver = await User.findById(receiverId).select("blockedUsers");
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    const isReceiverBlockedBySender = sender?.blockedUsers?.some(
      (bId) => bId.toString() === receiverId.toString()
    );
    if (isReceiverBlockedBySender) {
      return res.status(403).json({ message: "You have blocked this user. Unblock them to send messages." });
    }

    const isSenderBlockedByReceiver = receiver?.blockedUsers?.some(
      (bId) => bId.toString() === senderId.toString()
    );
    if (isSenderBlockedByReceiver) {
      return res.status(403).json({ message: "You cannot send messages to this user." });
    }

    let imageUrl;
    let imagePublicId;
    if (parsedImage) {
      if (parsedImage.isUrl) {
        imageUrl = parsedImage.url;
      } else {
        const uploadResponse = await uploadMediaBuffer(parsedImage.buffer, "chat-images", "image");
        imageUrl = uploadResponse.secure_url;
        imagePublicId = uploadResponse.public_id;
      }
    }

    let audioUrl;
    let audioPublicId;
    if (parsedAudio) {
      if (parsedAudio.isUrl) {
        audioUrl = parsedAudio.url;
      } else {
        const uploadResponse = await uploadMediaBuffer(parsedAudio.buffer, "voice-messages", "video");
        audioUrl = uploadResponse.secure_url;
        audioPublicId = uploadResponse.public_id;
      }
    }

    let videoUrl;
    let videoPublicId;
    if (parsedVideo) {
      if (parsedVideo.isUrl) {
        videoUrl = parsedVideo.url;
      } else {
        const uploadResponse = await uploadMediaBuffer(parsedVideo.buffer, "video-messages", "video");
        videoUrl = uploadResponse.secure_url;
        videoPublicId = uploadResponse.public_id;
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: encryptText(text),
      image: imageUrl,
      imagePublicId,
      audio: audioUrl,
      audioPublicId,
      video: videoUrl,
      videoPublicId,
      isDelivered: true,
      isSeen: false,
    });

    await newMessage.save();

    const messageData = newMessage.toObject();
    delete messageData.imagePublicId;
    delete messageData.audioPublicId;
    delete messageData.videoPublicId;
    delete messageData.mediaCleanupRetryAt;
    const messageResponse = {
      ...messageData,
      text, // deliver plaintext to connected clients
      audio: audioUrl,
      video: videoUrl,
      isDelivered: true,
      isSeen: false,
      sender: {
        _id: req.user._id,
        fullName: req.user.fullName,
        profilePic: req.user.profilePic,
      },
    };

    // Broadcast to receiver's user room (delivers to all active devices/tabs of receiver)
    io.to(receiverId.toString()).emit("newMessage", messageResponse);

    // Broadcast to sender's user room (syncs multi-device / other tabs of sender)
    io.to(senderId.toString()).emit("newMessage", messageResponse);

    res.status(201).json(messageResponse);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const safeErrorMessage = errorMessage
      .replace(/data:[^\s]+/gi, "[media data omitted]")
      .slice(0, 500);
    console.log("Error in sendMessage controller:", safeErrorMessage);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const retentionCutoff = new Date(Date.now() - MESSAGE_RETENTION_MS);

    // find all the messages where the logged-in user is either sender or receiver, sorted newest first
    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
      createdAt: { $gte: retentionCutoff },
    })
      .sort({ createdAt: -1 })
      .lean();

    const lastMessageMap = new Map();
    const chatPartnerIds = [];
    const unreadCounts = new Map();

    for (const msg of messages) {
      const partnerId =
        msg.senderId.toString() === loggedInUserId.toString()
          ? msg.receiverId.toString()
          : msg.senderId.toString();

      if (!lastMessageMap.has(partnerId)) {
        chatPartnerIds.push(partnerId);
        lastMessageMap.set(partnerId, {
          _id: msg._id,
          text: msg.text ? decryptText(msg.text) : "",
          image: Boolean(msg.image),
          video: Boolean(msg.video),
          audio: Boolean(msg.audio),
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          createdAt: msg.createdAt,
          isSeen: msg.isSeen,
        });
      }

      if (msg.receiverId.toString() === loggedInUserId.toString() && !msg.isSeen) {
        unreadCounts.set(partnerId, (unreadCounts.get(partnerId) || 0) + 1);
      }
    }

    const me = await User.findById(loggedInUserId).select("blockedUsers").lean();
    const myBlockedList = (me?.blockedUsers || []).map((id) => id.toString());

    const chatPartners = await User.find({ _id: { $in: chatPartnerIds } })
      .select("-password")
      .lean();

    const sanitizedChatPartners = chatPartners.map((u) => {
      const uIdStr = u._id.toString();
      const hasBlockedMe = u.blockedUsers?.some(
        (bId) => bId.toString() === loggedInUserId.toString()
      );
      const uObj = { ...u };
      if (hasBlockedMe) {
        uObj.profilePic = "";
        uObj.isBlockedByThem = true;
      }
      uObj.isBlockedByMe = myBlockedList.includes(uIdStr);
      uObj.unreadCount = unreadCounts.get(uIdStr) || 0;
      uObj.lastMessage = lastMessageMap.get(uIdStr) || null;
      delete uObj.blockedUsers;
      return uObj;
    });

    // Sort conversations: newest activity at top
    sanitizedChatPartners.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    res.status(200).json(sanitizedChatPartners);
  } catch (error) {
    console.error("Error in getChatPartners: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id).select("-password").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const myId = req.user._id;
    // Check if the target user has blocked me
    const isMeBlockedByTarget = user.blockedUsers?.some(
      (bId) => bId.toString() === myId.toString()
    );

    const userObj = { ...user };
    if (isMeBlockedByTarget) {
      userObj.profilePic = ""; // Hide DP from blocked user
      userObj.isBlockedByThem = true;
    }

    // Also check if I have blocked the target user
    const me = await User.findById(myId).select("blockedUsers").lean();
    const isTargetBlockedByMe = me?.blockedUsers?.some(
      (bId) => bId.toString() === id.toString()
    );
    userObj.isBlockedByMe = Boolean(isTargetBlockedByMe);
    delete userObj.blockedUsers; // Never expose target user's blocked list

    res.status(200).json(userObj);
  } catch (error) {
    console.error("Error in getUserProfile controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const blockUser = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToBlockId } = req.params;

    if (!isValidObjectId(userToBlockId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (myId.toString() === userToBlockId.toString()) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      myId,
      { $addToSet: { blockedUsers: userToBlockId } },
      { new: true }
    ).select("blockedUsers");

    const receiverSocketId = getReceiverSocketId(userToBlockId?.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userBlocked", {
        blockerId: myId.toString(),
      });
    }

    res.status(200).json({
      message: "User blocked successfully",
      blockedUsers: updatedUser.blockedUsers,
    });
  } catch (error) {
    console.error("Error in blockUser controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToUnblockId } = req.params;

    if (!isValidObjectId(userToUnblockId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      myId,
      { $pull: { blockedUsers: userToUnblockId } },
      { new: true }
    ).select("blockedUsers");

    const receiverSocketId = getReceiverSocketId(userToUnblockId?.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userUnblocked", {
        blockerId: myId.toString(),
      });
    }

    res.status(200).json({
      message: "User unblocked successfully",
      blockedUsers: updatedUser.blockedUsers,
    });
  } catch (error) {
    console.error("Error in unblockUser controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const myId = req.user._id;
    const user = await User.findById(myId).select("blockedUsers").lean();
    res.status(200).json(user?.blockedUsers || []);
  } catch (error) {
    console.error("Error in getBlockedUsers controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteChatHistory = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    if (!isValidObjectId(userToChatId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const conversationMessages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });
    for (const message of conversationMessages) {
      await deleteMessageMedia(message);
    }
    const result = await Message.deleteMany({
      _id: { $in: conversationMessages.map((message) => message._id) },
    });

    io.to(userToChatId.toString()).emit("chatHistoryDeleted", {
      chatPartnerId: myId.toString(),
    });

    res.status(200).json({
      message: "Chat history deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error in deleteChatHistory controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
