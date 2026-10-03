const express = require('express');
const router = express.Router();

// Middlewares
const authMiddleware = require('../middlewares/authMiddleware');

// Controllers
const servicesController = require('../controllers/serviceController');
const { 
  loginController, 
  registerController, 
  authController,
  handleProfileEdit 
} = require('../controllers/userController');

const {
  BarberRegisterController,
  BarberLoginController,
  BarberLogoutController,
  getBarberData,
  getAllBarbersController
} = require('../controllers/barberController');

const { 
  bookingController, 
  bookingsFetchController, 
  personalBookingFetchController, 
  deleteBookingController, 
  editBookingController,
  handleStatusController 
} = require('../controllers/bookingController');

// --- User Auth Routes ---
router.post('/user/register', registerController);
router.post('/user/login', loginController);
router.get('/user/getUserData', authMiddleware, authController);
// --- Barber Auth Routes ---
router.post('/barber/register', BarberRegisterController);
router.post('/barber/login', BarberLoginController);
router.get('/barber/getBarberData', authMiddleware, getBarberData);
router.get('/barber/getAllBarbers', authMiddleware, getAllBarbersController);
router.post('/barber/logout', authMiddleware, BarberLogoutController);

// --- Service Routes ---
router.get('/user/services', servicesController);

// --- Booking Routes ---
router.post('/user/bookingInfo', authMiddleware, bookingController); // Added /user prefix
router.get('/user/getBookings', bookingsFetchController);
router.post('/user/personalBookings', authMiddleware, personalBookingFetchController); // Added /user prefix

// --- Booking Management Routes ---
router.post('/admin/booking/:id/status', authMiddleware, handleStatusController);
router.put('/user/personalBooking/edit/:id', authMiddleware, editBookingController); // Updated path if called under /user
router.delete('/user/personalBooking/delete/:id', authMiddleware, deleteBookingController); // Updated path if called under /user

// --- Profile Management Routes ---
router.post('/user/profile/edit/:id', authMiddleware, handleProfileEdit);

module.exports = router;