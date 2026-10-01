import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import dayjs from "dayjs";

import {
  Box,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  Paper,
  Stack,
  TextField,
  InputAdornment,
  alpha,
  useTheme,
  useMediaQuery,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import ScheduleIcon from "@mui/icons-material/Schedule";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Button from "./Button";


import { RoleGuard } from "./RoleGuard.jsx";
import socket from "../socket/socket.js";

import {
  bookingData,
  addBooking,
  deleteBooking,
  updateBooking,
  updateStatus,
} from "../redux/features/bookingSlice.js";
import { showLoading, hideLoading } from "../redux/features/alertSlice.js";

const WaitingList = () => {
  const theme = useTheme();
  const isTabletOrMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useDispatch();
  const bookings = useSelector((state) => state.booking?.bookings || []);
  const user = useSelector((state) => state.auth?.user);

  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      dispatch(showLoading());
      const res = await axios.get("/api/v1/user/getBookings");
      dispatch(bookingData(res.data.data));
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      dispatch(hideLoading());
    }
  }, [dispatch]);

    //Bookings fetch
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

 useEffect(() => {
  const handleNewBooking = (booking) => {
    dispatch(addBooking(booking));
  };

  const handleDeletedBooking = (booking) => {
    dispatch(deleteBooking(booking));
  };

  const handleUpdatedBooking = (booking) => {
    dispatch(updateBooking(booking));
  };

  const handleStatusUpdated = (booking) => {
    dispatch(updateStatus(booking));
  };

  socket.on("bookingCreated", handleNewBooking);
  socket.on("bookingDeleted", handleDeletedBooking);
  socket.on("bookingUpdated", handleUpdatedBooking);
  socket.on("bookingStatusUpdated", handleStatusUpdated);

  return () => {
    socket.off("bookingCreated", handleNewBooking);
    socket.off("bookingDeleted", handleDeletedBooking);
    socket.off("bookingUpdated", handleUpdatedBooking);
    socket.off("bookingStatusUpdated", handleStatusUpdated);
  };
}, [dispatch]);

  const getPublicUserId = (booking) => {
    if (booking?.userId?.publicId) {
      return String(booking.userId.publicId).toUpperCase();
    }
    const rawId = booking?.userId?._id || booking?.userId;
    return typeof rawId === "string" && rawId ? rawId.slice(0, 5).toUpperCase() : "N/A";
  };

  const checkIsMyBooking = useCallback(
    (b) => {
      const bookingUserId = b.userId?._id || b.userId;
      const currentUserId = user?._id || user?.id;
      return Boolean(currentUserId && String(bookingUserId) === String(currentUserId));
    },
    [user]
  );

  const filteredBookings = useMemo(() => {
    let list = bookings;

    // 1. Filter out past bookings (keep only today and future bookings)
    const startOfToday = dayjs().startOf("day");
    list = list.filter((b) => {
      if (!b.bookingTime) return false;
      return dayjs(b.bookingTime).isAfter(startOfToday) || dayjs(b.bookingTime).isSame(startOfToday, "day");
    });

    // 2. Filter by user's own bookings
    if (showOnlyMine) {
      list = list.filter(checkIsMyBooking);
    }

    // 3. Filter by pending status
    if (showOnlyPending) {
      list = list.filter((b) => !b.status || b.status.toLowerCase() === "pending");
    }

    // 4. Search query filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim().replace(/^(id-|uid-|@)/i, "");
      list = list.filter((b) => {
        const publicId = getPublicUserId(b).toLowerCase();
        const userName = b.userId?.name?.toLowerCase() || "";
        const serviceName = b.service?.serviceName?.toLowerCase() || "";
        const status = (b.status || "pending").toLowerCase();
        const dateStr = b.bookingTime
          ? dayjs(b.bookingTime).format("DD MMM YYYY, hh:mm A").toLowerCase()
          : "";

        return (
          publicId.includes(query) ||
          userName.includes(query) ||
          serviceName.includes(query) ||
          status.includes(query) ||
          dateStr.includes(query)
        );
      });
    }

    return list;
  }, [bookings, searchTerm, showOnlyMine, showOnlyPending, checkIsMyBooking]);

  const handleStatusChange = async (bookingId, status) => {
    try {
      dispatch(showLoading());
      await axios.post(`/api/v1/user/admin/booking/${bookingId}/status`, { status });
      await fetchBookings();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      dispatch(hideLoading());
    }
  };

  const totalBookings = filteredBookings.length;

  const getStatusMeta = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "conformed":
      case "confirmed":
        return {
          label: "Confirmed",
          mainColor: theme.palette.success.dark,
          bgColor: alpha(theme.palette.success.main, 0.12),
          borderColor: alpha(theme.palette.success.main, 0.28),
          icon: <CheckCircleOutlineIcon sx={{ fontSize: 15 }} />,
        };
      case "completed":
        return {
          label: "Completed",
          mainColor: theme.palette.secondary.dark,
          bgColor: alpha(theme.palette.secondary.main, 0.12),
          borderColor: alpha(theme.palette.secondary.main, 0.28),
          icon: <CheckCircleOutlineIcon sx={{ fontSize: 15 }} />,
        };
      case "cancelled":
      case "rejected":
        return {
          label: "Cancelled",
          mainColor: theme.palette.error.dark,
          bgColor: alpha(theme.palette.error.main, 0.12),
          borderColor: alpha(theme.palette.error.main, 0.28),
          icon: <CancelOutlinedIcon sx={{ fontSize: 15 }} />,
        };
      case "pending":
      default:
        return {
          label: "Pending",
          mainColor: theme.palette.info.dark,
          bgColor: alpha(theme.palette.info.main, 0.12),
          borderColor: alpha(theme.palette.info.main, 0.28),
          icon: <ScheduleIcon sx={{ fontSize: 15 }} />,
        };
    }
  };

  const renderStatusBadge = (status) => {
    const meta = getStatusMeta(status);
    return (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.6,
          px: 1.5,
          py: 0.5,
          borderRadius: "20px",
          backgroundColor: meta.bgColor,
          color: meta.mainColor,
          border: `1px solid ${meta.borderColor}`,
        }}
      >
        {meta.icon}
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            fontSize: "12px",
            color: meta.mainColor,
            lineHeight: 1,
          }}
        >
          {meta.label}
        </Typography>
      </Box>
    );
  };

  const renderBookingTime = (bookingTime) => {
    if (!bookingTime) return <Typography variant="body2" color="text.secondary">N/A</Typography>;
    const timeStr = dayjs(bookingTime).format("hh:mm A");
    const dateStr = dayjs(bookingTime).format("DD MMM YYYY");

    return (
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
          {timeStr}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "11px" }}>
          {dateStr}
        </Typography>
      </Box>
    );
  };

  const idBadgeSx = {
    px: 1.2,
    py: 0.4,
    backgroundColor: alpha(theme.palette.grey[500], 0.12),
    color: theme.palette.grey[800],
    border: `1px solid ${theme.palette.grey[400]}`,
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "12px",
    fontWeight: 700,
    display: "inline-block",
  };

  return (
    <Box sx={{ width: "100%", py: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Search & Filter Top Bar */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 3,
          borderRadius: 2,
          borderColor: theme.palette.divider,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
              Waiting List
            </Typography>
            <Chip
              label={`${totalBookings} Active`}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: "12px",
                backgroundColor: alpha(theme.palette.text.primary, 0.06),
              }}
            />
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems="center"
            justifyContent="center"
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <TextField
              size="small"
              placeholder="Search ID , name ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: "100%", sm: 240 } }}
            />

            <RoleGuard allowedRoles={["user"]} userRole={user?.role}>
              <Button
                variant={showOnlyMine ? "tertiary" : "primary"}
                size="sm"
                onClick={() => setShowOnlyMine(!showOnlyMine)}
                startIcon={showOnlyMine ? <VisibilityOffIcon /> : <VisibilityIcon />}
                sx={{ width: { xs: "100%", sm: "auto" }, height: 38 }}
              >
                {showOnlyMine ? "Show All" : "My Booking"}
              </Button>
            </RoleGuard>

            <RoleGuard allowedRoles={["admin"]} userRole={user?.role}>
              <Button
                variant={showOnlyPending ? "tertiary" : "primary"}
                size="sm"
                onClick={() => setShowOnlyPending(!showOnlyPending)}
                startIcon={<ScheduleIcon />}
                sx={{ width: { xs: "100%", sm: "auto" }, height: 38 }}
              >
                {showOnlyPending ? "Show All" : "Show Pending"}
              </Button>
            </RoleGuard>
          </Stack>
        </Box>
      </Paper>

      {/* Main Content */}
      {filteredBookings.length > 0 ? (
        isTabletOrMobile ? (
          /* Mobile / Tablet View */
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 2.5,
            }}
          >
            {filteredBookings.map((b, index) => {
              const isPending = !b.status || b.status.toLowerCase() === "pending";
              const publicId = getPublicUserId(b);
              const isMyBooking = checkIsMyBooking(b);

              return (
                <Paper
                  key={b._id || index}
                  variant="outlined"
                  sx={{
                    flex: "1 1 300px",
                    maxWidth: { xs: "100%", sm: 360 },
                    p: 2.5,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    borderRadius: 2,
                    borderColor: theme.palette.divider,
                  }}
                >
                  <Stack spacing={2} alignItems="center">
                    {/* Header: ID + Status */}
                    <Box
                      sx={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box component="span" sx={idBadgeSx}>
                        {publicId}
                      </Box>
                      {renderStatusBadge(b.status)}
                    </Box>

                    <Divider sx={{ width: "100%" }} />

                    {/* Customer & Service Info */}
                    <Stack spacing={1} alignItems="center" textAlign="center" sx={{ width: "100%" }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Customer
                        </Typography>
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                          <Typography variant="body1" sx={{ fontWeight: 700 }}>
                            {b.userId?.name || "N/A"}
                          </Typography>
                          {isMyBooking && (
                            <Chip
                              label="YOU"
                              size="small"
                              color="primary"
                              sx={{ height: 18, fontSize: "10px", fontWeight: 700 }}
                            />
                          )}
                        </Stack>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Service
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {b.service?.serviceName || "N/A"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Schedule
                        </Typography>
                        {renderBookingTime(b.bookingTime)}
                      </Box>
                    </Stack>
                  </Stack>

                  {/* Actions */}
                  <RoleGuard allowedRoles={["admin"]} userRole={user?.role}>
                    {isPending && (
                      <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ pt: 2.5, width: "100%" }}>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleStatusChange(b._id, "conformed")}
                          sx={{ flex: 1 }}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleStatusChange(b._id, "cancelled")}
                          sx={{ flex: 1 }}
                        >
                          Cancel
                        </Button>
                      </Stack>
                    )}
                  </RoleGuard>
                </Paper>
              );
            })}
          </Box>
        ) : (
          /* Desktop Table View */
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table
              sx={{
                minWidth: 700,
                "& .MuiTableCell-root": {
                  border: `1px solid ${theme.palette.divider}`,
                  py: 1.5,
                  px: 2,
                },
              }}
            >
              <TableHead sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Service</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Booking Schedule</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                  <RoleGuard allowedRoles={["admin"]} userRole={user?.role}>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                  </RoleGuard>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredBookings.map((b, index) => {
                  const isPending = !b.status || b.status.toLowerCase() === "pending";
                  const publicId = getPublicUserId(b);
                  const isMyBooking = checkIsMyBooking(b);

                  return (
                    <TableRow key={b._id || index} hover>
                      <TableCell>
                        <Box component="span" sx={idBadgeSx}>
                          {publicId}
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {b.userId?.name || "N/A"}
                          </Typography>
                          {isMyBooking && (
                            <Chip
                              label="YOU"
                              size="small"
                              color="primary"
                              sx={{ height: 18, fontSize: "10px", fontWeight: 700 }}
                            />
                          )}
                        </Stack>
                      </TableCell>

                      <TableCell sx={{ fontWeight: 700 }}>
                        {b.service?.serviceName || "N/A"}
                      </TableCell>

                      <TableCell>
                        {renderBookingTime(b.bookingTime)}
                      </TableCell>

                      <TableCell align="center">
                        {renderStatusBadge(b.status)}
                      </TableCell>

                      <RoleGuard allowedRoles={["admin","barber"]} userRole={user?.role}>
                        <TableCell align="center">
                          {isPending ? (
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleStatusChange(b._id, "conformed")}
                              >
                                Confirm
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleStatusChange(b._id, "cancelled")}
                              >
                                Cancel
                              </Button>
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          )}
                        </TableCell>
                      </RoleGuard>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, p: 6, textAlign: "center" }}>
          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
            {showOnlyPending
              ? "No pending bookings right now"
              : showOnlyMine
              ? "You have no upcoming bookings right now"
              : "No upcoming bookings found"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {showOnlyMine
              ? "Your appointments will show up here once created."
              : "Try adjusting your search or clear filters."}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default WaitingList;