const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"]
  },
  phone: {
    type: String, 
    required: [true, "Please provide a phone number"],
    validate: {
      validator: function (v) {
        // 1. Must be a 10-digit number starting with 9
        if (!/^9\d{9}$/.test(v)) return false;
        
        // 2. Prevent repeating digits (e.g., 9888888888, 9811111111)
        if (/(\d)\1{6,}/.test(v)) return false;

        // 3. Prevent simple sequences (e.g., 9876543210)
        if (v === "9876543210" || v === "0123456789") return false;

        return true;
      },
      message: "Please provide a valid, non-repetitive 10-digit phone number.",
    },
  },
  password: {
  type: String,
  required: [true, "Password is required"],
  validate: {
    validator: function (v) {
      // At least 5 characters long and contains at least one digit
      return /^(?=.*\d).{5,}$/.test(v);
    },
    message: "Password must be at least 5 characters and include at least one number.",
  },
},
  role: {
    type: String,
    enum: ['user'],
    default: 'user',
    required: [true, "Please provide a role"]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  publicId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  lastProfileUpdate: { type: Date, default: null }
});

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;