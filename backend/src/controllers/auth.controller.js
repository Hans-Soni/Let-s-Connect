import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import { generateToken } from "../lib/utils.js";
import Consent from "../models/Consent.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { ENV } from "../lib/env.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";
import { extractClientIp } from "../lib/ipUtils.js";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(ENV.GOOGLE_CLIENT_ID);

export const signup = async (req, res) => {
  const { fullName, email, password, dataConsent } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (dataConsent !== true) {
      return res.status(400).json({
        message: "You must accept the terms and authorize data processing to create an account",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (password.length > 128) {
      return res.status(400).json({ message: "Password cannot exceed 128 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedFullName = fullName.trim();

    // check if email is valid: regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (user) return res.status(400).json({ message: "Email already exists" });

    // 123456 => $dnjasdkasj_?dmsakmk
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const acceptedAt = new Date();
    const newUser = new User({
      fullName: normalizedFullName,
      email: normalizedEmail,
      designation: "",
      password: hashedPassword,
    });

    if (newUser) {
      const savedUser = await newUser.save();
      const clientIp = extractClientIp(req);
      try {
        await Consent.create({
          accepted: true,
          termsVersion: "2.0",
          acceptedAt,
          ipAddress: clientIp,
          emailId: normalizedEmail,
          userId: savedUser._id,
        });
      } catch (error) {
        try {
          await User.deleteOne({ _id: savedUser._id });
        } catch (rollbackError) {
          console.error("Failed to roll back account after consent record creation failed:", rollbackError);
        }
        throw error;
      }

      const token = generateToken(savedUser._id, res);

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        designation: newUser.designation || "",
        profilePic: newUser.profilePic,
        token: token,
      });

      // Broadcast new user arrival to all connected clients
      try {
        io.emit("newUser", {
          _id: savedUser._id,
          fullName: savedUser.fullName,
          email: savedUser.email,
          designation: savedUser.designation || "",
          profilePic: savedUser.profilePic,
        });
      } catch (socketErr) {
        console.error("Socket broadcast error for newUser:", socketErr);
      }

      try {
        await sendWelcomeEmail(savedUser.email, savedUser.fullName, ENV.CLIENT_URL);
      } catch (error) {
        console.error("Failed to send welcome email:", error);
      }
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.password && user.googleId) {
      return res.status(400).json({
        message: "This account was registered using Google. Please sign in with Google.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      designation: user.designation || "",
      profilePic: user.profilePic,
      token: token,
    });
  } catch (error) {
    console.error("Error in login controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { credential, clientIp } = req.body;

    if (!credential || typeof credential !== "string") {
      return res.status(400).json({ message: "Google credential is required" });
    }

    // 1. Verify Google ID token
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: ENV.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.error("Google verifyIdToken failed:", verifyError.message);
      return res.status(401).json({ message: "Invalid or expired Google credential" });
    }

    if (!payload?.email) {
      return res.status(400).json({ message: "Google account does not provide a valid email" });
    }

    const email = payload.email.toLowerCase().trim();
    const fullName = payload.name?.trim() || email.split("@")[0];
    const profilePic = payload.picture || "";
    const googleId = payload.sub;

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      // 2. New user registration via Google
      isNewUser = true;
      user = new User({
        fullName,
        email,
        profilePic,
        googleId,
        designation: "",
      });

      const savedUser = await user.save();

      // Record legal consent (Terms v2.0) with verified client IP
      const ipAddress = clientIp && typeof clientIp === "string" ? clientIp : extractClientIp(req);
      try {
        await Consent.create({
          accepted: true,
          termsVersion: "2.0",
          acceptedAt: new Date(),
          ipAddress,
          emailId: email,
          userId: savedUser._id,
        });
      } catch (consentError) {
        console.error("Consent record creation warning for Google user:", consentError.message);
      }

      // Broadcast new user to all connected clients
      try {
        io.emit("newUser", {
          _id: savedUser._id,
          fullName: savedUser.fullName,
          email: savedUser.email,
          designation: savedUser.designation || "",
          profilePic: savedUser.profilePic,
        });
      } catch (socketErr) {
        console.error("Socket broadcast error for newUser:", socketErr);
      }
    } else {
      // 3. Existing user logging in with Google: link account & sync profile picture if empty
      let needsSave = false;
      if (!user.googleId) {
        user.googleId = googleId;
        needsSave = true;
      }
      if (!user.profilePic && profilePic) {
        user.profilePic = profilePic;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    }

    // 4. Issue app session token & set httpOnly cookie
    const token = generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      designation: user.designation || "",
      profilePic: user.profilePic,
      token,
      isNewUser,
    });
  } catch (error) {
    console.error("Error in googleAuth controller:", error);
    res.status(500).json({ message: "Internal server error during Google authentication" });
  }
};

export const logout = (_, res) => {
  res.cookie("jwt", "", { maxAge: 0, partitioned: true, secure: true, sameSite: "none" });
  res.status(200).json({ message: "Logged out successfully" });
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, profilePic, designation } = req.body;
    const updates = {};

    if (fullName !== undefined) {
      if (typeof fullName !== "string" || !fullName.trim() || fullName.trim().length > 50) {
        return res.status(400).json({ message: "Name must be between 1 and 50 characters" });
      }
      updates.fullName = fullName.trim();
    }

    if (designation !== undefined) {
      if (typeof designation !== "string" || designation.trim().length > 100) {
        return res.status(400).json({ message: "Designation cannot exceed 100 characters" });
      }
      updates.designation = designation.trim();
    }

    if (profilePic !== undefined) {
      if (typeof profilePic !== "string" || !profilePic.startsWith("data:image/")) {
        return res.status(400).json({ message: "A valid profile image is required" });
      }
      const uploadResponse = await cloudinary.uploader.upload(profilePic, {
        resource_type: "image",
        folder: "profile_pictures",
      });
      updates.profilePic = uploadResponse.secure_url;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Provide a name, designation, or profile image to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    const publicProfile = {
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      profilePic: updatedUser.profilePic,
      designation: updatedUser.designation || "",
    };
    io.emit("profileUpdated", publicProfile);

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getConsentRecord = async (req, res) => {
  try {
    const consent = await Consent.findOne({ userId: req.user._id })
      .select("accepted termsVersion acceptedAt ipAddress")
      .lean();

    if (!consent) {
      return res.status(404).json({ message: "Consent record not found" });
    }

    return res.status(200).json(consent);
  } catch (error) {
    console.error("Error fetching consent record:", error);
    return res.status(500).json({ message: "Unable to load consent record" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      return res.status(400).json({ message: "All password fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "The new passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (newPassword.length > 128) {
      return res.status(400).json({ message: "Password cannot exceed 128 characters" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // If user already has a password, verify currentPassword
    if (user.password) {
      if (typeof currentPassword !== "string") {
        return res.status(400).json({ message: "Current password is required" });
      }
      const isCurrentPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordCorrect) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const isNewPasswordSame = await bcrypt.compare(newPassword, user.password);
      if (isNewPasswordSame) {
        return res.status(400).json({ message: "Choose a new password different from your current one" });
      }
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({ message: "Unable to change password" });
  }
};
