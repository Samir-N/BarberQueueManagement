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
  CircularProgress,
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

const WaitingList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useDispatch();

  const bookings = useSelector((state) => state.booking?.bookings || []);
  const user = useSelector((state) => state.auth?.user);

  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Fetch bookings with local loading state to avoid global unmount loops
  const fetchBookings = useCallback(async () => {
    try {
      setFetching(true);
      const res = await axios.get("/api/v1/user/getBookings");
      if (res.data?.success) {
        dispatch(bookingData(res.data.data));
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setFetching(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Real-time socket event listeners
  useEffect(() => {
    const handleNewBooking = (booking) => dispatch(addBooking(booking));
    const handleDeletedBooking = (booking) => dispatch(deleteBooking(booking));
    const handleUpdatedBooking = (booking) => dispatch(updateBooking(booking));
    const handleStatusUpdated = (booking) => dispatch(updateStatus(booking));

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
    const startOfToday = dayjs().startOf("day");

    list = list.filter((b) => {
      if (!b.bookingTime) return false;
      return dayjs(b.bookingTime).isAfter(startOfToday) || dayjs(b.bookingTime).isSame(startOfToday, "day");
    });

    if (showOnlyMine) list = list.filter(checkIsMyBooking);
    if (showOnlyPending) list = list.filter((b) => !b.status || b.status.toLowerCase() === "pending");

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim().replace(/^(id-|uid-|@)/i, "");
      list = list.filter((b) => {
        const publicId = getPublicUserId(b).toLowerCase();
        const userName = b.userId?.name?.toLowerCase() || "";
        const serviceName = b.service?.serviceName?.toLowerCase() || "";
        const status = (b.status || "pending").toLowerCase();
        const dateStr = b.bookingTime ? dayjs(b.bookingTime).format("DD MMM YYYY, hh:mm A").toLowerCase() : "";

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
      await axios.post(`/api/v1/admin/booking/${bookingId}/status`, { status });
      await fetchBookings();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const getStatusMeta = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "confirmed":
        return {
          label: "Confirmed",
          color: theme.palette.success.dark,
          bg: alpha(theme.palette.success.main, 0.1),
          icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />,
        };
      case "completed":
        return {
          label: "Completed",
          color: theme.palette.secondary.dark,
          bg: alpha(theme.palette.secondary.main, 0.1),
          icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />,
        };
      case "cancelled":
      case "rejected":
        return {
          label: "Cancelled",
          color: theme.palette.error.dark,
          bg: alpha(theme.palette.error.main, 0.1),
          icon: <CancelOutlinedIcon sx={{ fontSize: 14 }} />,
        };
      case "pending":
      default:
        return {
          label: "Pending",
          color: theme.palette.info.dark,
          bg: alpha(theme.palette.info.main, 0.1),
          icon: <ScheduleIcon sx={{ fontSize: 14 }} />,
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
          gap: 0.5,
          px: 1.2,
          py: 0.3,
          borderRadius: "12px",
          bgcolor: meta.bg,
          color: meta.color,
          fontSize: "12px",
          fontWeight: 600,
        }}
      >
        {meta.icon}
        {meta.label}
      </Box>
    );
  };

  const renderBookingTime = (bookingTime) => {
    if (!bookingTime) return <Typography variant="caption" color="text.secondary">—</Typography>;
    return (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
          {dayjs(bookingTime).format("hh:mm A")}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "11px" }}>
          {dayjs(bookingTime).format("DD MMM")}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ width: "100%", py: 1 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        {/* Header Toolbar */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            gap: 1.5,
            bgcolor: "background.paper",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
              Queue
            </Typography>
            <Chip
              label={filteredBookings.length}
              size="small"
              sx={{ fontWeight: 700, fontSize: "11px", height: 20, bgcolor: "action.selected" }}
            />
            {fetching && <CircularProgress size={16} sx={{ ml: 1 }} />}
          </Stack>

          {/* Controls Bar */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <TextField
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: { xs: 1, sm: "none" },
                width: { sm: 200 },
              }}
            />

            <RoleGuard allowedRoles={["user"]} userRole={user?.role}>
              <Button
                variant={showOnlyMine ? "tertiary" : "primary"}
                size="sm"
                onClick={() => setShowOnlyMine(!showOnlyMine)}
                startIcon={showOnlyMine ? <VisibilityOffIcon /> : <VisibilityIcon />}
                className="whitespace-nowrap shrink-0"
              >
                {showOnlyMine ? "All" : "Mine"}
              </Button>
            </RoleGuard>

            <RoleGuard allowedRoles={["admin", "barber"]} userRole={user?.role}>
              <Button
                variant={showOnlyPending ? "tertiary" : "primary"}
                size="sm"
                onClick={() => setShowOnlyPending(!showOnlyPending)}
                startIcon={<ScheduleIcon />}
                className="whitespace-nowrap shrink-0"
              >
                {showOnlyPending ? "All" : "Pending"}
              </Button>
            </RoleGuard>
          </Stack>
        </Box>

        <Divider />

        {/* List Section */}
        {filteredBookings.length > 0 ? (
          isMobile ? (
            <Stack spacing={1.5} sx={{ p: 2, bgcolor: "action.hover" }}>
              {filteredBookings.map((b, idx) => {
                const isPending = !b.status || b.status.toLowerCase() === "pending";
                const publicId = getPublicUserId(b);
                const isMyBooking = checkIsMyBooking(b);

                return (
                  <Paper
                    key={b._id || idx}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700, color: "text.secondary" }}>
                        #{publicId}
                      </Typography>
                      {renderStatusBadge(b.status)}
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" alignItems="baseline" my={0.5}>
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: "0.95rem" }}>
                            {b.userId?.name || "Guest"}
                          </Typography>
                          {isMyBooking && (
                            <Chip label="YOU" size="small" color="primary" sx={{ height: 16, fontSize: "9px", fontWeight: 700 }} />
                          )}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {b.service?.serviceName || "Service"}
                        </Typography>
                      </Box>

                      <Box textAlign="right">
                        {renderBookingTime(b.bookingTime)}
                      </Box>
                    </Stack>

                    <RoleGuard allowedRoles={["admin", "barber"]} userRole={user?.role}>
                      {isPending && (
                        <Stack direction="row" spacing={1} mt={1.5}>
                          <Button variant="success" size="sm" onClick={() => handleStatusChange(b._id, "confirmed")} className="w-full">
                            Confirm
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleStatusChange(b._id, "cancelled")} className="w-full">
                            Cancel
                          </Button>
                        </Stack>
                      )}
                    </RoleGuard>
                  </Paper>
                );
              })}
            </Stack>
          ) : (
            <TableContainer sx={{ border: "none" }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "action.hover" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                    <RoleGuard allowedRoles={["admin", "barber"]} userRole={user?.role}>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                    </RoleGuard>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredBookings.map((b, idx) => {
                    const isPending = !b.status || b.status.toLowerCase() === "pending";
                    const publicId = getPublicUserId(b);
                    const isMyBooking = checkIsMyBooking(b);

                    return (
                      <TableRow key={b._id || idx} hover>
                        <TableCell sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: "12px", color: "text.secondary" }}>
                          #{publicId}
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {b.userId?.name || "Guest"}
                            </Typography>
                            {isMyBooking && (
                              <Chip label="YOU" size="small" color="primary" sx={{ height: 16, fontSize: "9px", fontWeight: 700 }} />
                            )}
                          </Stack>
                        </TableCell>

                        <TableCell sx={{ fontSize: "13px" }}>
                          {b.service?.serviceName || "—"}
                        </TableCell>

                        <TableCell>
                          {renderBookingTime(b.bookingTime)}
                        </TableCell>

                        <TableCell align="center">
                          {renderStatusBadge(b.status)}
                        </TableCell>

                        <RoleGuard allowedRoles={["admin", "barber"]} userRole={user?.role}>
                          <TableCell align="center">
                            {isPending ? (
                              <Stack direction="row" spacing={1} justifyContent="center">
                                <Button variant="success" size="sm" onClick={() => handleStatusChange(b._id, "confirmed")}>
                                  Confirm
                                </Button>
                                <Button variant="danger" size="sm" onClick={() => handleStatusChange(b._id, "cancelled")}>
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
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No bookings found.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default WaitingList;