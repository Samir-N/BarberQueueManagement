const mongoose = require('mongoose');

const barberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      unique: true,
      validate: {
        validator: function (v) {
          // 1. Must be a 10-digit number starting with 9
          if (!/^9\d{9}$/.test(v)) return false;
          
          // 2. Prevent repeating digits (e.g., 9888888888)
          if (/(\d)\1{6,}/.test(v)) return false;

          // 3. Prevent simple sequences
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
      default: 'barber',
    },
    barberStatus: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline',
    },
    bookedFor: [{
      date: {
        type: Date,
        required: true,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('barber', barberSchema);