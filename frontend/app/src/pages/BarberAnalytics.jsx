// BarberAnalytics.jsx
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  Box, Typography, Stack, ToggleButton, ToggleButtonGroup,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip,
} from "@mui/material";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";

const C = {
  ink: "#213448",
  blue: "#547792",
  mist: "#94B4C1",
  gold: "#D6A93A",
  red: "#C96B64",
  green: "#4F8A76",
  bg: "#F6F8FA",
  border: "#E3E9EE",
  muted: "#718096",
};

const money = (n) => `NPR ${Number(n || 0).toLocaleString("en-IN")}`;

const statusOf = (b) => {
  const s = String(b?.status || "pending").toLowerCase();
  return s === "rejected" ? "cancelled" : s;
};

const serviceName = (b) =>
  typeof b?.service === "object"
    ? b.service?.serviceName || b.service?.name || "Other service"
    : b?.service || b?.serviceName || "Other service";

const priceOf = (b) =>
  Number(b?.service?.price ?? b?.service?.servicePrice ?? b?.price ?? 0);

const barberIdOf = (b) =>
  typeof b?.barberId === "object"
    ? b.barberId?._id || b.barberId?.id
    : b?.barberId;

const customerOf = (b) => {
  const u = b?.userId || b?.user || b?.customer;
  const name =
    typeof u === "object"
      ? u?.name || u?.fullName ||
        [u?.firstName, u?.lastName].filter(Boolean).join(" ") ||
        u?.username
      : b?.customerName || b?.name;

  return {
    id: typeof u === "object" ? u?._id || u?.id : u || b?.customerId || name,
    name: name || "Unknown customer",
    phone:
      (typeof u === "object" ? u?.phone || u?.phoneNumber : null) ||
      b?.phone || b?.phoneNumber || "—",
  };
};

const Panel = ({ title, children }) => (
  <Box sx={{
    bgcolor: "#fff", p: { xs: 2, md: 2.5 },
    border: `1px solid ${C.border}`, borderRadius: 3, minWidth: 0,
  }}>
    <Typography sx={{ fontWeight: 800, color: C.ink, mb: 2 }}>
      {title}
    </Typography>
    {children}
  </Box>
);

const StatCard = ({ title, value, color = C.ink, subtitle }) => (
  <Box sx={{
    bgcolor: "#fff", p: 2, borderRadius: 3,
    border: `1px solid ${C.border}`, borderTop: `3px solid ${color}`,
    minWidth: 0,
  }}>
    <Typography sx={{ color: C.muted, fontSize: 12 }}>{title}</Typography>
    <Typography sx={{
      mt: 1, color, fontWeight: 850,
      fontSize: { xs: 21, md: 25 }, overflowWrap: "anywhere",
    }}>
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
    const id = user?._id || user?.id;
    if (user?.role !== "barber" || !id) return allBookings;
    return allBookings.filter(
      (b) => String(barberIdOf(b)) === String(id)
    );
  }, [allBookings, user]);

  const report = useMemo(() => {
    const today = dayjs().endOf("day");
    const start = dayjs().startOf("day").subtract(
      period === "week" ? 6 : 29, "day"
    );

    const current = bookings.filter((b) => {
      if (!b.bookingTime) return false;
      const date = dayjs(b.bookingTime);
      return date.isValid() && !date.isBefore(start) && !date.isAfter(today);
    });

    const completed = current.filter(
      (b) => statusOf(b) === "completed"
    ).length;
    const cancelled = current.filter(
      (b) => statusOf(b) === "cancelled"
    ).length;

    const income = current
      .filter((b) => statusOf(b) === "completed")
      .reduce((sum, b) => sum + priceOf(b), 0);

    // One pie chart: services and booking counts
    const serviceCounts = {};
    current.forEach((b) => {
      const name = serviceName(b);
      serviceCounts[name] = (serviceCounts[name] || 0) + 1;
    });

    const services = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // One graph: booking activity
    const trend = Array.from(
      { length: period === "week" ? 7 : 30 },
      (_, i) => {
        const date = start.add(i, "day");
        return {
          date: period === "week"
            ? date.format("ddd")
            : date.format("DD MMM"),
          bookings: current.filter(
            (b) => dayjs(b.bookingTime).isSame(date, "day")
          ).length,
        };
      }
    );

    // Six monthly income cards
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = dayjs().startOf("month").subtract(5 - i, "month");
      const monthBookings = bookings.filter(
        (b) =>
          b.bookingTime &&
          dayjs(b.bookingTime).isValid() &&
          dayjs(b.bookingTime).isSame(date, "month") &&
          statusOf(b) === "completed"
      );

      return {
        month: date.format("MMM YYYY"),
        income: monthBookings.reduce((sum, b) => sum + priceOf(b), 0),
      };
    });

    // Top customers by booking frequency
    const customerMap = {};
    current.forEach((b) => {
      const customer = customerOf(b);
      if (!customer.id || customer.name === "Unknown customer") return;

      const key = String(customer.id);
      if (!customerMap[key]) {
        customerMap[key] = {
          ...customer,
          bookings: 0,
          completed: 0,
          spent: 0,
          lastBooking: b.bookingTime,
        };
      }

      const item = customerMap[key];
      item.bookings += 1;

      if (statusOf(b) === "completed") {
        item.completed += 1;
        item.spent += priceOf(b);
      }

      if (dayjs(b.bookingTime).isAfter(dayjs(item.lastBooking))) {
        item.lastBooking = b.bookingTime;
      }
    });

    const customers = Object.values(customerMap)
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 10);

    return {
      total: current.length,
      completed,
      cancelled,
      income,
      cancellationRate: current.length
        ? Math.round((cancelled / current.length) * 100)
        : 0,
      services,
      trend,
      months,
      customers,
    };
  }, [bookings, period]);

  const pieColors = [
    C.blue, C.gold, C.mist, C.green, C.red, "#8B83B5", "#C58B65",
  ];

  return (
    <Box sx={{
      minHeight: "100vh", bgcolor: C.bg,
      p: { xs: 1.5, md: 4 }, pt: { xs: "85px", md: "100px" },
    }}>
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
            <Typography sx={{
              fontSize: { xs: 27, md: 34 },
              fontWeight: 850, color: C.ink,
            }}>
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

        {/* Normal statistic cards */}
        <Box sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 1.5, mb: 2,
        }}>
          <StatCard title="Total Bookings" value={report.total} color={C.blue} />
          <StatCard title="Completed" value={report.completed} color={C.green} />
          <StatCard
            title="Cancelled"
            value={report.cancelled}
            color={C.red}
          />
          <StatCard
            title="Cancellation Rate"
            value={`${report.cancellationRate}%`}
            color={C.gold}
          />
        </Box>

        {/* Monthly income cards */}
        <Panel title="Monthly Income">
          <Box sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(3, minmax(0, 1fr))",
              lg: "repeat(6, minmax(0, 1fr))",
            },
            gap: 1.5,
          }}>
            {report.months.map((m) => (
              <Box key={m.month} sx={{
                p: 1.7, borderRadius: 2.5,
                bgcolor: C.bg, border: `1px solid ${C.border}`,
              }}>
                <Typography sx={{ color: C.muted, fontSize: 12 }}>
                  {m.month}
                </Typography>
                <Typography sx={{
                  mt: 1, fontWeight: 800, color: C.ink,
                  fontSize: { xs: 15, md: 17 }, overflowWrap: "anywhere",
                }}>
                  {money(m.income)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Panel>

        {/* ONE graph */}
        <Box sx={{ mt: 2 }}>
          <Panel title="Booking Activity">
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={report.trend}>
                  <CartesianGrid stroke={C.border} strokeDasharray="4 4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line
                    dataKey="bookings"
                    name="Bookings"
                    stroke={C.blue}
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Panel>
        </Box>

        {/* ONE chart */}
        <Box sx={{ mt: 2 }}>
          <Panel title="Popular Services">
            {report.services.length ? (
              <Box sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "minmax(0, 1fr) minmax(0, 1fr)",
                },
                alignItems: "center",
                gap: 2,
              }}>
                <Box sx={{ height: 280, minWidth: 0 }}>
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
                        formatter={(value) => [`${value} bookings`, "Total"]}
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
                      gap={1}
                    >
                      <Box sx={{
                        width: 11, height: 11, borderRadius: 1,
                        bgcolor: pieColors[index % pieColors.length],
                        flexShrink: 0,
                      }} />
                      <Typography sx={{
                        flex: 1, color: C.ink, fontSize: 13,
                      }}>
                        {service.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${service.count} bookings`}
                        sx={{ bgcolor: C.bg, fontWeight: 700 }}
                      />
                    </Stack>
                  ))}
                </Stack>
              </Box>
            ) : (
              <Typography sx={{ color: C.muted, py: 3 }}>
                No services booked during this period.
              </Typography>
            )}
          </Panel>
        </Box>

        {/* ONE table */}
        <Box sx={{ mt: 2 }}>
          <Panel title="Top Customers">
            <Typography sx={{ color: C.muted, fontSize: 12, mb: 2 }}>
              Ranked by booking frequency during the selected period.
            </Typography>

            {report.customers.length ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: C.bg }}>
                      {[
                        "Rank", "Customer", "Phone", "Bookings",
                        "Completed", "Amount Spent", "Last Booking",
                      ].map((heading) => (
                        <TableCell key={heading} sx={{
                          fontWeight: 800, color: C.ink, whiteSpace: "nowrap",
                        }}>
                          {heading}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.customers.map((customer, index) => (
                      <TableRow key={customer.id} hover>
                        <TableCell>
                          <Chip
                            size="small"
                            label={index + 1}
                            sx={{
                              bgcolor: index === 0 ? C.gold : C.bg,
                              fontWeight: 800,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: C.ink }}>
                          {customer.name}
                        </TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell>{customer.bookings}</TableCell>
                        <TableCell>{customer.completed}</TableCell>
                        <TableCell sx={{
                          color: C.green, fontWeight: 800, whiteSpace: "nowrap",
                        }}>
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

        <Typography sx={{
          textAlign: "center", color: C.muted, fontSize: 11, mt: 3,
        }}>
          Income is calculated from completed bookings only.
        </Typography>
      </Box>
    </Box>
  );
};

export default BarberAnalytics;