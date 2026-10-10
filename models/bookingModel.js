const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    barberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "barber",
      required: true,
      index: true,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    bookingTime: {
      type: Date,
      required: true,
    },

    expiresAt: {
      type: Date,
      index: {
        expireAfterSeconds: 0,
      },
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"], // ✅ Added "completed" here
      default: "pending",
    },
  },
  { timestamps: true }
);

bookingSchema.index(
  { barberId: 1, bookingTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      barberId: { $exists: true },
      status: { $in: ["pending", "confirmed", "completed", "cancelled"] },
    },
  }
);

const bookingModel = mongoose.model("Booking", bookingSchema);

module.exports = bookingModel;