// BarberAnalytics.jsx
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  Box, Typography, Stack, ToggleButton, ToggleButtonGroup, Chip,
} from "@mui/material";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip,
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

const statusOf = (b) =>
  String(b?.status || "pending").toLowerCase() === "rejected"
    ? "cancelled"
    : String(b?.status || "pending").toLowerCase();

const serviceName = (b) =>
  b?.service?.serviceName || "Other service";

const priceOf = (b) =>
  Number(b?.service?.price ?? b?.service?.servicePrice ?? b?.price ?? 0);

const barberIdOf = (b) =>
  typeof b?.barberId === "object"
    ? b.barberId?._id || b.barberId?.id
    : b?.barberId;

// Reusable card component
const Panel = ({ title, children }) => (
  <Box sx={{
    bgcolor: "#fff", p: 2.5, borderRadius: 3,
    border: `1px solid ${C.border}`, minWidth: 0,
  }}>
    <Typography sx={{ fontWeight: 800, color: C.ink, mb: 2 }}>
      {title}
    </Typography>
    {children}
  </Box>
);

// Reusable statistics card
const StatCard = ({ title, value, color = C.blue }) => (
  <Box sx={{
    bgcolor: "#fff", p: 2, borderRadius: 3,
    border: `1px solid ${C.border}`, minWidth: 0,
  }}>
    <Typography sx={{ color: C.muted, fontSize: 12 }}>
      {title}
    </Typography>
    <Typography sx={{
      mt: 1, color, fontSize: { xs: 21, md: 27 },
      fontWeight: 800, overflowWrap: "anywhere",
    }}>
      {value}
    </Typography>
  </Box>
);

// Reusable chart tooltip
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <Box sx={{
      bgcolor: C.ink, color: "#fff", p: 1.5,
      borderRadius: 2, fontSize: 12,
    }}>
      <Typography sx={{ fontSize: 12, mb: 0.5 }}>{label}</Typography>
      {payload.map((item) => (
        <Typography key={item.dataKey} sx={{ fontSize: 12 }}>
          {item.name || item.dataKey}: {item.dataKey === "revenue"
            ? money(item.value)
            : item.value}
        </Typography>
      ))}
    </Box>
  );
};

const BarberAnalytics = () => {
  const allBookings = useSelector(
    (state) => state.booking?.bookings || []
  );
  const user = useSelector((state) => state.auth?.user);
  const [period, setPeriod] = useState("week");

  const bookings = useMemo(() => {
    const userId = user?._id || user?.id;

    if (user?.role !== "barber" || !userId) return allBookings;

    return allBookings.filter(
      (b) => String(barberIdOf(b)) === String(userId)
    );
  }, [allBookings, user]);

  const data = useMemo(() => {
    const today = dayjs().endOf("day");
    const start = dayjs().startOf("day").subtract(
      period === "week" ? 6 : 29, "day"
    );

    const current = bookings.filter((b) =>
      b.bookingTime &&
      !dayjs(b.bookingTime).isBefore(start) &&
      !dayjs(b.bookingTime).isAfter(today)
    );

    const count = (list, status) =>
      list.filter((b) => statusOf(b) === status).length;

    const revenue = (list) =>
      list.filter((b) => statusOf(b) === "completed")
        .reduce((sum, b) => sum + priceOf(b), 0);

    const trend = Array.from({
      length: period === "week" ? 7 : 30,
    }, (_, i) => {
      const date = start.add(i, "day");
      const daily = current.filter((b) =>
        dayjs(b.bookingTime).isSame(date, "day")
      );

      return {
        label: period === "week"
          ? date.format("ddd")
          : date.format("DD MMM"),
        bookings: daily.length,
        revenue: revenue(daily),
      };
    });

    const serviceMap = {};
    current.forEach((b) => {
      const name = serviceName(b);
      serviceMap[name] = (serviceMap[name] || 0) + 1;
    });

    const services = Object.entries(serviceMap)
      .map(([name, bookings]) => ({ name, bookings }))
      .sort((a, b) => b.bookings - a.bookings);

    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const days = weekdays.map((name, i) => ({
      name,
      bookings: current.filter(
        (b) => (dayjs(b.bookingTime).day() + 6) % 7 === i
      ).length,
    }));

    const hourMap = {};
    current.forEach((b) => {
      const time = dayjs(b.bookingTime);
      const hour = time.hour();
      const label = time.format("h A");

      hourMap[hour] = {
        label,
        bookings: (hourMap[hour]?.bookings || 0) + 1,
      };
    });

    const hours = Object.entries(hourMap)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, value]) => value);

    const months = Array.from({ length: 6 }, (_, i) => {
      const date = dayjs().startOf("month").subtract(5 - i, "month");
      const monthBookings = bookings.filter(
        (b) => b.bookingTime &&
          dayjs(b.bookingTime).isSame(date, "month")
      );

      return {
        month: date.format("MMM"),
        revenue: revenue(monthBookings),
      };
    });

    return {
      total: current.length,
      completed: count(current, "completed"),
      cancelled: count(current, "cancelled"),
      cancellationRate: current.length
        ? Math.round(count(current, "cancelled") / current.length * 100)
        : 0,
      income: revenue(current),
      trend,
      services,
      days,
      hours,
      months,
    };
  }, [bookings, period]);

  const chartProps = {
    margin: { top: 5, right: 10, left: -20, bottom: 0 },
  };

  return (
    <Box sx={{
      minHeight: "100vh", bgcolor: C.bg,
      p: { xs: 1.5, md: 4 }, pt: { xs: "85px", md: "100px" },
    }}>
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ sm: "center" }}
          gap={2} mb={3}
        >
          <Box>
            <Typography sx={{
              fontSize: { xs: 26, md: 34 },
              fontWeight: 850, color: C.ink,
            }}>
              Analytics Report
            </Typography>
            <Typography sx={{ color: C.muted, fontSize: 13 }}>
              Bookings, popular services and income overview
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
            <ToggleButton value="week">Last 7 days</ToggleButton>
            <ToggleButton value="month">Last 30 days</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {/* Statistics */}
        <Box sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)", lg: "repeat(4, 1fr)",
          },
          gap: 1.5, mb: 1.5,
        }}>
          <StatCard title="Total bookings" value={data.total} />
          <StatCard
            title="Completed bookings"
            value={data.completed}
            color={C.green}
          />
          <StatCard
            title="Cancellation rate"
            value={`${data.cancellationRate}%`}
            color={C.red}
          />
          <StatCard
            title="Total income"
            value={money(data.income)}
            color={C.gold}
          />
        </Box>

        {/* Booking activity */}
        <Box sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.4fr 1fr" },
          gap: 1.5, mb: 1.5,
        }}>
          <Panel title="Booking activity">
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={data.trend} {...chartProps}>
                  <CartesianGrid stroke={C.border} strokeDasharray="4 4" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    dataKey="bookings"
                    name="Bookings"
                    stroke={C.blue}
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Panel>

          <Panel title="Booking status">
            <Box sx={{ height: 230 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Completed", value: data.completed },
                      { name: "Cancelled", value: data.cancelled },
                      {
                        name: "Other",
                        value: Math.max(
                          0, data.total - data.completed - data.cancelled
                        ),
                      },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                  >
                    {[C.blue, C.red, C.gold].map((color, i) => (
                      <Cell key={i} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Typography sx={{ textAlign: "center", color: C.muted }}>
              {data.cancelled} cancelled out of {data.total} bookings
            </Typography>
          </Panel>
        </Box>

        {/* Services and popular days */}
        <Box sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: 1.5, mb: 1.5,
        }}>
          <Panel title="Popular services">
            {data.services.length ? (
              <Box sx={{ height: Math.max(230, data.services.length * 45) }}>
                <ResponsiveContainer>
                  <BarChart
                    data={data.services.slice(0, 6)}
                    layout="vertical"
                    margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid stroke={C.border} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="bookings"
                      name="Bookings"
                      fill={C.blue}
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Typography color="text.secondary">
                No service bookings available.
              </Typography>
            )}
          </Panel>

          <Panel title="Popular booking days">
            <Box sx={{ height: 270 }}>
              <ResponsiveContainer>
                <BarChart data={data.days} {...chartProps}>
                  <CartesianGrid stroke={C.border} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="bookings"
                    name="Bookings"
                    fill={C.mist}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Panel>
        </Box>

        {/* Monthly income and popular times */}
        <Box sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: 1.5,
        }}>
          <Panel title="Monthly income">
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={data.months} {...chartProps}>
                  <CartesianGrid stroke={C.border} />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={(n) =>
                      n >= 1000 ? `${Math.round(n / 1000)}k` : n
                    }
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    dataKey="revenue"
                    name="Income"
                    stroke={C.gold}
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Panel>

          <Panel title="Popular booking times">
            {data.hours.length ? (
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={data.hours} {...chartProps}>
                    <CartesianGrid stroke={C.border} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="bookings"
                      name="Bookings"
                      fill={C.blue}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Typography color="text.secondary">
                No booking times available.
              </Typography>
            )}
          </Panel>
        </Box>

        <Typography sx={{
          textAlign: "center", mt: 3, fontSize: 11, color: C.muted,
        }}>
          Income is calculated from completed bookings only.
        </Typography>
      </Box>
    </Box>
  );
};

export default BarberAnalytics;