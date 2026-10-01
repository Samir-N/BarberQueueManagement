import { createSlice } from "@reduxjs/toolkit";

const bookingSlice = createSlice({
  name: "booking",

  initialState: {
    isVisible: false,
    bookings: [],
    personalBooking: null,
  },

  reducers: {
    // Store all bookings fetched from backend
    bookingData: (state, action) => {
      state.bookings = action.payload;
    },

    // Show booking
    showBooking: (state) => {
      state.isVisible = true;
    },

    // Hide booking
    hideBooking: (state) => {
      state.isVisible = false;
    },

    // Add newly created booking
    addBooking: (state, action) => {
      state.bookings.push(action.payload);
    },

    // Delete booking
    deleteBooking: (state, action) => {
      state.bookings = state.bookings.filter(
        (booking) => booking._id !== action.payload._id
      );
    },

    // Update entire booking
    updateBooking: (state, action) => {
      const index = state.bookings.findIndex(
        (booking) => booking._id === action.payload._id
      );

      if (index !== -1) {
        state.bookings[index] = action.payload;
      }
    },

    // Update booking status
    updateStatus: (state, action) => {
      const index = state.bookings.findIndex(
        (booking) => booking._id === action.payload._id
      );

      if (index !== -1) {
        state.bookings[index] = action.payload;
      }
    },

    // Toggle booking visibility
    toggleBooking: (state) => {
      state.isVisible = !state.isVisible;
    },

    // Store personal booking
    insertPersonalBooking: (state, action) => {
      state.personalBooking = action.payload;
    },

    // Clear personal booking
    clearPersonalBooking: (state) => {
      state.personalBooking = null;
    },
  },
});

export const {
  bookingData,
  showBooking,
  hideBooking,
  toggleBooking,
  addBooking,
  deleteBooking,
  updateBooking,
  updateStatus,
  insertPersonalBooking,
  clearPersonalBooking,
} = bookingSlice.actions;

export default bookingSlice.reducer;