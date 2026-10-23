import mongoose from "mongoose";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message, { MESSAGE_RETENTION_MS } from "../models/Message.js";
import User from "../models/User.js";
import { encryptText, decryptText } from "../lib/encryption.js";
import { deleteMessageMedia } from "../lib/messageRetention.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const MAX_AUDIO_BYTES = 3 * 1024 * 1024;
const MAX_VIDEO_BYTES = 3 * 1024 * 1024;
const AUDIO_DATA_URI_PATTERN =
  /^data:(audio\/(?:webm|mp4|ogg|wav|mpeg))(?:;codecs=[a-z0-9._-]+)?;base64,([A-Za-z0-9+/]+={0,2})$/i;
const VIDEO_DATA_URI_PATTERN =
  /^data:(video\/(?:mp4|webm|quicktime));base64,([A-Za-z0-9+/]+={0,2})$/i;

const uploadMediaBuffer = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "video", folder },
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
    const me = await User.findById(loggedInUserId).select("blockedUsers");
    const myBlockedList = (me?.blockedUsers || []).map((id) => id.toString());

    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } })
      .select("-password")
      .collation({ locale: "en", strength: 2 })
      .sort({ email: 1 });

    const sanitizedUsers = filteredUsers.map((u) => {
      const uObj = u.toObject();
      const hasBlockedMe = u.blockedUsers?.some(
        (bId) => bId.toString() === loggedInUserId.toString()
      );
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

    const senderSocketId = getReceiverSocketId(userToChatId?.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", {
        chatPartnerId: myId.toString(),
        seenBy: myId.toString(),
      });
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
      createdAt: { $gte: retentionCutoff },
    }).sort({ createdAt: 1 });

    const decryptedMessages = messages.map((msg) => {
      const msgObj = msg.toObject();
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

    const senderSocketId = getReceiverSocketId(senderId?.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", {
        chatPartnerId: myId.toString(),
        seenBy: myId.toString(),
      });
    }

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

    let audioBuffer;
    if (audio !== undefined) {
      const audioMatch = typeof audio === "string" ? audio.match(AUDIO_DATA_URI_PATTERN) : null;
      const audioBase64 = audioMatch?.[2];
      audioBuffer = audioBase64 ? Buffer.from(audioBase64, "base64") : null;
      if (
        !audioMatch ||
        !audioBase64 ||
        audioBase64.length % 4 !== 0 ||
        !audioBuffer?.length ||
        audioBuffer.length > MAX_AUDIO_BYTES ||
        audioBuffer.toString("base64") !== audioBase64
      ) {
        return res.status(400).json({
          message: "Audio must be a supported recording no larger than 3 MB.",
        });
      }
    }

    let videoBuffer;
    if (video !== undefined) {
      const videoMatch = typeof video === "string" ? video.match(VIDEO_DATA_URI_PATTERN) : null;
      const videoBase64 = videoMatch?.[2];
      videoBuffer = videoBase64 ? Buffer.from(videoBase64, "base64") : null;
      if (
        !videoMatch ||
        !videoBase64 ||
        videoBase64.length % 4 !== 0 ||
        !videoBuffer?.length ||
        videoBuffer.length > MAX_VIDEO_BYTES ||
        videoBuffer.toString("base64") !== videoBase64
      ) {
        return res.status(400).json({
          message: "Video must be an MP4, WebM, or MOV recording no larger than 3 MB.",
        });
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
    if (image) {
      // upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
      imagePublicId = uploadResponse.public_id;
    }

    let audioUrl;
    let audioPublicId;
    if (audioBuffer) {
      const uploadResponse = await uploadMediaBuffer(audioBuffer, "voice-messages");
      audioUrl = uploadResponse.secure_url;
      audioPublicId = uploadResponse.public_id;
    }

    let videoUrl;
    let videoPublicId;
    if (videoBuffer) {
      const uploadResponse = await uploadMediaBuffer(videoBuffer, "video-messages");
      videoUrl = uploadResponse.secure_url;
      videoPublicId = uploadResponse.public_id;
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

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", messageResponse);
    }

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

    // find all the messages where the logged-in user is either sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
      createdAt: { $gte: retentionCutoff },
    });

    const chatPartnerIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === loggedInUserId.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString()
        )
      ),
    ];

    const me = await User.findById(loggedInUserId).select("blockedUsers");
    const myBlockedList = (me?.blockedUsers || []).map((id) => id.toString());

    const chatPartners = await User.find({ _id: { $in: chatPartnerIds } })
      .select("-password")
      .collation({ locale: "en", strength: 2 })
      .sort({ email: 1 });

    const sanitizedChatPartners = chatPartners.map((u) => {
      const uObj = u.toObject();
      const hasBlockedMe = u.blockedUsers?.some(
        (bId) => bId.toString() === loggedInUserId.toString()
      );
      if (hasBlockedMe) {
        uObj.profilePic = "";
        uObj.isBlockedByThem = true;
      }
      uObj.isBlockedByMe = myBlockedList.includes(u._id.toString());
      delete uObj.blockedUsers;
      return uObj;
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

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const myId = req.user._id;
    // Check if the target user has blocked me
    const isMeBlockedByTarget = user.blockedUsers?.some(
      (bId) => bId.toString() === myId.toString()
    );

    const userObj = user.toObject();
    if (isMeBlockedByTarget) {
      userObj.profilePic = ""; // Hide DP from blocked user
      userObj.isBlockedByThem = true;
    }

    // Also check if I have blocked the target user
    const me = await User.findById(myId).select("blockedUsers");
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
    const user = await User.findById(myId).select("blockedUsers");
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

    const receiverSocketId = getReceiverSocketId(userToChatId?.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("chatHistoryDeleted", {
        chatPartnerId: myId.toString(),
      });
    }

    res.status(200).json({
      message: "Chat history deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error in deleteChatHistory controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
