const barberModel = require('../models/barberModel.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
  maxAge: 3600000, // 1 hour
};

// Barber Register Controller
const BarberRegisterController = async (req, res) => {
  try {
    const { name, phone, password, barberSecretKey } = req.body || {};

    if (!name || !phone || !password || !barberSecretKey) {
      return res.status(400).send({
        message: "All fields including barberSecretKey are required",
        success: false
      });
    }

    if (password.length > 10) {
      return res.status(400).send({
        success: false,
        message: "Password cannot exceed 10 characters",
      });
    }

    const envKey = process.env.BARBER_SECRET_KEY ? String(process.env.BARBER_SECRET_KEY).trim() : null;
    const providedKey = String(barberSecretKey).trim();

    if (!envKey || providedKey !== envKey) {
      return res.status(400).send({
        success: false,
        message: "Invalid or missing Barber Secret Key",
      });
    }

    const cleanPhone = String(phone).trim();
    if (cleanPhone.length !== 10) {
      return res.status(400).send({
        success: false,
        message: "Phone number must be exactly 10 digits",
      });
    }

    const existingBarber = await barberModel.findOne({ phone: cleanPhone });
    if (existingBarber) {
      return res.status(400).send({
        success: false,
        message: "Barber already exists"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newBarber = new barberModel({
      name,
      phone: cleanPhone,
      password: hashedPassword,
      role: 'barber',
      barberStatus: 'online'
    });
    await newBarber.save();

    const safeBarber = {
      _id: newBarber._id,
      id: newBarber._id,
      name: newBarber.name,
      phone: newBarber.phone,
      role: newBarber.role,
      barberStatus: newBarber.barberStatus,
    };

    const secretKey = getJwtSecret();
    const token = jwt.sign(
      { userId: newBarber._id, id: newBarber._id, role: newBarber.role, phone: newBarber.phone },
      secretKey,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, cookieOptions);

    const io = req.app.get("io");
    if (io) io.emit("barberStatusChanged", safeBarber);

    res.status(201).send({
      success: true,
      message: "Barber Registered Successfully",
      token,
      user: safeBarber,
      data: safeBarber
    });
  } catch (error) {
    console.error('Error in Barber Register API:', error);
    res.status(500).send({
      success: false,
      message: "Error in Barber Register API",
      error: error.message
    });
  }
};

// Barber Login Controller
const BarberLoginController = async (req, res) => {
  try {
    const { phone, password } = req.body || {};

    if (!phone || !password) {
      return res.status(400).send({
        message: "Phone and password are required",
        success: false
      });
    }

    const cleanPhone = String(phone).trim();
    if (cleanPhone.length !== 10) {
      return res.status(400).send({
        message: "Phone number must be exactly 10 digits",
        success: false,
      });
    }

    if (password.length > 10) {
      return res.status(400).send({
        success: false,
        message: "Password cannot exceed 10 characters",
      });
    }

    const barber = await barberModel.findOne({ phone: cleanPhone });
    if (!barber) {
      return res.status(404).send({
        success: false,
        message: "Barber not found"
      });
    }

    const isMatch = await bcrypt.compare(password, barber.password);
    if (!isMatch) {
      return res.status(401).send({
        success: false,
        message: "Invalid Phone or Password"
      });
    }

    barber.barberStatus = 'online';
    await barber.save();

    const safeBarber = {
      _id: barber._id,
      id: barber._id,
      name: barber.name,
      phone: barber.phone,
      role: barber.role,
      barberStatus: barber.barberStatus,
    };

    const secretKey = getJwtSecret();
    const token = jwt.sign(
      { userId: barber._id, id: barber._id, role: barber.role, phone: barber.phone },
      secretKey,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, cookieOptions);

    const io = req.app.get("io");
    if (io) io.emit("barberStatusChanged", safeBarber);

    res.status(200).send({
      success: true,
      message: "Login Successful",
      token,
      user: safeBarber,
      data: safeBarber
    });
  } catch (error) {
    console.error('Error in Barber Login API:', error);
    res.status(500).send({
      success: false,
      message: "Error in Barber Login API",
      error: error.message
    });
  }
};

// Barber Logout Controller
const BarberLogoutController = async (req, res) => {
  try {
    const userId = req.userId || req.body?.userId;

    if (!userId) {
      return res.status(400).send({
        success: false,
        message: "User ID is required"
      });
    }

    const updatedBarber = await barberModel.findByIdAndUpdate(
      userId, 
      { barberStatus: 'offline' },
      { new: true }
    );

    res.clearCookie("token", cookieOptions);

    if (!updatedBarber) {
      return res.status(404).send({
        success: false,
        message: "Barber not found"
      });
    }

    const safeBarber = {
      _id: updatedBarber._id,
      id: updatedBarber._id,
      name: updatedBarber.name,
      phone: updatedBarber.phone,
      role: updatedBarber.role,
      barberStatus: updatedBarber.barberStatus,
    };

    const io = req.app.get("io");
    if (io) io.emit("barberStatusChanged", safeBarber);

    res.status(200).send({
      success: true,
      message: "Logout Successful. Status set to offline."
    });
  } catch (error) {
    console.error('Error in Barber Logout API:', error);
    res.status(500).send({
      success: false,
      message: "Error in Barber Logout API",
      error: error.message
    });
  }
};

// Fetch Single Barber Details Controller (/api/v1/barber/getBarberData)
const getBarberData = async (req, res) => {
  try {
    const userId = req.userId || req.body?.userId;

    if (!userId) {
      return res.status(401).send({
        success: false,
        message: "User ID is required"
      });
    }

    const barber = await barberModel.findById(userId).select('-password');

    if (!barber) {
      return res.status(404).send({
        success: false,
        message: "Barber not found"
      });
    }

    const safeBarber = {
      _id: barber._id,
      id: barber._id,
      name: barber.name,
      phone: barber.phone,
      role: barber.role,
      barberStatus: barber.barberStatus,
    };

    res.status(200).send({
      success: true,
      message: "Barber details fetched successfully",
      user: safeBarber,
      data: safeBarber
    });
  } catch (error) {
    console.error('Error in fetchBarberDetails:', error);
    res.status(500).send({
      success: false,
      message: "Auth error",
      error: error.message
    });
  }
};

// Fetch All Barbers Controller
const getAllBarbersController = async (req, res) => {
  try {
    const barbers = await barberModel.find({}, { password: 0 });

    res.status(200).send({
      success: true,
      message: "Barbers fetched successfully",
      data: barbers,
      barbers: barbers
    });
  } catch (error) {
    console.error('Error in getAllBarbersController:', error);
    res.status(500).send({
      success: false,
      message: "Error fetching all barbers",
      error: error.message
    });
  }
};

module.exports = {
  BarberRegisterController,
  BarberLoginController,
  BarberLogoutController,
  getBarberData,
  getAllBarbersController,
};