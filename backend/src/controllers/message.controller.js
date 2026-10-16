import mongoose from "mongoose";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { encryptText, decryptText } from "../lib/encryption.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

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

    if (!isValidObjectId(userToChatId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Automatically mark all messages from userToChatId to myId as seen
    await Message.updateMany(
      { senderId: userToChatId, receiverId: myId, isSeen: { $ne: true } },
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
    }).sort({ createdAt: 1 });

    const decryptedMessages = messages.map((msg) => {
      const msgObj = msg.toObject();
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
      { senderId, receiverId: myId, isSeen: { $ne: true } },
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
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!isValidObjectId(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver ID" });
    }

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }

    if (text && typeof text === "string" && text.length > 2000) {
      return res.status(400).json({ message: "Message cannot exceed 2000 characters." });
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
    if (image) {
      // upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: encryptText(text),
      image: imageUrl,
      isDelivered: true,
      isSeen: false,
    });

    await newMessage.save();

    const messageResponse = {
      ...newMessage.toObject(),
      text, // deliver plaintext to connected clients
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
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // find all the messages where the logged-in user is either sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
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

    const result = await Message.deleteMany({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
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

