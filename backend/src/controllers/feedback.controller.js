import Feedback from "../models/Feedback.js";

export const submitFeedback = async (req, res) => {
  try {
    const { name, email, category, rating, message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "Feedback message is required." });
    }

    const ipAddress =
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      "";

    const feedback = new Feedback({
      name: name?.trim() || "Anonymous",
      email: email?.trim() || "",
      category: ["General", "Feature Request", "Bug Report", "Praise"].includes(category)
        ? category
        : "General",
      rating: Number.isInteger(Number(rating)) && rating >= 1 && rating <= 5 ? Number(rating) : 5,
      message: message.trim(),
      ipAddress,
    });

    await feedback.save();

    return res.status(201).json({
      success: true,
      message: "Thank you! Your feedback has been received.",
    });
  } catch (error) {
    console.error("Error in submitFeedback controller:", error.message);
    return res.status(500).json({ message: "Internal server error. Please try again later." });
  }
};
