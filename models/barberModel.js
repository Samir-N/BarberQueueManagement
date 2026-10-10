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
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      default: 'barber',
    },
    barberStatus: {
      type: String,
      enum: ['online', 'offline'
        
      ],
      default: 'offline',
    },
    bookedFor:[ {
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