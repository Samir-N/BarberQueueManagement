const bookingModel = require("../models/bookingModel");

/**
 * @desc   Create a new booking (Max 1 active/upcoming booking per user)
 * @route  POST /api/v1/user/bookingInfo
 */
const bookingController = async (req, res) => {
  try {
    const { service, bookingTime, userId } = req.body;

    // 1. Field Validation
    if (!service || !bookingTime || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: service, bookingTime, and userId are required",
      });
    }

    // 2. Date Validation (Check if date is in the past)
    const appointmentDate = new Date(bookingTime);
    if (isNaN(appointmentDate.getTime()) || appointmentDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Cannot book an appointment in the past",
      });
    }

    // 3. Prevent Multiple Active Bookings (Check from start of today onwards)
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

    // 4. Calculate Expiration Timestamp (End of appointment day)
    const expiresAt = new Date(appointmentDate);
    expiresAt.setHours(23, 59, 59, 999);

    // 5. Create Booking Document
    const booking = new bookingModel({
      userId,
      service,
      bookingTime: appointmentDate,
      expiresAt,
    });

    await booking.save();

    // 6. Populate Data for Live Socket Broadcaster
    const populatedBooking = await bookingModel
      .findById(booking._id)
      .populate("service")
      .populate("userId");

    // 7. Emit Realtime Socket Event
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
    return res.status(500).json({
      success: false,
      message: "Error in booking creation controller",
      error: error.message,
    });
  }
};

/**
 * @desc   Fetch all upcoming bookings
 * @route  GET /api/v1/user/getBookings
 */
const bookingsFetchController = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const bookingData = await bookingModel
      .find({ bookingTime: { $gte: startOfToday } })
      .sort({ bookingTime: 1 })
      .populate("service")
      .populate("userId");

    return res.status(200).json({
      success: true,
      message: "Bookings fetched successfully",
      data: bookingData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      error: error.message,
    });
  }
};

/**
 * @desc   Fetch active booking for logged-in user
 * @route  POST /api/v1/user/personalBookings
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
      .populate("userId");

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
 * @desc   Delete booking
 * @route  DELETE /api/v1/user/personalBooking/delete/:id
 */
const deleteBookingController = async (req, res) => {
  try {
    const bookingId = req.params.id;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
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
 * @desc   Edit booking details
 * @route  PUT /api/v1/user/personalBooking/edit/:id
 */
const editBookingController = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { service, bookingTime } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
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

    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

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
 * @desc   Update booking status
 * @route  POST /api/v1/admin/booking/:id/status
 */
const handleStatusController = async (req, res) => {
  try {
    const bookingId = req.params.id;
    let { status } = req.body;

    if (!bookingId || !status) {
      return res.status(400).json({
        success: false,
        message: "Booking ID and status are required",
      });
    }

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
      .populate("userId");

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