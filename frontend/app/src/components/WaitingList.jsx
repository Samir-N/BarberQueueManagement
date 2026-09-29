import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import SearchIcon from "@mui/icons-material/Search";
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
  Divider,
  Button,
  TextField,
  InputAdornment,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import axios from "axios";
import dayjs from "dayjs";
import { bookingData } from "../redux/features/bookingSlice.js";
import { showLoading, hideLoading } from "../redux/features/alertSlice.js";

const WaitingList = () => {
  const dispatch = useDispatch();
  const bookings = useSelector((state) => state.booking?.bookings || []);
  const user = useSelector((state) => state.auth?.user);
  const isAdmin = user?.role === "admin";

  const [searchTerm, setSearchTerm] = useState("");

  const fetchBookings = async () => {
    try {
      dispatch(showLoading());
      const res = await axios.get("/api/v1/user/getBookings");
      dispatch(bookingData(res.data.data));
      dispatch(hideLoading());
    } catch (err) {
      dispatch(hideLoading());
      console.log(err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [dispatch]);

  const getShortUserId = (booking) => {
    const rawId = booking?.userId?._id || booking?.userId;
    return typeof rawId === "string" && rawId ? rawId.slice(0, 4).toUpperCase() : "N/A";
  };

  const filteredBookings = useMemo(() => {
    if (!searchTerm.trim()) return bookings;

    const query = searchTerm.toLowerCase().trim().replace(/^(id-|uid-|@)/i, "");

    return bookings.filter((b) => {
      const shortUserId = getShortUserId(b).toLowerCase();
      const userName = b.userId?.name?.toLowerCase() || "";
      const serviceName = b.service?.serviceName?.toLowerCase() || "";
      const status = (b.status || "pending").toLowerCase();
      const dateStr = b.bookingTime
        ? dayjs(b.bookingTime).format("DD MMM YYYY, hh:mm A").toLowerCase()
        : "";

      return (
        shortUserId.includes(query) ||
        userName.includes(query) ||
        serviceName.includes(query) ||
        status.includes(query) ||
        dateStr.includes(query)
      );
    });
  }, [bookings, searchTerm]);

  const handleStatusChange = async (bookingId, status) => {
    try {
      dispatch(showLoading());
      await axios.post(`/api/v1/user/admin/booking/${bookingId}/status`, { status });
      await fetchBookings();
    } catch (err) {
      dispatch(hideLoading());
      console.log(err);
    }
  };

  const totalBookings = bookings?.length || 0;
  const pendingCount =
    bookings?.filter((b) => !b.status || b.status.toLowerCase() === "pending")
      .length || 0;

  const getStatus = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "conformed":
        return { text: "Conformed", icon: <CheckCircleIcon sx={{ fontSize: 16 }} />, color: "#16A34A" };
      case "completed":
        return { text: "Completed", icon: <CheckCircleIcon sx={{ fontSize: 16 }} />, color: "#059669" };
      case "cancelled":
        return { text: "Cancelled", icon: <CancelIcon sx={{ fontSize: 16 }} />, color: "#DC2626" };
      case "pending":
      default:
        return { text: "Pending", icon: <ScheduleIcon sx={{ fontSize: 16 }} />, color: "#2563EB" };
    }
  };

  return (
    <Box sx={{ width: "100%", py: { xs: 2, sm: 3 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          borderRadius: 2,
          border: "1px solid #E5E7EB",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", md: "center" },
            gap: 2,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827" }}>
            Waiting List
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems="center"
            sx={{ flexWrap: "wrap", width: { xs: "100%", md: "auto" } }}
          >
            <TextField
              size="small"
              placeholder="Search User ID, name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#9CA3AF", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: { xs: "100%", sm: 240, md: 280 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  backgroundColor: "#FFFFFF",
                  fontSize: "14px",
                },
              }}
            />

            <Box
              sx={{
                px: 2,
                py: 0.8,
                borderRadius: 1.5,
                border: "1px solid #BFDBFE",
                display: "flex",
                alignItems: "center",
                gap: 1,
                backgroundColor: "#EFF6FF",
                width: { xs: "100%", sm: "auto" },
                justifyContent: "center",
              }}
            >
              <PeopleAltIcon sx={{ color: "#2563EB", fontSize: 18 }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1E40AF" }}>
                {pendingCount} Waiting
              </Typography>
            </Box>

            <Box
              sx={{
                px: 2,
                py: 0.8,
                borderRadius: 1.5,
                border: "1px solid #E5E7EB",
                display: "flex",
                alignItems: "center",
                gap: 1,
                backgroundColor: "#F9FAFB",
                width: { xs: "100%", sm: "auto" },
                justifyContent: "center",
              }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#6B7280" }}>
                Total: <strong>{totalBookings}</strong>
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          border: "1px solid #E5E7EB",
        }}
      >
        {filteredBookings.length > 0 ? (
          <>
            {/* Mobile & Tablet Card View (< 900px) */}
            <Box
              sx={{
                display: { xs: "grid", md: "none" },
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                gap: 2,
              }}
            >
              {filteredBookings.map((b, index) => {
                const statusInfo = getStatus(b.status);
                const isPending = !b.status || b.status.toLowerCase() === "pending";
                const userIdBadge = getShortUserId(b);

                return (
                  <Paper
                    key={b._id || index}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: "1px solid #E5E7EB",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 1.5,
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PersonIcon sx={{ color: "#6B7280", fontSize: 20 }} />
                        <Typography sx={{ fontWeight: 700, color: "#111827" }}>
                          {b.userId?.name || "N/A"}
                        </Typography>
                        <Chip
                          label={userIdBadge}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "11px",
                            fontFamily: "monospace",
                            fontWeight: 700,
                            backgroundColor: "#F3F4F6",
                            color: "#4B5563",
                          }}
                        />
                      </Box>
                      <Chip
                        icon={statusInfo.icon}
                        label={statusInfo.text}
                        size="small"
                        sx={{
                          backgroundColor: "transparent",
                          color: statusInfo.color,
                          fontWeight: 700,
                          "& .MuiChip-icon": { color: statusInfo.color },
                        }}
                      />
                    </Box>

                    <Divider />

                    <Stack spacing={1}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <ContentCutIcon sx={{ color: "#9CA3AF", fontSize: 16 }} />
                        <Typography sx={{ fontSize: 14, color: "#4B5563" }}>
                          <strong>Service:</strong> {b.service?.serviceName || "N/A"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CalendarTodayIcon sx={{ color: "#9CA3AF", fontSize: 16 }} />
                        <Typography sx={{ fontSize: 14, color: "#4B5563" }}>
                          {b.bookingTime ? dayjs(b.bookingTime).format("DD MMM YYYY, hh:mm A") : "N/A"}
                        </Typography>
                      </Box>
                    </Stack>

                    {isAdmin && isPending && (
                      <>
                        <Divider />
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            disableElevation
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleStatusChange(b._id, "conformed")}
                            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5, flex: { xs: 1, sm: "initial" } }}
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<CancelIcon />}
                            onClick={() => handleStatusChange(b._id, "cancelled")}
                            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5, flex: { xs: 1, sm: "initial" } }}
                          >
                            Cancel
                          </Button>
                        </Stack>
                      </>
                    )}
                  </Paper>
                );
              })}
            </Box>

            {/* Desktop Table View (>= 900px) */}
            <TableContainer
              sx={{
                display: { xs: "none", md: "block" },
                borderRadius: 1.5,
                border: "1px solid #E5E7EB",
                overflowX: "auto",
                maxWidth: "100%",
              }}
            >
              <Table sx={{ minWidth: 750 }}>
                <TableHead sx={{ backgroundColor: "#F9FAFB" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>User ID</TableCell>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>User Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>Service</TableCell>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>Booking Date & Time</TableCell>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }} align="center">
                      Status
                    </TableCell>
                    {isAdmin && (
                      <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }} align="center">
                        Actions
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredBookings.map((b, index) => {
                    const statusInfo = getStatus(b.status);
                    const isPending = !b.status || b.status.toLowerCase() === "pending";
                    const userIdBadge = getShortUserId(b);

                    return (
                      <TableRow key={b._id || index} sx={{ "&:hover": { backgroundColor: "#F9FAFB" } }}>
                        <TableCell sx={{ fontWeight: 700, fontFamily: "monospace", color: "#374151" }}>
                          {userIdBadge}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{b.userId?.name || "N/A"}</TableCell>
                        <TableCell>{b.service?.serviceName || "N/A"}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {b.bookingTime ? dayjs(b.bookingTime).format("DD MMM YYYY, hh:mm A") : "N/A"}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={statusInfo.icon}
                            label={statusInfo.text}
                            size="small"
                            sx={{
                              backgroundColor: "transparent",
                              color: statusInfo.color,
                              fontWeight: 600,
                              "& .MuiChip-icon": { color: statusInfo.color },
                            }}
                          />
                        </TableCell>
                        {isAdmin && (
                          <TableCell align="center">
                            {isPending ? (
                              <Stack direction="row" spacing={1} justifyContent="center">
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  disableElevation
                                  startIcon={<CheckCircleIcon />}
                                  onClick={() => handleStatusChange(b._id, "conformed")}
                                  sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5, whiteSpace: "nowrap" }}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  startIcon={<CancelIcon />}
                                  onClick={() => handleStatusChange(b._id, "cancelled")}
                                  sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5, whiteSpace: "nowrap" }}
                                >
                                  Cancel
                                </Button>
                              </Stack>
                            ) : (
                              <Typography variant="caption" sx={{ color: "#9CA3AF" }}>
                                No actions
                              </Typography>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" sx={{ color: "#6B7280", fontWeight: 600 }}>
              {searchTerm ? "No matching bookings found" : "No bookings found"}
            </Typography>
            <Typography sx={{ color: "#9CA3AF", fontSize: 14 }}>
              {searchTerm ? "Try searching with a different User ID or keyword" : "Book your first appointment to get started"}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default WaitingList;