import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Card,
  Typography,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Chip,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  ContentCut,
  AttachMoney,
  Person,
  Phone,
  CalendarToday,
  AccessTime,
  InfoOutlined,
  EventBusy,
} from "@mui/icons-material";
import {
  insertPersonalBooking,
  clearPersonalBooking,
  showBooking,
} from "../redux/features/bookingSlice";
import { showLoading, hideLoading } from "../redux/features/alertSlice";
import EditBooking from "./EditBooking.jsx";
import Button from "./Button";
import axios from "axios";
import dayjs from "dayjs";
import socket from "../socket/socket.js"; // <-- Import socket connection

const PersonalBookings = () => {
  const { personalBooking, isVisible } = useSelector((state) => state.booking);
  const user = useSelector((state) => state.auth?.user);
  const dispatch = useDispatch();

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const status = (personalBooking?.status || "").toLowerCase();
  const isPending = status === "pending";
  const isCompleted = status === "completed";
  const isConfirmed = status === "confirmed";

  // Initial Fetch
  useEffect(() => {
    const fetchPersonalBooking = async () => {
      try {
        dispatch(showLoading());
        const res = await axios.post("/api/v1/user/personalBookings");

        if (res.data?.success && res.data?.data) {
          dispatch(insertPersonalBooking(res.data.data));
        } else {
          dispatch(clearPersonalBooking());
        }
      } catch (err) {
        console.error("Error fetching personal booking:", err);
        dispatch(clearPersonalBooking());
      } finally {
        dispatch(hideLoading());
      }
    };

    fetchPersonalBooking();
  }, [dispatch]);

  // Real-time Socket Listeners for Status/Booking Updates
  useEffect(() => {
    const handleStatusOrBookingUpdate = (updatedBooking) => {
      const currentUserId = user?._id || user?.id;
      const bookingUserId = updatedBooking?.userId?._id || updatedBooking?.userId;

      // Update state if this booking belongs to the current user or matches current personal booking ID
      if (
        (personalBooking?._id && updatedBooking?._id === personalBooking._id) ||
        (currentUserId && String(bookingUserId) === String(currentUserId))
      ) {
        dispatch(insertPersonalBooking(updatedBooking));
        setSnackbar({
          open: true,
          message: `Booking status updated to ${updatedBooking.status}`,
          severity: "info",
        });
      }
    };

    const handleBookingDeleted = (deletedBooking) => {
      if (personalBooking?._id && deletedBooking?._id === personalBooking._id) {
        dispatch(clearPersonalBooking());
        setSnackbar({
          open: true,
          message: "Your booking was cancelled or removed.",
          severity: "warning",
        });
      }
    };

    socket.on("bookingStatusUpdated", handleStatusOrBookingUpdate);
    socket.on("bookingUpdated", handleStatusOrBookingUpdate);
    socket.on("bookingDeleted", handleBookingDeleted);

    return () => {
      socket.off("bookingStatusUpdated", handleStatusOrBookingUpdate);
      socket.off("bookingUpdated", handleStatusOrBookingUpdate);
      socket.off("bookingDeleted", handleBookingDeleted);
    };
  }, [dispatch, personalBooking?._id, user]);

  const handleDelete = async () => {
    if (!personalBooking?._id) return;

    try {
      dispatch(showLoading());
      const res = await axios.delete(
        `/api/v1/user/personalBooking/delete/${personalBooking._id}`
      );

      if (res.data?.success) {
        dispatch(clearPersonalBooking());
        setOpenDeleteDialog(false);
        setSnackbar({
          open: true,
          message: isCompleted ? "Booking removed successfully" : "Booking cancelled successfully",
          severity: "success",
        });
      }
    } catch (err) {
      console.error("Error deleting booking:", err);
      setSnackbar({ open: true, message: "Failed to delete booking", severity: "error" });
    } finally {
      dispatch(hideLoading());
    }
  };

  const handleEdit = () => {
    if (isCompleted) {
      setSnackbar({ open: true, message: "This booking is already completed.", severity: "info" });
      return;
    }
    if (isConfirmed) {
      setSnackbar({ open: true, message: "Booking already confirmed. Contact the barber.", severity: "warning" });
      return;
    }
    dispatch(showBooking());
  };

  const handleDeleteClick = () => {
    setOpenDeleteDialog(true);
  };

  const getStatusColor = (currentStatus) => {
    switch ((currentStatus || "").toLowerCase()) {
      case "confirmed":
        return "success";
      case "pending":
        return "warning";
      case "completed":
        return "info";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  if (!personalBooking) {
    return (
      <Box
        sx={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "start",
          justifyContent: "start",
          p: 1.5,
        }}
      >
        <Card
          sx={{
            maxWidth: 400,
            width: "100%",
            p: 3,
            textAlign: "center",
            borderRadius: 2.5,
            bgcolor: "#FFFFFF",
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <EventBusy sx={{ fontSize: 40, color: "#9CA3AF", mb: 1 }} />
          <Typography variant="h6" fontWeight="700" gutterBottom sx={{ color: "#111827", fontSize: "1.1rem" }}>
            No Booking Found
          </Typography>
          <Typography variant="body2" sx={{ color: "#6B7280", fontSize: "0.875rem" }}>
            You haven't made any bookings yet. Book your first appointment to get started!
          </Typography>
        </Card>
      </Box>
    );
  }

  const formattedDateTime = personalBooking.bookingTime
    ? dayjs(personalBooking.bookingTime).format("MMM DD, YYYY [at] hh:mm A")
    : "scheduled time";

  return (
    <Box sx={{ width: "100%", maxWidth: 520, mx: "auto", p: { xs: 1, sm: 1.5 } }}>
      {isVisible ? (
        <Card sx={{ borderRadius: 2.5, bgcolor: "#FFFFFF", border: "1px solid #E5E7EB", p: 2, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", mb: 2 }}>
          <EditBooking />
        </Card>
      ) : (
        <Card sx={{ borderRadius: 2.5, bgcolor: "#FFFFFF", border: "1px solid #E5E7EB", p: { xs: 2, sm: 2.5 }, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827", mb: 1.5 }}>
            Booking Details
          </Typography>

          <Box sx={{ overflowX: "auto", mb: 2 }}>
            <Table size="small" sx={{ "& td, & th": { py: 0.8, px: 1 } }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500, color: "#6B7280", width: "40%", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 1, fontSize: "0.85rem" }}>
                    <ContentCut fontSize="small" color="action" /> Service
                  </TableCell>
                  <TableCell sx={{ color: "#111827", fontWeight: 600, borderBottom: "1px solid #F3F4F6", fontSize: "0.85rem" }}>
                    {personalBooking.service?.serviceName || "N/A"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500, color: "#6B7280", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 1, fontSize: "0.85rem" }}>
                    <AttachMoney fontSize="small" color="action" /> Price
                  </TableCell>
                  <TableCell sx={{ color: "#111827", borderBottom: "1px solid #F3F4F6", fontSize: "0.85rem" }}>
                    Rs. {personalBooking.service?.price || "N/A"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500, color: "#6B7280", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 1, fontSize: "0.85rem" }}>
                    <Person fontSize="small" color="action" /> Barber
                  </TableCell>
                  <TableCell sx={{ color: "#111827", borderBottom: "1px solid #F3F4F6", fontSize: "0.85rem" }}>
                    {personalBooking.barberId?.name || personalBooking.barber?.name || personalBooking.barberName || "N/A"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500, color: "#6B7280", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 1, fontSize: "0.85rem" }}>
                    <Phone fontSize="small" color="action" /> Contact
                  </TableCell>
                  <TableCell sx={{ color: "#111827", borderBottom: "1px solid #F3F4F6", fontSize: "0.85rem" }}>
                    {personalBooking.barberId?.phone || personalBooking.barber?.phone || personalBooking.barberPhone || "N/A"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500, color: "#6B7280", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 1, fontSize: "0.85rem" }}>
                    <CalendarToday fontSize="small" color="action" /> Date
                  </TableCell>
                  <TableCell sx={{ color: "#111827", borderBottom: "1px solid #F3F4F6", fontSize: "0.85rem" }}>
                    {personalBooking.bookingTime ? dayjs(personalBooking.bookingTime).format("MMM DD, YYYY") : "N/A"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500, color: "#6B7280", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 1, fontSize: "0.85rem" }}>
                    <AccessTime fontSize="small" color="action" /> Time
                  </TableCell>
                  <TableCell sx={{ color: "#111827", borderBottom: "1px solid #F3F4F6", fontSize: "0.85rem" }}>
                    {personalBooking.bookingTime ? dayjs(personalBooking.bookingTime).format("hh:mm A") : "N/A"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500, color: "#6B7280", borderBottom: "none", display: "flex", alignItems: "center", gap: 1, fontSize: "0.85rem" }}>
                    <InfoOutlined fontSize="small" color="action" /> Status
                  </TableCell>
                  <TableCell sx={{ borderBottom: "none" }}>
                    <Chip
                      label={personalBooking.status || "N/A"}
                      color={getStatusColor(personalBooking.status)}
                      size="small"
                      sx={{ textTransform: "capitalize", fontWeight: 600, height: 22, fontSize: "0.75rem" }}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>

          {isConfirmed ? (
            <Box
              sx={{
                width: "100%",
                p: 1.5,
                bgcolor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#047857",
                }}
              >
                Visit shop on {formattedDateTime}
              </Typography>
            </Box>
          ) : (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              justifyContent="flex-end"
              sx={{ width: "100%" }}
            >
              {isPending && (
                <Button
                  variant="primary"
                  onClick={handleEdit}
                  sx={{ width: { xs: "100%", sm: "auto" }, minWidth: 110 }}
                >
                  Edit Booking
                </Button>
              )}
              <Button
                variant="tertiary"
                onClick={handleDeleteClick}
                sx={{ width: { xs: "100%", sm: "auto" }, minWidth: 110 }}
              >
                {isCompleted ? "Remove Booking" : "Cancel Booking"}
              </Button>
            </Stack>
          )}
        </Card>
      )}

      {/* Delete/Cancel Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} PaperProps={{ sx: { borderRadius: 2.5, p: 0.5, maxWidth: 380, width: "100%" } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
          {isCompleted ? "Confirm Removal" : "Confirm Cancellation"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.9rem" }}>
            {isCompleted
              ? "Are you sure you want to remove this completed booking from your history?"
              : "Are you sure you want to cancel this booking? This action cannot be undone."}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 1.5, gap: 1 }}>
          <Button variant="secondary" size="sm" onClick={() => setOpenDeleteDialog(false)} sx={{ flex: 1 }}>
            Keep
          </Button>
          <Button variant="primary" size="sm" onClick={handleDelete} sx={{ flex: 1 }}>
            {isCompleted ? "Yes, Remove" : "Yes, Cancel"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PersonalBookings;