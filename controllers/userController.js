const userModel = require('../models/userModels.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  const secret = process.env.SECRET_KEY;
  if (!secret) {
    throw new Error('SECRET_KEY is not configured in environment variables');
  }
  return secret;
};

const loginController = async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).send({
        message: "Phone and password are required",
        success: false
      });
    }
    
    const user = await userModel.findOne({ phone });
   
    if (!user) {
      return res.status(200).send({
        message: "User not found",
        success: false
      });
    }
    
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(200).send({
        message: "Invalid Phone or Password",
        success: false
      });
    }
    
    // Standardized user payload containing both _id and id
    const safeUser = {
      _id: user._id,
      id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
    };

    let secretKey;
    try {
      secretKey = getJwtSecret();
    } catch (secretError) {
      console.error('Login controller - SECRET_KEY validation failed:', secretError.message);
      return res.status(500).send({
        success: false,
        message: 'Server configuration error',
      });
    }

    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      secretKey,
      { expiresIn: "1h" }
    );

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

const registerController = async (req, res) => {
  try {
    if (!req.body.phone || !req.body.password || !req.body.name || !req.body.role) {
      return res.status(400).send({
        message: "All fields (name, phone, password, role) are required",
        success: false
      });
    }

    const existingUser = await userModel.findOne({ phone: req.body.phone });

    if (existingUser) {
      return res.status(200).send({
        message: "User already exists",
        success: false
      });
    }

    const password = req.body.password;
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    req.body.password = hash;

    const newUser = new userModel(req.body);
    await newUser.save();

    const safeUser = {
      _id: newUser._id,
      id: newUser._id,
      name: newUser.name,
      phone: newUser.phone,
      role: newUser.role
    };

    const token = jwt.sign(
      { userId: newUser._id, phone: newUser.phone },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.status(201).send({
      message: "Register successful",
      success: true,
      token,
      user: safeUser,
      data: safeUser
    });

  } catch (error) {
    res.status(500).send({
      message: "Error in register controller",
      error: error.message,
      success: false
    });
  }
};

const authController = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await userModel.findById(userId);
    
    if (!user) {        
      return res.status(200).send({
        message: "User not found",
        success: false
      });
    } 
    
    const safeUser = {
      _id: user._id,
      id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
    };

    res.status(200).send({
      message: "User data fetched successfully",
      success: true,
      data: safeUser,
      user: safeUser
    });
  } catch (error) {
    res.status(500).send({        
      message: "Error in auth controller",        
      error: error.message,        
      success: false    
    });
  }   
};

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
    if (phone.length !== 10) {
  return res.status(400).send({
    message: "Phone number must be exactly 10 digits",
    success: false,
  });
}

    const existingPhoneUser = await userModel.findOne({ phone, _id: { $ne: id } });
    if (existingPhoneUser) {
      return res.status(400).send({
        message: "Phone number is already registered to another user",
        success: false,
      });
    }
    
    const updatedUser = await userModel.findByIdAndUpdate(
      id,
      { name, phone },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).send({
        message: "User not found",
        success: false,
      });
    }

    const safeUser = {
      _id: updatedUser._id,
      id: updatedUser._id,
      name: updatedUser.name,
      phone: updatedUser.phone,
      role: updatedUser.role,
    };

    return res.status(200).send({
      message: "Profile updated successfully",
      success: true,
      user: safeUser,
      data: safeUser
    });
  } catch (error) {
    console.error("Error in handleProfileEdit:", error);
    return res.status(500).send({
      message: "Error updating profile",
      error: error.message,
      success: false,
    });
  }
};

module.exports = {
  loginController,
  registerController,
  authController,
  handleProfileEdit
};