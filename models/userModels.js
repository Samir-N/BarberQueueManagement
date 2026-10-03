const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    name: {
    type:String,
    required:[true, "Please provide a name"]
    },

    phone: {
    type: Number, 
    required: [true, "Please provide a phone number"]
  },
  password: {
    type: String,
    required: [true, "Please provide a password"]
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
}
});

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;