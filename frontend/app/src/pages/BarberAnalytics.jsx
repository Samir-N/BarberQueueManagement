import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  Chip,
  LinearProgress,
} from "@mui/material";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import ContentCutRoundedIcon from "@mui/icons-material/ContentCut";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";

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
  white: "#FFFFFF",
};
const CHART_COLORS = [C.blue, C.mist, C.gold, C.cream];
const money = (value) =>
  `NPR ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const statusOf = (booking) => {
  const status = String(booking?.status || "pending").toLowerCase();
  return status === "rejected" ? "cancelled" : status;
};
const barberIdOf = (booking) =>
  typeof booking?.barberId === "object"
    ? booking.barberId?._id || booking.barberId?.id
    : booking?.barberId;
const serviceNameOf = (booking) => booking?.service?.serviceName || "Other service";
const priceOf = (booking) =>
  Number(booking?.service?.price ?? booking?.service?.servicePrice ?? booking?.price ?? 0) || 0;

const Panel = ({ title, subtitle, action, children, sx = {} }) => (
  <Box
    sx={{
      minWidth: 0,
      p: { xs: 2, md: 2.5 },
      bgcolor: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: "18px",
      boxShadow: "0 5px 22px rgba(33,52,72,0.045)",
      ...sx,
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1} mb={2.5}>
      <Box>
        <Typography sx={{ fontSize: 15, fontWeight: 800, color: C.ink }}>{title}</Typography>
        {subtitle && (
          <Typography sx={{ mt: 0.4, fontSize: 12, color: C.muted }}>{subtitle}</Typography>
        )}
      </Box>
      {action}
    </Stack>
    {children}
  </Box>
);

const StatCard = ({ title, value, subtitle, icon, accent = C.blue, change }) => (
  <Box
    sx={{
      p: 2.2,
      minWidth: 0,
      borderRadius: "18px",
      bgcolor: C.white,
      border: `1px solid ${C.border}`,
      boxShadow: "0 5px 22px rgba(33,52,72,0.04)",
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
      <Typography sx={{ color: C.muted, fontSize: 12, fontWeight: 700 }}>{title}</Typography>
      <Box sx={{ width: 38, height: 38, borderRadius: "12px", display: "grid", placeItems: "center", bgcolor: `${accent}20`, color: accent }}>
        {icon}
      </Box>
    </Stack>
    <Typography sx={{ mt: 1.3, color: C.ink, fontWeight: 850, fontSize: { xs: 24, md: 29 }, letterSpacing: "-0.8px", lineHeight: 1.2 }}>
      {value}
    </Typography>
    <Stack direction="row" alignItems="center" gap={0.8} mt={1}>
      {change !== undefined && change !== null && (
        <Chip
          size="small"
          label={`${change > 0 ? "+" : ""}${change}%`}
          sx={{
            height: 23,
            fontWeight: 800,
            fontSize: 10,
            bgcolor: change >= 0 ? "#E8F3EE" : "#F9ECEA",
            color: change >= 0 ? C.green : C.red,
          }}
        />
      )}
      <Typography sx={{ fontSize: 11, color: C.muted }}>{subtitle}</Typography>
    </Stack>
  </Box>
);

const ChartTooltip = ({ active, payload, label, currency = false }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: C.ink, color: "#fff", p: 1.2, borderRadius: "10px", boxShadow: "0 8px 25px #21344830" }}>
      <Typography sx={{ fontSize: 11, opacity: 0.75, mb: 0.4 }}>{label}</Typography>
      {payload.map((item) => (
        <Typography key={item.dataKey} sx={{ fontSize: 12, fontWeight: 750 }}>
          {item.name || item.dataKey}: {currency ? money(item.value) : Number(item.value).toLocaleString()}
        </Typography>
      ))}
    </Box>
  );
};

const BarberAnalytics = () => {
  const allBookings = useSelector((state) => state.booking?.bookings || []);
  const user = useSelector((state) => state.auth?.user);
  const [period, setPeriod] = useState("week");
  const currentUserId = user?._id || user?.id;

  const bookings = useMemo(() => {
    if (user?.role !== "barber" || !currentUserId) return allBookings;
    return allBookings.filter((booking) => String(barberIdOf(booking)) === String(currentUserId));
  }, [allBookings, user?.role, currentUserId]);

  const data = useMemo(() => {
    const today = dayjs().startOf("day");
    const start = period === "week" ? today.subtract(6, "day") : today.subtract(29, "day");
    const daysCount = period === "week" ? 7 : 30;
    const inPeriod = bookings.filter((b) => b.bookingTime && !dayjs(b.bookingTime).isBefore(start) && !dayjs(b.bookingTime).isAfter(today.endOf("day")));
    const previousStart = start.subtract(daysCount, "day");
    const previousEnd = start.subtract(1, "millisecond");
    const previous = bookings.filter((b) => b.bookingTime && !dayjs(b.bookingTime).isBefore(previousStart) && !dayjs(b.bookingTime).isAfter(previousEnd));
    const countStatus = (list, status) => list.filter((b) => statusOf(b) === status).length;
    const revenue = (list) => list.filter((b) => statusOf(b) === "completed").reduce((sum, b) => sum + priceOf(b), 0);
    const pctChange = (current, old) => old ? Math.round(((current - old) / old) * 100) : current ? null : 0;

    const trend = Array.from({ length: daysCount }, (_, index) => {
      const date = start.add(index, "day");
      const dayBookings = inPeriod.filter((b) => dayjs(b.bookingTime).isSame(date, "day"));
      return {
        label: period === "week" ? date.format("ddd") : date.format("DD MMM"),
        bookings: dayBookings.length,
        completed: countStatus(dayBookings, "completed"),
        cancelled: countStatus(dayBookings, "cancelled"),
        revenue: revenue(dayBookings),
      };
    });

    const serviceMap = {};
    inPeriod.forEach((b) => {
      const name = serviceNameOf(b);
      serviceMap[name] = (serviceMap[name] || 0) + 1;
    });
    const services = Object.entries(serviceMap)
      .map(([name, value]) => ({ name, bookings: value }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 6);

    const statusData = [
      { name: "Completed", value: countStatus(inPeriod, "completed"), color: C.blue },
      { name: "Confirmed", value: countStatus(inPeriod, "confirmed"), color: C.mist },
      { name: "Pending", value: countStatus(inPeriod, "pending"), color: C.gold },
      { name: "Cancelled", value: countStatus(inPeriod, "cancelled"), color: C.red },
    ];
    const cancelRate = inPeriod.length ? Math.round((countStatus(inPeriod, "cancelled") / inPeriod.length) * 100) : 0;

    const weekdayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekdayData = weekdayOrder.map((name, i) => ({
      name,
      bookings: inPeriod.filter((b) => ((dayjs(b.bookingTime).day() + 6) % 7) === i).length,
    }));
    const hoursMap = {};
    inPeriod.forEach((b) => {
      const hour = dayjs(b.bookingTime).hour();
      const label = dayjs(b.bookingTime).format("h A");
      hoursMap[hour] = { hour, label, bookings: (hoursMap[hour]?.bookings || 0) + 1 };
    });
    const hours = Object.values(hoursMap).sort((a, b) => a.hour - b.hour);
    const peakHour = [...hours].sort((a, b) => b.bookings - a.bookings)[0];
    const peakDay = [...weekdayData].sort((a, b) => b.bookings - a.bookings)[0];

    const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
      const date = dayjs().startOf("month").subtract(5 - i, "month");
      const monthBookings = bookings.filter((b) => b.bookingTime && dayjs(b.bookingTime).isSame(date, "month"));
      return { month: date.format("MMM"), revenue: revenue(monthBookings), bookings: monthBookings.length };
    });

    return {
      inPeriod,
      total: inPeriod.length,
      previousTotal: previous.length,
      revenue: revenue(inPeriod),
      previousRevenue: revenue(previous),
      cancelRate,
      cancelled: countStatus(inPeriod, "cancelled"),
      completed: countStatus(inPeriod, "completed"),
      trend,
      services,
      statusData,
      weekdayData,
      hours,
      peakHour,
      peakDay,
      monthlyRevenue,
      bookingChange: pctChange(inPeriod.length, previous.length),
      revenueChange: pctChange(revenue(inPeriod), revenue(previous)),
    };
  }, [bookings, period]);

  const rate = data.total ? Math.round((data.completed / data.total) * 100) : 0;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: C.bg, px: { xs: 1.5, md: 3.5 }, pt: { xs: "84px", md: "100px" }, pb: 5 }}>
      <Box sx={{ maxWidth: 1440, mx: "auto" }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={2} mb={3}>
          <Box>
            <Stack direction="row" alignItems="center" gap={1} mb={0.7}>
              <Box sx={{ width: 36, height: 36, display: "grid", placeItems: "center", bgcolor: C.ink, color: C.cream, borderRadius: "12px" }}>
                <CalendarMonthRoundedIcon fontSize="small" />
              </Box>
              <Typography sx={{ fontSize: 12, color: C.blue, fontWeight: 800, letterSpacing: 1.1, textTransform: "uppercase" }}>BarberQueue insights</Typography>
            </Stack>
            <Typography sx={{ fontSize: { xs: 27, md: 34 }, color: C.ink, fontWeight: 850, letterSpacing: "-1.2px", lineHeight: 1.15 }}>
              Analytics overview
            </Typography>
            <Typography sx={{ mt: 0.8, color: C.muted, fontSize: 13 }}>
              A clear view of bookings, service demand, cancellations and earnings.
            </Typography>
          </Box>
          <ToggleButtonGroup
            exclusive
            value={period}
            onChange={(_, value) => value && setPeriod(value)}
            size="small"
            sx={{
              alignSelf: { xs: "flex-start", sm: "center" },
              bgcolor: C.white,
              p: 0.5,
              border: `1px solid ${C.border}`,
              borderRadius: "12px",
              "& .MuiToggleButton-root": { px: 2, border: 0, borderRadius: "9px !important", textTransform: "none", fontWeight: 750, color: C.muted },
              "& .Mui-selected": { bgcolor: `${C.ink} !important`, color: "#fff !important" },
            }}
          >
            <ToggleButton value="week">This week</ToggleButton>
            <ToggleButton value="month">This month</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 1.5, mb: 1.5 }}>
          <StatCard title="Total bookings" value={data.total} subtitle="vs previous period" change={data.bookingChange} accent={C.blue} icon={<EventNoteRoundedIcon />} />
          <StatCard title="Completed bookings" value={data.completed} subtitle={`${rate}% completion rate`} accent={C.green} icon={<ContentCutRoundedIcon />} />
          <StatCard title="Cancellation rate" value={`${data.cancelRate}%`} subtitle={`${data.cancelled} cancelled booking${data.cancelled === 1 ? "" : "s"}`} accent={C.red} icon={<EventBusyRoundedIcon />} />
          <StatCard title="Income in period" value={money(data.revenue)} subtitle="completed bookings only" change={data.revenueChange} accent={C.gold} icon={<PaymentsRoundedIcon />} />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.55fr 1fr" }, gap: 1.5, mb: 1.5 }}>
          <Panel title="Booking activity" subtitle={`Daily booking volume · ${period === "week" ? "last 7 days" : "last 30 days"}`}>
            <Box sx={{ width: "100%", height: 290 }}>
              <ResponsiveContainer>
                <AreaChart data={data.trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bookingFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.blue} stopOpacity={0.24} />
                      <stop offset="95%" stopColor={C.blue} stopOpacity={0.015} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={C.border} strokeDasharray="4 5" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} interval={period === "week" ? 0 : 4} />
                  <YAxis allowDecimals={false} tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="bookings" name="Bookings" stroke={C.blue} strokeWidth={3} fill="url(#bookingFill)" activeDot={{ r: 5, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="completed" name="Completed" stroke={C.gold} strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Panel>

          <Panel title="Booking status" subtitle="Cancellation rate and booking outcomes">
            <Box sx={{ position: "relative", height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={data.statusData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3} stroke="none">
                    {data.statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <Typography sx={{ color: C.ink, fontWeight: 850, fontSize: 27 }}>{data.cancelRate}%</Typography>
                <Typography sx={{ color: C.muted, fontSize: 11 }}>cancelled</Typography>
              </Box>
            </Box>
            <Stack gap={1} mt={0.5}>
              {data.statusData.map((item) => (
                <Stack key={item.name} direction="row" alignItems="center" gap={1}>
                  <Box sx={{ width: 9, height: 9, borderRadius: "3px", bgcolor: item.color }} />
                  <Typography sx={{ color: C.muted, fontSize: 12, flex: 1 }}>{item.name}</Typography>
                  <Typography sx={{ color: C.ink, fontSize: 12, fontWeight: 800 }}>{item.value}</Typography>
                  <Typography sx={{ color: C.muted, fontSize: 11, width: 34, textAlign: "right" }}>{data.total ? Math.round(item.value / data.total * 100) : 0}%</Typography>
                </Stack>
              ))}
            </Stack>
          </Panel>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 1.5, mb: 1.5 }}>
          <Panel title="Most popular services" subtitle="Ranked by number of bookings">
            {data.services.length ? (
              <Box sx={{ width: "100%", height: Math.max(220, data.services.length * 43) }}>
                <ResponsiveContainer>
                  <BarChart data={data.services} layout="vertical" margin={{ top: 2, right: 18, left: 8, bottom: 2 }}>
                    <CartesianGrid stroke={C.border} strokeDasharray="4 5" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={115} tick={{ fill: C.ink, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="bookings" name="Bookings" fill={C.blue} radius={[0, 7, 7, 0]} maxBarSize={25} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : <Typography sx={{ py: 6, textAlign: "center", color: C.muted, fontSize: 13 }}>No service bookings in this period yet.</Typography>}
          </Panel>

          <Panel title="Popular booking days" subtitle="Compare customer demand across the week">
            <Box sx={{ width: "100%", height: 270 }}>
              <ResponsiveContainer>
                <BarChart data={data.weekdayData} margin={{ top: 10, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke={C.border} strokeDasharray="4 5" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="bookings" name="Bookings" fill={C.mist} radius={[7, 7, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Stack direction="row" alignItems="center" gap={1} sx={{ bgcolor: C.bg, borderRadius: "10px", p: 1.2 }}>
              <CalendarMonthRoundedIcon sx={{ color: C.blue, fontSize: 18 }} />
              <Typography sx={{ color: C.muted, fontSize: 12 }}>
                Busiest day: <Box component="span" sx={{ color: C.ink, fontWeight: 800 }}>{data.peakDay?.bookings ? data.peakDay.name : "Not enough data yet"}</Box>
              </Typography>
            </Stack>
          </Panel>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.4fr 1fr" }, gap: 1.5 }}>
          <Panel title="Monthly income" subtitle="Revenue from completed bookings · last 6 months">
            <Box sx={{ width: "100%", height: 285 }}>
              <ResponsiveContainer>
                <LineChart data={data.monthlyRevenue} margin={{ top: 8, right: 12, left: 2, bottom: 0 }}>
                  <CartesianGrid stroke={C.border} strokeDasharray="4 5" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(value) => value >= 1000 ? `${Math.round(value / 1000)}k` : value} tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
                  <Tooltip content={<ChartTooltip currency />} />
                  <Line type="monotone" dataKey="revenue" name="Income" stroke={C.gold} strokeWidth={3} dot={{ r: 4, fill: C.gold, stroke: C.white, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Panel>

          <Panel title="Popular booking times" subtitle="Bookings by hour of day">
            {data.hours.length ? (
              <>
                <Box sx={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={data.hours} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke={C.border} strokeDasharray="4 5" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="bookings" name="Bookings" fill={C.blue} radius={[6, 6, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ mt: 1.5, p: 1.5, borderRadius: "12px", bgcolor: "#F4F0E7", display: "flex", alignItems: "center", gap: 1.2 }}>
                  <AccessTimeRoundedIcon sx={{ color: C.ink }} />
                  <Box>
                    <Typography sx={{ fontSize: 11, color: C.muted }}>Peak booking time</Typography>
                    <Typography sx={{ fontSize: 15, color: C.ink, fontWeight: 850 }}>
                      {data.peakHour?.label || "—"}{data.peakHour?.bookings ? ` · ${data.peakHour.bookings} bookings` : ""}
                    </Typography>
                  </Box>
                </Box>
              </>
            ) : <Typography sx={{ py: 6, textAlign: "center", color: C.muted, fontSize: 13 }}>Booking times will appear here when bookings are available.</Typography>}
          </Panel>
        </Box>

        <Typography sx={{ mt: 2, textAlign: "center", color: C.muted, fontSize: 11 }}>
          Income includes completed bookings only. Charts use the booking data currently loaded in BarberQueue.
        </Typography>
      </Box>
    </Box>
  );
};

export default BarberAnalytics;
