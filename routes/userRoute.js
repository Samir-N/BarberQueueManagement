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
  bookingController, 
  bookingsFetchController, 
  personalBookingFetchController, 
  deleteBookingController, 
  editBookingController,
  handleStatusController 
} = require('../controllers/bookingController');

// --- Auth Routes ---
router.post('/register', registerController);
router.post('/login', loginController);
router.post('/getUserData', authMiddleware, authController);

// --- Service Routes ---
router.get('/services', servicesController);

// --- Booking Routes ---
router.post('/bookingInfo', authMiddleware, bookingController);
router.get('/getBookings', bookingsFetchController);
router.post('/personalBookings', authMiddleware, personalBookingFetchController);

// --- Booking Management Routes ---
router.post('/admin/booking/:id/status',handleStatusController,authMiddleware);
router.put('/personalBooking/edit/:id', authMiddleware, editBookingController);
router.delete('/personalBooking/delete/:id', authMiddleware, deleteBookingController);

// --- Profile Management Routes ---
router.post('/profile/edit/:id',authMiddleware,handleProfileEdit);


module.exports = router;