import User from "../models/User.js";
import Feedback from "../models/Feedback.js";
import fs from "fs";
import path from "path";

const __dirname = path.resolve();
const FEEDBACK_FILE_PATH = path.join(__dirname, "feedback.json");
const FEEDBACK_RAW_PATH = path.join(__dirname, "feedback");

export const submitFeedback = async (req, res) => {
  try {
    const { name, email, category, rating, message } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Name is required." });
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ message: "Email address is required." });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "Feedback message is required." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Cross-check email ID against database
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (!existingUser) {
      return res.status(404).json({
        message: "Email ID not found in our database. Please use the email registered with your Samवाद account first, then submit your feedback.",
        emailNotFound: true,
      });
    }

    const ipAddress =
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      "";

    // 1. Save to MongoDB
    const feedbackDoc = new Feedback({
      name: name.trim(),
      email: normalizedEmail,
      category: ["General", "Feature Request", "Bug Report", "Praise"].includes(category)
        ? category
        : "General",
      rating: Number.isInteger(Number(rating)) && rating >= 1 && rating <= 5 ? Number(rating) : 5,
      message: message.trim(),
      ipAddress,
    });
    await feedbackDoc.save();

    // 2. Store feedback data in a separate file named feedback
    const feedbackEntry = {
      id: feedbackDoc._id.toString(),
      userId: existingUser._id.toString(),
      userFullName: existingUser.fullName,
      name: name.trim(),
      email: normalizedEmail,
      category: feedbackDoc.category,
      rating: feedbackDoc.rating,
      message: feedbackDoc.message,
      ipAddress,
      submittedAt: feedbackDoc.createdAt || new Date().toISOString(),
    };

    // Store in feedback.json
    try {
      let existingList = [];
      if (fs.existsSync(FEEDBACK_FILE_PATH)) {
        const fileContent = fs.readFileSync(FEEDBACK_FILE_PATH, "utf8");
        if (fileContent.trim()) {
          try {
            existingList = JSON.parse(fileContent);
            if (!Array.isArray(existingList)) existingList = [];
          } catch (e) {
            existingList = [];
          }
        }
      }
      existingList.push(feedbackEntry);
      fs.writeFileSync(FEEDBACK_FILE_PATH, JSON.stringify(existingList, null, 2), "utf8");
    } catch (fileErr) {
      console.error("Failed to write to feedback.json:", fileErr.message);
    }

    // Also append to dedicated file named "feedback"
    try {
      const line = `[${new Date().toISOString()}] User: ${existingUser.fullName} (${normalizedEmail}) | Category: ${feedbackDoc.category} | Rating: ${feedbackDoc.rating}/5 | Message: "${feedbackDoc.message}"\n`;
      fs.appendFileSync(FEEDBACK_RAW_PATH, line, "utf8");
    } catch (fileErr) {
      console.error("Failed to append to feedback file:", fileErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Thank you! Your feedback has been verified and received.",
    });
  } catch (error) {
    console.error("Error in submitFeedback controller:", error);
    return res.status(500).json({ message: "Internal server error. Please try again later." });
  }
};
