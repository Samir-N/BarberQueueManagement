const bookingModel = require("../models/bookingModel");

// Create new booking
const bookingController = async (req, res) => {
  try {


    // Extract data from request body (userId is added by authMiddleware)
    const { service, bookingTime, userId } = req.body;

    // Validate required fields
    if (!service || !bookingTime || !userId) {
      return res.status(400).send({
        message: "Missing required fields: service, bookingTime, and userId are required",
        success: false,
      });
    }

    // Validate date & check if date is in the past
    const appointmentDate = new Date(bookingTime);
    if (isNaN(appointmentDate.getTime()) || appointmentDate < new Date()) {
      return res.status(400).send({
        message: "Cannot book an appointment in the past",
        success: false,
      });
    }

    // Calculate expiration timestamp (23:59:59.999 of the appointment date)
    const expiresAt = new Date(appointmentDate);
    expiresAt.setHours(23, 59, 59, 999);

   const existingBooking = await bookingModel.findOne({
  userId: userId,
  bookingTime: { $gte: new Date() },
  status: { $ne: "cancelled" }
});

if (existingBooking) {
  return res.status(400).send({
    message: "You already have an active upcoming booking.",
    success: false,
  });
}

    // Create booking with all required fields
    const booking = new bookingModel({
      userId: userId,
      service: service,
      bookingTime: bookingTime,
      expiresAt: expiresAt,
    });

     await booking.save();

    //Fetching to show to all users LIVE using Socket
    const populatedBooking = await bookingModel
  .findById(booking._id)
  .populate("service")
  .populate("userId");


   

    //Socket Define
    const io = req.app.get("io");

    //Send to Everyone
    io.emit("bookingCreated", populatedBooking);

    return res.status(200).send({
      message: "Booking info received successfully",
      success: true,
      data: booking,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Error in booking controller",
      error: error.message,
      success: false,
    });
  }
};

// Fetch all bookings (Filtered to prevent fetching past bookings during MongoDB TTL buffer)
const bookingsFetchController = async (req, res) => {
  try {
    // Filter out past bookings immediately so lingering docs during TTL cleanup don't show
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const bookingData = await bookingModel
      .find({ bookingTime: { $gte: startOfToday } })
      .sort({ bookingTime: 1 })
      .populate("service")
      .populate("userId");

    return res.status(200).send({
      message: "BookingData received successfully",
      success: true,
      data: bookingData,
    });



  } catch (error) {
    return res.status(500).send({
      message: "Error in bookings fetch controller",
      error: error.message,
      success: false,
    });
  }
};

// Fetch single user's booking
const personalBookingFetchController = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId || req.query.userId;

    if (!userId) {
      return res.status(400).send({
        message: "User ID is required",
        success: false,
      });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const bookingData = await bookingModel
      .findOne({ userId: userId, bookingTime: { $gte: startOfToday } })
      .populate("service")
      .populate("userId");

    return res.status(200).send({
      message: "Personal BookingData received successfully",
      success: true,
      data: bookingData,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Error in personal booking controller",
      error: error.message,
      success: false,
    });
  }
};

// Delete a booking
const deleteBookingController = async (req, res) => {
  try {
    const bookingId = req.params.id;
    if (!bookingId) {
      return res.status(400).send({
        message: "Booking ID is required",
        success: false,
      });
    }

    const deletedBooking = await bookingModel.findByIdAndDelete(bookingId);
    if (!deletedBooking) {
      return res.status(404).send({
        message: "Booking not found",
        success: false,
      });
    }

     //Socket Define
    const io = req.app.get("io");

    //Socket Send
    io.emit("bookingDeleted", deletedBooking);


    return res.status(200).send({
      message: "Booking deleted successfully",
      success: true,
      data: deletedBooking,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Error in delete booking controller",
      error: error.message,
      success: false,
    });
  }
};

// Edit booking details
const editBookingController = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { service, bookingTime } = req.body;

    if (!bookingId) {
      return res.status(400).send({
        message: "Booking ID is required",
        success: false,
      });
    }

    if (!service || !bookingTime) {
      return res.status(400).send({
        message: "Service and bookingTime are required",
        success: false,
      });
    }

    // Validate updated booking time
    const appointmentDate = new Date(bookingTime);
    if (isNaN(appointmentDate.getTime()) || appointmentDate < new Date()) {
      return res.status(400).send({
        message: "Cannot update booking to a date in the past",
        success: false,
      });
    }

    // Recalculate expiresAt for the new booking time
    const expiresAt = new Date(appointmentDate);
    expiresAt.setHours(23, 59, 59, 999);

    const updatedBooking = await bookingModel
      .findByIdAndUpdate(
        bookingId,
        { service, bookingTime, expiresAt },
        { new: true }
      )
      .populate("service")
      .populate("userId");

    if (!updatedBooking) {
      return res.status(404).send({
        message: "Booking not found",
        success: false,
      });
    }

      //Socket Define
    const io = req.app.get("io");

    //Socket Send
    io.emit("bookingUpdated", updatedBooking);

    return res.status(200).send({
      message: "Booking updated successfully",
      success: true,
      data: updatedBooking,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Error in edit booking controller",
      error: error.message,
      success: false,
    });
  }
};

// Update booking status
const handleStatusController = async (req, res) => {
  try {
    const bookingId = req.params.id;
    let { status } = req.body;

    if (!bookingId || !status) {
      return res.status(400).send({
        message: "Booking ID and status are required",
        success: false,
      });
    }

    // Normalize spelling typo
    if (status === "conformed") {
      status = "confirmed";
    }

    const updatedBooking = await bookingModel
      .findByIdAndUpdate(
        bookingId,
        { status },
        {
          new: true,
          runValidators: true,
        }
      )
      .populate("service")
      .populate("userId");

    if (!updatedBooking) {
      return res.status(404).send({
        message: "Booking not found",
        success: false,
      });
    }

    // Get Socket.IO
    const io = req.app.get("io");

    // Send updated booking to everyone
    io.emit("bookingStatusUpdated", updatedBooking);

    console.log(
      "Socket emitted bookingStatusUpdated:",
      updatedBooking._id.toString()
    );

    return res.status(200).send({
      message: "Booking status updated successfully",
      success: true,
      data: updatedBooking,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Error in edit booking status handle controller",
      error: error.message,
      success: false,
    });
  }
};

module.exports = {
  handleStatusController,
  editBookingController,
  personalBookingFetchController,
  bookingController,
  bookingsFetchController,
  deleteBookingController,
};