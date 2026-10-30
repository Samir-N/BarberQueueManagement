
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";

const C = {
  ink: "#213448",
  blue: "#547792",
  mist: "#94B4C1",
  cream: "#EAE0CF",
  gold: "#D6A93A",
  green: "#4F8A76",
  bg: "#F6F8FA",
  border: "#E3E9EE",
  muted: "#718096",
  white: "#FFFFFF",
};

const PIE_COLORS = [
  "#547792",
  "#D6A93A",
  "#94B4C1",
  "#4F8A76",
  "#C96B64",
  "#7B82A8",
];

const money = (value) =>
  `NPR ${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const getStatus = (booking) => {
  const status = String(booking?.status || "pending").toLowerCase();
  return status === "rejected" ? "cancelled" : status;
};

const getBarberId = (booking) =>
  typeof booking?.barberId === "object"
    ? booking.barberId?._id || booking.barberId?.id
    : booking?.barberId;

const getServiceName = (booking) => {
  const service = booking?.service;

  if (typeof service === "string") return service;

  return (
    service?.serviceName ||
    service?.name ||
    booking?.serviceName ||
    "Other service"
  );
};

const getPrice = (booking) =>
  Number(
    booking?.service?.price ??
      booking?.service?.servicePrice ??
      booking?.price ??
      0
  ) || 0;

const getCustomer = (booking) =>
  booking?.userId || booking?.user || booking?.customer || {};

const getCustomerName = (booking) => {
  const customer = getCustomer(booking);

  if (typeof customer === "string") return customer;

  return (
    customer?.name ||
    customer?.fullName ||
    customer?.username ||
    customer?.userName ||
    "Customer"
  );
};

const getCustomerPhone = (booking) => {
  const customer = getCustomer(booking);

  if (typeof customer === "string") return "—";

  return (
    customer?.phone ||
    customer?.phoneNumber ||
    customer?.mobile ||
    customer?.mobileNumber ||
    "—"
  );
};

/* Counts up when the number enters the screen */
const CountUp = ({ value = 0, duration = 1000, prefix = "", suffix = "" }) => {
  const ref = useRef(null);
  const [displayValue, setDisplayValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    const target = Number(value) || 0;
    let frame;
    let startTime;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.round(target * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [started, value, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {displayValue.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
};

/* Cards and panels reveal when scrolled into view */
const Reveal = ({ children, delay = 0, sx = {} }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.08 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      sx={{
        minWidth: 0,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
        transition: `opacity 450ms ease ${delay}ms, transform 450ms ease ${delay}ms`,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

const Panel = ({ title, subtitle, children, sx = {} }) => (
  <Box
    sx={{
      minWidth: 0,
      height: "100%",
      p: { xs: 1.5, sm: 2 },
      bgcolor: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: 0,
      boxShadow: "0 3px 12px rgba(33,52,72,0.035)",
      ...sx,
    }}
  >
    <Box sx={{ mb: 1.5 }}>
      <Typography
        sx={{
          color: C.ink,
          fontSize: { xs: 13, sm: 14 },
          fontWeight: 800,
        }}
      >
        {title}
      </Typography>

      {subtitle && (
        <Typography sx={{ mt: 0.35, color: C.muted, fontSize: 11 }}>
          {subtitle}
        </Typography>
      )}
    </Box>

    {children}
  </Box>
);

const MetricCard = ({
  title,
  value,
  icon,
  accent = C.blue,
  prefix = "",
  suffix = "",
  isMoney = false,
  live = false,
  subtitle,
  delay = 0,
}) => (
  <Reveal delay={delay}>
    <Box
      sx={{
        height: "100%",
        minWidth: 0,
        p: { xs: 1.4, sm: 1.8 },
        bgcolor: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: 0,
        boxShadow: "0 3px 12px rgba(33,52,72,0.035)",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={0.7}
      >
        <Typography
          sx={{
            color: C.muted,
            fontSize: { xs: 10, sm: 11 },
            fontWeight: 700,
          }}
        >
          {title}
        </Typography>

        <Box
          sx={{
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            width: 29,
            height: 29,
            color: accent,
            bgcolor: `${accent}18`,
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 17 } })}
        </Box>
      </Stack>

      <Typography
        sx={{
          mt: 1.2,
          color: C.ink,
          fontWeight: 850,
          fontSize: { xs: 19, sm: 25 },
          letterSpacing: "-0.7px",
          lineHeight: 1.25,
          overflowWrap: "anywhere",
        }}
      >
        {isMoney ? (
          <>
            NPR{" "}
            <CountUp value={value} duration={1200} />
          </>
        ) : (
          <CountUp value={value} prefix={prefix} suffix={suffix} />
        )}
      </Typography>

      {(live || subtitle) && (
        <Stack
          direction="row"
          alignItems="center"
          gap={0.7}
          sx={{ mt: 0.8, flexWrap: "wrap" }}
        >
          {live && (
            <Chip
              label="● LIVE"
              size="small"
              sx={{
                height: 19,
                borderRadius: 0,
                bgcolor: "#E8F3EE",
                color: C.green,
                fontSize: 9,
                fontWeight: 850,
                "& .MuiChip-label": { px: 0.7 },
              }}
            />
          )}

          {subtitle && (
            <Typography sx={{ color: C.muted, fontSize: 10 }}>
              {subtitle}
            </Typography>
          )}
        </Stack>
      )}
    </Box>
  </Reveal>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <Box
      sx={{
        p: 1,
        bgcolor: C.ink,
        color: C.white,
        borderRadius: 0,
        boxShadow: "0 5px 18px #21344830",
      }}
    >
      <Typography sx={{ mb: 0.3, fontSize: 10, opacity: 0.75 }}>
        {label || payload[0]?.name}
      </Typography>

      {payload.map((item) => (
        <Typography
          key={item.dataKey || item.name}
          sx={{ fontSize: 11, fontWeight: 750 }}
        >
          {item.name || item.dataKey}:{" "}
          {Number(item.value || 0).toLocaleString()}
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const currentUserId = user?._id || user?.id;

  const bookings = useMemo(() => {
    if (user?.role !== "barber" || !currentUserId) return allBookings;

    return allBookings.filter(
      (booking) =>
        String(getBarberId(booking)) === String(currentUserId)
    );
  }, [allBookings, user?.role, currentUserId]);

  const data = useMemo(() => {
    const now = dayjs();
    const weekStart = now.startOf("day").subtract(6, "day");
    const monthStart = now.startOf("month");

    const validBookings = bookings.filter(
      (booking) =>
        booking?.bookingTime && dayjs(booking.bookingTime).isValid()
    );

    const weekBookings = validBookings.filter((booking) => {
      const date = dayjs(booking.bookingTime);
      return (
        !date.isBefore(weekStart) &&
        !date.isAfter(now.endOf("day"))
      );
    });

    const monthBookings = validBookings.filter((booking) => {
      const date = dayjs(booking.bookingTime);
      return (
        !date.isBefore(monthStart) &&
        !date.isAfter(now.endOf("day"))
      );
    });

    const monthlyIncome = monthBookings
      .filter((booking) => getStatus(booking) === "completed")
      .reduce((sum, booking) => sum + getPrice(booking), 0);

    /* One line graph: bookings for the last seven days */
    const activity = Array.from({ length: 7 }, (_, index) => {
      const date = now.startOf("day").subtract(6 - index, "day");

      const count = validBookings.filter((booking) =>
        dayjs(booking.bookingTime).isSame(date, "day")
      ).length;

      return {
        label: date.format(isMobile ? "dd" : "ddd, D MMM"),
        bookings: count,
      };
    });

    /* One pie chart: popular services */
    const serviceCounts = {};

    monthBookings.forEach((booking) => {
      const name = getServiceName(booking);
      serviceCounts[name] = (serviceCounts[name] || 0) + 1;
    });

    const services = Object.entries(serviceCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    /* One table: top ten repeat customers */
    const customerMap = {};

    validBookings.forEach((booking) => {
      const customer = getCustomer(booking);
      const id =
        typeof customer === "object"
          ? customer?._id || customer?.id
          : customer;

      const key = String(id || getCustomerName(booking));

      if (!customerMap[key]) {
        customerMap[key] = {
          key,
          name: getCustomerName(booking),
          phone: getCustomerPhone(booking),
          bookings: 0,
          completed: 0,
          lastBooking: booking.bookingTime,
          spent: 0,
        };
      }

      const entry = customerMap[key];
      entry.bookings += 1;

      if (getStatus(booking) === "completed") {
        entry.completed += 1;
        entry.spent += getPrice(booking);
      }

      if (
        dayjs(booking.bookingTime).isAfter(
          dayjs(entry.lastBooking)
        )
      ) {
        entry.lastBooking = booking.bookingTime;
      }

      if (entry.phone === "—") {
        entry.phone = getCustomerPhone(booking);
      }
    });

    const topCustomers = Object.values(customerMap)
      .filter((customer) => customer.bookings > 1)
      .sort((a, b) => {
        if (b.bookings !== a.bookings) {
          return b.bookings - a.bookings;
        }

        return dayjs(b.lastBooking).valueOf() -
          dayjs(a.lastBooking).valueOf();
      })
      .slice(0, 10);

    /* Most popular day and time */
    const dayCounts = {};
    const hourCounts = {};

    validBookings.forEach((booking) => {
      const date = dayjs(booking.bookingTime);
      const day = date.format("dddd");
      const hour = date.format("h A");

      dayCounts[day] = (dayCounts[day] || 0) + 1;
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const popularDay = Object.entries(dayCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const popularTime = Object.entries(hourCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return {
      weekTotal: weekBookings.length,
      monthTotal: monthBookings.length,
      monthlyIncome,
      activity,
      services,
      topCustomers,
      popularDay,
      popularTime,
    };
  }, [bookings, isMobile]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: C.bg,
        px: { xs: 1, sm: 2, md: 2.5 },
        pt: { xs: "76px", sm: "88px", md: "94px" },
        pb: 3,
      }}
    >
      <Box sx={{ maxWidth: 1250, mx: "auto" }}>
        {/* Compact heading */}
        <Reveal>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
            sx={{ mb: 2 }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color: C.ink,
                  fontWeight: 850,
                  fontSize: { xs: 21, sm: 27 },
                  letterSpacing: "-0.8px",
                  lineHeight: 1.2,
                }}
              >
                Analytics
              </Typography>

              <Typography sx={{ color: C.muted, fontSize: 11, mt: 0.4 }}>
                Your barber shop at a glance
              </Typography>
            </Box>

            <Chip
              icon={
                <CalendarMonthRoundedIcon
                  sx={{ fontSize: "15px !important" }}
                />
              }
              label={dayjs().format("D MMM YYYY")}
              size="small"
              sx={{
                flexShrink: 0,
                borderRadius: 0,
                bgcolor: C.white,
                border: `1px solid ${C.border}`,
                color: C.ink,
                fontWeight: 700,
                fontSize: 10,
              }}
            />
          </Stack>
        </Reveal>

        {/* Monthly income appears first */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1.2fr 1fr 1fr" },
            gap: 1,
            mb: 1,
          }}
        >
          <MetricCard
            title="Monthly income"
            value={data.monthlyIncome}
            isMoney
            icon={<PaymentsRoundedIcon />}
            accent={C.gold}
            live
            subtitle="Completed bookings this month"
          />

          <MetricCard
            title="Bookings this week"
            value={data.weekTotal}
            icon={<EventNoteRoundedIcon />}
            accent={C.blue}
            subtitle="Last 7 days"
            delay={70}
          />

          <MetricCard
            title="Bookings this month"
            value={data.monthTotal}
            icon={<CalendarMonthRoundedIcon />}
            accent={C.green}
            subtitle="Current calendar month"
            delay={140}
          />
        </Box>

        {/* Popular day and time: normal cards, no extra charts */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr" },
            gap: 1,
            mb: 1.5,
          }}
        >
          <MetricCard
            title="Popular booking day"
            value={0}
            icon={<CalendarMonthRoundedIcon />}
            accent={C.blue}
            subtitle={
              data.popularDay
                ? `${data.popularDay[1]} bookings`
                : "No booking data yet"
            }
          />

          <Reveal delay={80}>
            <Box
              sx={{
                height: "100%",
                minWidth: 0,
                p: { xs: 1.4, sm: 1.8 },
                bgcolor: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 0,
                boxShadow: "0 3px 12px rgba(33,52,72,0.035)",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                gap={0.5}
              >
                <Typography sx={{ color: C.muted, fontSize: 10, fontWeight: 700 }}>
                  Popular booking time
                </Typography>
                <AccessTimeRoundedIcon
                  sx={{ color: C.gold, fontSize: 18, flexShrink: 0 }}
                />
              </Stack>

              <Typography
                sx={{
                  mt: 1.2,
                  color: C.ink,
                  fontWeight: 850,
                  fontSize: { xs: 18, sm: 24 },
                  letterSpacing: "-0.5px",
                  overflowWrap: "anywhere",
                }}
              >
                {data.popularTime?.[0] || "—"}
              </Typography>

              <Typography sx={{ color: C.muted, fontSize: 10, mt: 0.8 }}>
                {data.popularTime
                  ? `${data.popularTime[1]} bookings`
                  : "No booking data yet"}
              </Typography>
            </Box>
          </Reveal>
        </Box>

        {/* Exactly one line graph */}
        <Reveal>
          <Panel
            title="Booking activity"
            subtitle="Daily bookings · last 7 days"
            sx={{ mb: 1.5 }}
          >
            <Box sx={{ width: "100%", height: { xs: 210, sm: 245 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.activity}
                  margin={{
                    top: 10,
                    right: 8,
                    left: isMobile ? -24 : -15,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    stroke={C.border}
                    strokeDasharray="3 4"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    tick={{ fill: C.muted, fontSize: isMobile ? 9 : 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />

                  <YAxis
                    allowDecimals={false}
                    width={30}
                    tick={{ fill: C.muted, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip content={<ChartTooltip />} />

                  <Line
                    type="monotone"
                    dataKey="bookings"
                    name="Bookings"
                    stroke={C.blue}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: C.blue, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Panel>
        </Reveal>

        {/* Exactly one pie chart, labels directly on slices */}
        <Reveal delay={70}>
          <Panel
            title="Popular services"
            subtitle="Bookings by service · current month"
            sx={{ mb: 1.5 }}
          >
            {data.services.length ? (
              <Box
                sx={{
                  width: "100%",
                  height: { xs: 245, sm: 270 },
                  minWidth: 0,
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.services}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="48%"
                      outerRadius={isMobile ? 83 : 100}
                      paddingAngle={2}
                      stroke={C.white}
                      strokeWidth={2}
                      labelLine={!isMobile}
                      label={({ name, percent }) => {
                        const shortName =
                          name.length > 13
                            ? `${name.slice(0, 11)}…`
                            : name;

                        return `${shortName} ${(percent * 100).toFixed(0)}%`;
                      }}
                      isAnimationActive
                      animationDuration={1000}
                    >
                      {data.services.map((service, index) => (
                        <Cell
                          key={service.name}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Typography
                sx={{
                  py: 5,
                  textAlign: "center",
                  color: C.muted,
                  fontSize: 12,
                }}
              >
                Service statistics will appear when bookings are available.
              </Typography>
            )}
          </Panel>
        </Reveal>

        {/* Exactly one table, maximum ten repeat customers */}
        <Reveal delay={100}>
          <Panel
            title="Top 10 repeat customers"
            subtitle="Ranked by total number of bookings"
            sx={{ p: { xs: 1.2, sm: 2 } }}
          >
            {data.topCustomers.length ? (
              <TableContainer sx={{ overflowX: "auto" }}>
                <Table
                  size="small"
                  sx={{
                    minWidth: 540,
                    "& th": {
                      bgcolor: "#F6F8FA",
                      color: C.muted,
                      fontWeight: 800,
                      fontSize: 10,
                      whiteSpace: "nowrap",
                      borderBottom: `1px solid ${C.border}`,
                      py: 1,
                      px: 1,
                    },
                    "& td": {
                      color: C.ink,
                      fontSize: 11,
                      whiteSpace: "nowrap",
                      borderBottom: `1px solid ${C.border}`,
                      py: 1,
                      px: 1,
                    },
                    "& tr:last-child td": {
                      borderBottom: 0,
                    },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell align="right">Bookings</TableCell>
                      <TableCell align="right">Spent</TableCell>
                      <TableCell>Last booking</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {data.topCustomers.map((customer, index) => (
                      <TableRow
                        key={customer.key}
                        sx={{
                          "&:hover": { bgcolor: "#F8FAFC" },
                        }}
                      >
                        <TableCell>
                          <Box
                            sx={{
                              width: 23,
                              height: 23,
                              display: "grid",
                              placeItems: "center",
                              bgcolor: index < 3 ? "#F3EBD8" : "#F1F4F7",
                              color: C.ink,
                              fontSize: 10,
                              fontWeight: 850,
                            }}
                          >
                            {index + 1}
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight: 750,
                              color: C.ink,
                            }}
                          >
                            {customer.name}
                          </Typography>
                        </TableCell>

                        <TableCell>{customer.phone}</TableCell>

                        <TableCell align="right">
                          <Chip
                            label={customer.bookings}
                            size="small"
                            sx={{
                              height: 21,
                              minWidth: 27,
                              borderRadius: 0,
                              bgcolor: "#EAF0F5",
                              color: C.ink,
                              fontSize: 10,
                              fontWeight: 850,
                              "& .MuiChip-label": { px: 0.8 },
                            }}
                          />
                        </TableCell>

                        <TableCell align="right">
                          {money(customer.spent)}
                        </TableCell>

                        <TableCell>
                          {dayjs(customer.lastBooking).format("D MMM YYYY")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography
                sx={{
                  py: 4,
                  textAlign: "center",
                  color: C.muted,
                  fontSize: 12,
                }}
              >
                Repeat customers will appear after customers book more than once.
              </Typography>
            )}
          </Panel>
        </Reveal>

        <Typography
          sx={{
            mt: 1.5,
            textAlign: "center",
            color: C.muted,
            fontSize: 10,
          }}
        >
          Income counts completed bookings only. Analytics use the booking data
          currently loaded in BarberQueue.
        </Typography>
      </Box>
    </Box>
  );
};

export default BarberAnalytics;
