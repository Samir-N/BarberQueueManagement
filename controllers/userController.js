const userModel = require('../models/userModels.js');
const barberModel = require('../models/barberModel.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Regex validator for Nepali phone numbers (10 digits starting with 98 or 97)
const isValidNepaliPhone = (phone) => {
  return /^(98|97)\d{8}$/.test(String(phone).trim());
};

const getJwtSecret = () => {
  const secret = process.env.SECRET_KEY;
  if (!secret) {
    throw new Error('SECRET_KEY is not configured in environment variables');
  }
  return secret;
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 604800000, 
};

const generatePublicId = (length = 5) => {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
};

// User Login Controller
const loginController = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).send({
        message: "Phone and password are required",
        success: false
      });
    }

    const cleanPhone = String(phone).trim();

    if (!isValidNepaliPhone(cleanPhone)) {
      return res.status(400).send({
        message: "Please provide a valid 10-digit phone number starting with 98 or 97.",
        success: false
      });
    }

    const user = await userModel.findOne({ phone: cleanPhone });
    if (!user) {
      return res.status(404).send({
        message: "User not found",
        success: false
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send({
        message: "Invalid Phone or Password",
        success: false
      });
    }

    const safeUser = {
      _id: user._id,
      id: user._id,
      publicId: user.publicId,
      name: user.name,
      phone: user.phone,
      role: user.role || "user",
    };

    const secretKey = getJwtSecret();
    const token = jwt.sign(
      { userId: user._id, id: user._id, role: safeUser.role, phone: user.phone },
      secretKey,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, cookieOptions);

    res.status(200).send({
      user: safeUser,
      data: safeUser,
      message: "Login successful",
      success: true,
      token
    });

  } catch (error) {
    console.error('Error in login controller:', error);
    res.status(500).send({
      success: false,
      message: error.message || 'Error in login controller',
    });
  }
};

// User Register Controller
const registerController = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).send({
        message: "All fields (name, phone, password) are required",
        success: false
      });
    }

    // Plain-text password check: at least 5 chars and includes at least one digit
    if (!/^(?=.*\d).{5,}$/.test(password)) {
      return res.status(400).send({
        success: false,
        message: "Password must be at least 5 characters and include at least one number.",
      });
    }

    const cleanPhone = String(phone).trim();

    if (!isValidNepaliPhone(cleanPhone)) {
      return res.status(400).send({
        message: "Please provide a valid 10-digit phone number starting with 98 or 97.",
        success: false,
      });
    }

    const existingUser = await userModel.findOne({ phone: cleanPhone });
    const existingBarber = await barberModel.findOne({ phone: cleanPhone });
    if (existingUser || existingBarber) {
      return res.status(400).send({
        message: "User already exists",
        success: false
      });
    }

    let publicId;
    do {
      publicId = generatePublicId();
    } while (await userModel.exists({ publicId }));

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      phone: cleanPhone,
      password: hashedPassword,
      role: "user",
      publicId,
    });
    await newUser.save();

    const safeUser = {
      _id: newUser._id,
      id: newUser._id,
      publicId: newUser.publicId,
      name: newUser.name,
      phone: newUser.phone,
      role: newUser.role
    };

    const secretKey = getJwtSecret();
    const token = jwt.sign(
      { userId: newUser._id, id: newUser._id, role: newUser.role, phone: newUser.phone },
      secretKey,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, cookieOptions);

    res.status(201).send({
      message: "Register successful",
      success: true,
      token,
      user: safeUser,
      data: safeUser
    });

  } catch (error) {
    console.error("Error in register controller:", error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).send({
        message: messages[0],
        success: false
      });
    }

    res.status(500).send({
      message: "Error in register controller",
      error: error.message,
      success: false
    });
  }
};

// Fetch Single User Data Controller (/api/v1/user/getUserData)
const authController = async (req, res) => {
  try {
    const userId = req.body.userId || req.userId;

    if (!userId) {
      return res.status(400).send({
        message: "User ID is required",
        success: false
      });
    }

    const user = await userModel.findById(userId).select('-password');

    if (!user) {
      return res.status(404).send({
        message: "User not found",
        success: false
      });
    }

    const safeUser = {
      _id: user._id,
      id: user._id,
      publicId: user.publicId || null,
      name: user.name,
      phone: user.phone,
      role: user.role || "user",
    };

    res.status(200).send({
      message: "User data fetched successfully",
      success: true,
      data: safeUser,
      user: safeUser
    });
  } catch (error) {
    console.error('Error in auth controller:', error);
    res.status(500).send({
      message: "Error in auth controller",
      error: error.message,
      success: false
    });
  }
};

// Profile Edit Controller with 15-day Cooldown
const handleProfileEdit = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const { id } = req.params;

    if (!name || !phone) {
      return res.status(400).send({
        message: "Name and phone are required",
        success: false,
      });
    }

    const cleanPhone = String(phone).trim();

    if (!isValidNepaliPhone(cleanPhone)) {
      return res.status(400).send({
        message: "Please provide a valid 10-digit phone number starting with 98 or 97.",
        success: false,
      });
    }

    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).send({
        message: "User not found",
        success: false,
      });
    }

    if (user.lastProfileUpdate) {
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(user.lastProfileUpdate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const cooldownDays = 15;

      if (daysSinceUpdate < cooldownDays) {
        const remainingDays = cooldownDays - daysSinceUpdate;
        return res.status(400).send({
          message: `You can update your profile again in ${remainingDays} day(s).`,
          success: false,
        });
      }
    }

    const existingPhoneUser = await userModel.findOne({
      phone: cleanPhone,
      _id: { $ne: id },
    });
    const existingPhoneBarber = await barberModel.findOne({ phone: cleanPhone });

    if (existingPhoneUser || existingPhoneBarber) {
      return res.status(400).send({
        message: "Phone number is already registered to another account",
        success: false,
      });
    }

    user.name = name;
    user.phone = cleanPhone;
    user.lastProfileUpdate = new Date();
    await user.save();

    const safeUser = {
      _id: user._id,
      id: user._id,
      publicId: user.publicId || null,
      name: user.name,
      phone: user.phone,
      role: user.role,
    };

    return res.status(200).send({
      message: "Profile updated successfully",
      success: true,
      user: safeUser,
      data: safeUser
    });
  } catch (error) {
    console.error("Error in handleProfileEdit:", error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).send({
        message: messages[0],
        success: false
      });
    }

    return res.status(500).send({
      message: "Error updating profile",
      error: error.message,
      success: false,
    });
  }
};

// User Logout Controller
const UserLogoutController = async (req, res) => {
  try {
    res.clearCookie("token", {
      ...cookieOptions,
      maxAge: 0,
    });

    return res.status(200).send({
      message: "Logged out successfully",
      success: true,
    });
  } catch (error) {
    console.error('Error in logout controller:', error);
    res.status(500).send({
      message: "Error in logout controller",
      error: error.message,
      success: false,
    });
  }
};

module.exports = {
  UserLogoutController,
  loginController,
  registerController,
  authController,
  handleProfileEdit
};