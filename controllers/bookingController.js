const mongoose = require("mongoose");
const bookingModel = require("../models/bookingModel");
const barberModel = require("../models/barberModel");

const findBarberConflict = async (barberId, appointmentDate, excludeId = null) => {
  const slotStart = new Date(appointmentDate);
  slotStart.setSeconds(0, 0);
  const slotEnd = new Date(slotStart.getTime() + 60 * 1000);

  const query = {
    barberId,
    bookingTime: { $gte: slotStart, $lt: slotEnd },
    status: { $ne: "cancelled" },
  };
  if (excludeId) query._id = { $ne: excludeId };

  return bookingModel.findOne(query);
};

/**
 * @desc    Create new booking
 * @route   POST /api/v1/user/bookingInfo
 */
const bookingController = async (req, res) => {
  try {
    const { service, bookingTime, barberId } = req.body;

    const userId = req.user?._id || req.user?.id || req.userId || req.body?.userId;
    const cleanServiceId = typeof service === "object" ? (service?._id || service?.id) : service;
    const cleanBarberId = typeof barberId === "object" ? (barberId?._id || barberId?.id) : barberId;

    if (!cleanServiceId || !bookingTime || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: service, bookingTime, and userId are required",
      });
    }

    if (!cleanBarberId) {
      return res.status(400).json({
        success: false,
        message: "Please select a barber",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid User ID format" });
    }
    if (!mongoose.Types.ObjectId.isValid(cleanBarberId)) {
      return res.status(400).json({ success: false, message: "Invalid Barber ID format" });
    }

    const isServiceValid = Array.isArray(cleanServiceId)
      ? cleanServiceId.every((id) => mongoose.Types.ObjectId.isValid(id))
      : mongoose.Types.ObjectId.isValid(cleanServiceId);

    if (!isServiceValid) {
      return res.status(400).json({ success: false, message: "Invalid Service ID format" });
    }

    const appointmentDate = new Date(bookingTime);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking time date format",
      });
    }
    appointmentDate.setSeconds(0, 0);

    const duplicateBooking = await findBarberConflict(cleanBarberId, appointmentDate);
    if (duplicateBooking) {
      return res.status(400).json({
        success: false,
        message: "This barber is already booked at this time. Please select another slot.",
      });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const existingBooking = await bookingModel.findOne({
      userId: userId,
      bookingTime: { $gte: startOfToday },
      status: { $ne: "cancelled" },
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "You already have an active or upcoming booking.",
      });
    }

    const barber = await barberModel.findById(cleanBarberId);
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: "Selected barber not found",
      });
    }

    const expiresAt = new Date(appointmentDate);
    expiresAt.setHours(23, 59, 59, 999);

    const booking = new bookingModel({
      userId,
      barberId: cleanBarberId,
      service: cleanServiceId,
      bookingTime: appointmentDate,
      expiresAt,
    });
    await booking.save();

    try {
      await barberModel.findByIdAndUpdate(cleanBarberId, {
        $push: { bookedFor: { date: appointmentDate, userId: userId } },
      });
    } catch (barberErr) {
      console.warn("Barber array update skipped:", barberErr.message);
    }

    let populatedBooking;
    try {
      populatedBooking = await bookingModel
        .findById(booking._id)
        .populate("service")
        .populate("userId")
        .populate("barberId");
    } catch (popErr) {
      console.error("Populate error:", popErr.message);
      populatedBooking = booking;
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("bookingCreated", populatedBooking);
    }

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: populatedBooking,
    });
  } catch (error) {
    console.error("CRITICAL BOOKING CONTROLLER ERROR:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This slot was just booked by another user. Please select another slot.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error in booking creation controller",
      error: error.message,
    });
  }
};

/**
 * @desc    Fetch all upcoming bookings
 * @route   GET /api/v1/user/getBookings
 */
/**
 * @desc    Fetch all upcoming bookings
 * @route   GET /api/v1/user/getBookings
 */
const bookingsFetchController = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const bookingData = await bookingModel
      .find({ bookingTime: { $gte: startOfToday } })
      .populate("service")
      .populate("userId")
      .populate("barberId"); // <-- Added for consistent population

    const statusPriority = { pending: 1, confirmed: 2, completed: 3, cancelled: 4 };

    bookingData.sort((a, b) => {
      const pA = statusPriority[a.status?.toLowerCase()] || 5;
      const pB = statusPriority[b.status?.toLowerCase()] || 5;

      if (pA !== pB) return pA - pB;
      return new Date(a.bookingTime) - new Date(b.bookingTime);
    });

    return res.status(200).json({
      success: true,
      message: "Bookings fetched successfully",
      data: bookingData,
    });
  } catch (error) {
    console.error("Booking Fetch Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      error: error.message,
    });
  }
};
/**
 * @desc    Fetch active booking(s) for logged-in user
 * @route   POST /api/v1/user/personalBookings
 */
const personalBookingFetchController = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const bookingData = await bookingModel
      .findOne({
        userId: userId,
        bookingTime: { $gte: startOfToday },
        status: { $ne: "cancelled" },
      })
      .populate("service")
      .populate("userId")
      .populate("barberId"); // <-- Add this line here!

    return res.status(200).json({
      success: true,
      message: "Personal booking retrieved successfully",
      data: bookingData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error in personal booking controller",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete booking
 * @route   DELETE /api/v1/user/personalBooking/delete/:id
 */
const deleteBookingController = async (req, res) => {
  try {
    const bookingId = req.params.id;

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Valid Booking ID is required",
      });
    }

    const deletedBooking = await bookingModel.findByIdAndDelete(bookingId);

    if (!deletedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("bookingDeleted", deletedBooking);
    }

    return res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
      data: deletedBooking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error in delete booking controller",
      error: error.message,
    });
  }
};

/**
 * @desc    Edit booking details
 * @route   PUT /api/v1/user/personalBooking/edit/:id
 */
const editBookingController = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { service, bookingTime } = req.body;

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Valid Booking ID is required",
      });
    }

    if (!service || !bookingTime) {
      return res.status(400).json({
        success: false,
        message: "Service and bookingTime are required",
      });
    }

    const appointmentDate = new Date(bookingTime);
    if (isNaN(appointmentDate.getTime()) || appointmentDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Cannot update booking to a past date",
      });
    }
    appointmentDate.setSeconds(0, 0);

    const existing = await bookingModel.findById(bookingId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const conflict = await findBarberConflict(existing.barberId, appointmentDate, bookingId);
    if (conflict) {
      return res.status(400).json({
        success: false,
        message: "This barber is already booked at this time. Please select another slot.",
      });
    }

    const expiresAt = new Date(appointmentDate);
    expiresAt.setHours(23, 59, 59, 999);

    const updatedBooking = await bookingModel
      .findByIdAndUpdate(
        bookingId,
        { service, bookingTime: appointmentDate, expiresAt },
        { new: true }
      )
      .populate("service")
      .populate("userId");

    const io = req.app.get("io");
    if (io) {
      io.emit("bookingUpdated", updatedBooking);
    }

    return res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: updatedBooking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error in edit booking controller",
      error: error.message,
    });
  }
};

/**
 * @desc    Update booking status
 * @route   POST /api/v1/admin/booking/:id/status
 */
const handleStatusController = async (req, res) => {
  try {
    const bookingId = req.params.id;
    let { status } = req.body;

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Valid Booking ID is required",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    status = status.toLowerCase().trim();
    if (status === "conformed") {
      status = "confirmed";
    }

    const updatedBooking = await bookingModel
      .findByIdAndUpdate(
        bookingId,
        { status },
        { new: true, runValidators: true }
      )
      .populate("service")
      .populate("userId")
      .populate("barberId");

    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("bookingStatusUpdated", updatedBooking);
    }

    return res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      data: updatedBooking,
    });
  } catch (error) {
    console.error("Status Update Error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid status value provided",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error in booking status controller",
      error: error.message,
    });
  }
};

module.exports = {
  bookingController,
  bookingsFetchController,
  personalBookingFetchController,
  deleteBookingController,
  editBookingController,
  handleStatusController,
};