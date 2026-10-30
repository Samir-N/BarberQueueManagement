// BarberAnalytics.jsx
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  Box,
  Typography,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

const C = {
  ink: "#213448",
  blue: "#547792",
  mist: "#94B4C1",
  cream: "#EAE0CF",
  gold: "#D6A93A",
  red: "#C96B64",
  green: "#4F8A76",
  bg: "#F6F8FA",
  border: "#E3E9EE",
  muted: "#718096",
};

const money = (n) => `NPR ${Number(n || 0).toLocaleString("en-IN")}`;

const getStatus = (b) =>
  String(b?.status || "pending").toLowerCase() === "rejected"
    ? "cancelled"
    : String(b?.status || "pending").toLowerCase();

const getServiceName = (b) =>
  typeof b?.service === "object"
    ? b.service?.serviceName || b.service?.name || "Other service"
    : b?.service || b?.serviceName || "Other service";

const getPrice = (b) =>
  Number(
    b?.service?.price ??
      b?.service?.servicePrice ??
      b?.price ??
      0
  );

const getBarberId = (b) =>
  typeof b?.barberId === "object"
    ? b.barberId?._id || b.barberId?.id
    : b?.barberId;

const getCustomer = (b) => {
  const user = b?.userId || b?.user || b?.customer;

  const name =
    typeof user === "object"
      ? user?.name ||
        user?.fullName ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        user?.username
      : b?.customerName || b?.name;

  return {
    id:
      typeof user === "object"
        ? user?._id || user?.id
        : user || b?.customerId || name || "unknown",
    name: name || "Unknown customer",
    phone:
      (typeof user === "object" ? user?.phone || user?.phoneNumber : null) ||
      b?.phone ||
      b?.phoneNumber ||
      "—",
  };
};

const Panel = ({ title, children }) => (
  <Box
    sx={{
      bgcolor: "#fff",
      p: { xs: 2, md: 2.5 },
      borderRadius: 3,
      border: `1px solid ${C.border}`,
      minWidth: 0,
    }}
  >
    <Typography
      sx={{ color: C.ink, fontWeight: 800, fontSize: 16, mb: 2 }}
    >
      {title}
    </Typography>
    {children}
  </Box>
);

const StatCard = ({ title, value, subtitle, color = C.ink }) => (
  <Box
    sx={{
      bgcolor: "#fff",
      p: 2.2,
      borderRadius: 3,
      border: `1px solid ${C.border}`,
      borderTop: `3px solid ${color}`,
      minWidth: 0,
    }}
  >
    <Typography sx={{ color: C.muted, fontSize: 12 }}>
      {title}
    </Typography>
    <Typography
      sx={{
        mt: 1,
        color,
        fontWeight: 850,
        fontSize: { xs: 21, md: 25 },
        overflowWrap: "anywhere",
      }}
    >
      {value}
    </Typography>
    {subtitle && (
      <Typography sx={{ color: C.muted, fontSize: 11, mt: 0.5 }}>
        {subtitle}
      </Typography>
    )}
  </Box>
);

const BarberAnalytics = () => {
  const allBookings = useSelector(
    (state) => state.booking?.bookings || []
  );
  const user = useSelector((state) => state.auth?.user);
  const [period, setPeriod] = useState("month");

  const bookings = useMemo(() => {
    const userId = user?._id || user?.id;

    if (user?.role !== "barber" || !userId) return allBookings;

    return allBookings.filter(
      (b) => String(getBarberId(b)) === String(userId)
    );
  }, [allBookings, user]);

  const report = useMemo(() => {
    const today = dayjs().endOf("day");
    const start = dayjs()
      .startOf("day")
      .subtract(period === "week" ? 6 : 29, "day");

    const filtered = bookings.filter((b) => {
      if (!b.bookingTime) return false;

      const date = dayjs(b.bookingTime);
      return (
        date.isValid() &&
        !date.isBefore(start) &&
        !date.isAfter(today)
      );
    });

    const completed = filtered.filter(
      (b) => getStatus(b) === "completed"
    ).length;

    const cancelled = filtered.filter(
      (b) => getStatus(b) === "cancelled"
    ).length;

    const income = filtered
      .filter((b) => getStatus(b) === "completed")
      .reduce((sum, b) => sum + getPrice(b), 0);

    // Popular services
    const serviceMap = {};

    filtered.forEach((b) => {
      const name = getServiceName(b);
      serviceMap[name] = (serviceMap[name] || 0) + 1;
    });

    const services = Object.entries(serviceMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Top customers ranked by number of bookings
    const customerMap = {};

    filtered.forEach((b) => {
      const customer = getCustomer(b);

      if (customer.name === "Unknown customer") return;

      const key = String(customer.id);

      if (!customerMap[key]) {
        customerMap[key] = {
          ...customer,
          bookings: 0,
          completed: 0,
          cancelled: 0,
          spent: 0,
          lastBooking: b.bookingTime,
        };
      }

      const entry = customerMap[key];
      entry.bookings += 1;

      if (getStatus(b) === "completed") {
        entry.completed += 1;
        entry.spent += getPrice(b);
      }

      if (getStatus(b) === "cancelled") {
        entry.cancelled += 1;
      }

      if (dayjs(b.bookingTime).isAfter(dayjs(entry.lastBooking))) {
        entry.lastBooking = b.bookingTime;
      }
    });

    const customers = Object.values(customerMap)
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 10);

    // Income cards for the last six calendar months
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = dayjs()
        .startOf("month")
        .subtract(5 - i, "month");

      const monthBookings = bookings.filter(
        (b) =>
          b.bookingTime &&
          dayjs(b.bookingTime).isValid() &&
          dayjs(b.bookingTime).isSame(date, "month") &&
          getStatus(b) === "completed"
      );

      return {
        month: date.format("MMM YYYY"),
        income: monthBookings.reduce(
          (sum, b) => sum + getPrice(b),
          0
        ),
      };
    });

    return {
      total: filtered.length,
      completed,
      cancelled,
      income,
      cancellationRate: filtered.length
        ? Math.round((cancelled / filtered.length) * 100)
        : 0,
      services,
      customers,
      months,
    };
  }, [bookings, period]);

  const pieColors = [
    C.blue,
    C.gold,
    C.mist,
    C.green,
    C.red,
    "#8B83B5",
    "#C58B65",
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: C.bg,
        p: { xs: 1.5, md: 4 },
        pt: { xs: "85px", md: "100px" },
      }}
    >
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ sm: "center" }}
          gap={2}
          mb={3}
        >
          <Box>
            <Typography
              sx={{
                fontSize: { xs: 27, md: 34 },
                fontWeight: 850,
                color: C.ink,
              }}
            >
              Analytics Report
            </Typography>
            <Typography sx={{ color: C.muted, fontSize: 13 }}>
              Business performance and customer insights
            </Typography>
          </Box>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={period}
            onChange={(_, value) => value && setPeriod(value)}
            sx={{
              bgcolor: "#fff",
              "& .Mui-selected": {
                bgcolor: `${C.ink} !important`,
                color: "#fff !important",
              },
            }}
          >
            <ToggleButton value="week">7 Days</ToggleButton>
            <ToggleButton value="month">30 Days</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {/* Summary cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
            gap: 1.5,
            mb: 2,
          }}
        >
          <StatCard
            title="Total Bookings"
            value={report.total}
            color={C.blue}
          />
          <StatCard
            title="Completed"
            value={report.completed}
            color={C.green}
          />
          <StatCard
            title="Cancellation Rate"
            value={`${report.cancellationRate}%`}
            color={C.red}
          />
          <StatCard
            title="Income"
            value={money(report.income)}
            subtitle="Completed bookings only"
            color={C.gold}
          />
        </Box>

        {/* Monthly income cards */}
        <Panel title="Monthly Income">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(3, minmax(0, 1fr))",
                lg: "repeat(6, minmax(0, 1fr))",
              },
              gap: 1.5,
            }}
          >
            {report.months.map((month) => (
              <Box
                key={month.month}
                sx={{
                  p: 1.7,
                  borderRadius: 2.5,
                  bgcolor: C.bg,
                  border: `1px solid ${C.border}`,
                }}
              >
                <Typography sx={{ fontSize: 12, color: C.muted }}>
                  {month.month}
                </Typography>
                <Typography
                  sx={{
                    mt: 1,
                    color: C.ink,
                    fontWeight: 800,
                    fontSize: { xs: 15, md: 17 },
                    overflowWrap: "anywhere",
                  }}
                >
                  {money(month.income)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Panel>

        {/* Popular services pie chart */}
        <Box sx={{ mt: 2 }}>
          <Panel title="Popular Services">
            {report.services.length ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "minmax(0, 1fr) minmax(0, 1fr)",
                  },
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box sx={{ height: 270, minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={report.services}
                        dataKey="count"
                        nameKey="name"
                        innerRadius={65}
                        outerRadius={100}
                        paddingAngle={3}
                      >
                        {report.services.map((service, index) => (
                          <Cell
                            key={service.name}
                            fill={pieColors[index % pieColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          `${value} booking${value === 1 ? "" : "s"}`,
                          "Total",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>

                <Stack gap={1.5}>
                  {report.services.map((service, index) => (
                    <Stack
                      key={service.name}
                      direction="row"
                      alignItems="center"
                      gap={1.2}
                    >
                      <Box
                        sx={{
                          width: 11,
                          height: 11,
                          flexShrink: 0,
                          borderRadius: 1,
                          bgcolor:
                            pieColors[index % pieColors.length],
                        }}
                      />
                      <Typography
                        sx={{
                          flex: 1,
                          fontSize: 13,
                          color: C.ink,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {service.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${service.count} bookings`}
                        sx={{
                          bgcolor: C.bg,
                          fontWeight: 700,
                          fontSize: 11,
                        }}
                      />
                    </Stack>
                  ))}
                </Stack>
              </Box>
            ) : (
              <Typography sx={{ color: C.muted, py: 3 }}>
                No bookings found for this period.
              </Typography>
            )}
          </Panel>
        </Box>

        {/* Top customers table */}
        <Box sx={{ mt: 2 }}>
          <Panel title="Top Customers">
            <Typography
              sx={{ color: C.muted, fontSize: 12, mb: 2 }}
            >
              Ranked by number of bookings during the selected period.
            </Typography>

            {report.customers.length ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: C.bg }}>
                      {[
                        "Rank",
                        "Customer",
                        "Phone",
                        "Bookings",
                        "Completed",
                        "Amount Spent",
                        "Last Booking",
                      ].map((heading) => (
                        <TableCell
                          key={heading}
                          sx={{
                            fontWeight: 800,
                            color: C.ink,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {heading}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {report.customers.map((customer, index) => (
                      <TableRow
                        key={customer.id}
                        hover
                        sx={{
                          "&:last-child td": { borderBottom: 0 },
                        }}
                      >
                        <TableCell>
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              bgcolor:
                                index === 0
                                  ? C.cream
                                  : C.bg,
                              color: C.ink,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: 12,
                            }}
                          >
                            {index + 1}
                          </Box>
                        </TableCell>

                        <TableCell sx={{ fontWeight: 700, color: C.ink }}>
                          {customer.name}
                        </TableCell>

                        <TableCell sx={{ color: C.muted }}>
                          {customer.phone}
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={customer.bookings}
                            sx={{ bgcolor: C.bg, fontWeight: 700 }}
                          />
                        </TableCell>

                        <TableCell>{customer.completed}</TableCell>

                        <TableCell
                          sx={{
                            color: C.green,
                            fontWeight: 800,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {money(customer.spent)}
                        </TableCell>

                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {dayjs(customer.lastBooking).format("DD MMM YYYY")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography sx={{ color: C.muted, py: 3 }}>
                No customer records found for this period.
              </Typography>
            )}
          </Panel>
        </Box>

        <Typography
          sx={{
            textAlign: "center",
            color: C.muted,
            fontSize: 11,
            mt: 3,
          }}
        >
          Income includes completed bookings only.
        </Typography>
      </Box>
    </Box>
  );
};

export default BarberAnalytics;