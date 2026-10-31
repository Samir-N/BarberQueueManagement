import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Typography,
  Button,
  ButtonBase,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  useMediaQuery,
} from "@mui/material";
import {
  AccountBalanceWalletOutlined,
  GroupsOutlined,
  BlockOutlined,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  KeyboardArrowDown,
  KeyboardArrowUp,
  ContentCutOutlined,
  EmojiEventsOutlined,
  AccessTimeOutlined,
  EventBusyOutlined,
} from "@mui/icons-material";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from "recharts";

/* ==================================================================
   BarberAnalytics: MUI + recharts, fed by real Redux bookings

   SETTINGS: change these to match your app
   ================================================================== */

/* Where the bookings live in Redux (slice name is "booking") */
const selectBookings = (state) => state.booking?.bookings;

/* Which status values count as what (lowercase) */
const COMPLETED_STATUSES = ["completed"];
const CANCELLED_STATUSES = ["cancelled", "canceled"];

/* Services come from Redux too (slice name is "service").
   A booking only stores the service id, so names and prices are looked up here. */
const selectServices = (state) => state.service?.services;

/* ---------- THEME (same colours as the app's Button variants) ---------- */
const C = {
  gold: "#FFC300",
  goldHover: "#E6B000",
  ink: "#0F172A",
  navy: "#1e2838",
  navyHover: "#2a3547",
  green: "#10B981",
  red: "#F43F5E",
  page: "#F8FAFC",
  line: "#E2E8F0",
  muted: "#475569",
  soft: "#F1F5F9",
};

/* Pie slices: gold, navy, green, sky */
const SERVICE_COLORS = ["#FFC300", "#1e2838", "#10B981", "#38BDF8"];

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const NO_BOOKINGS = [];

const formatCurrency = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;
const formatK = (v) => (v ? `${(v / 1000).toFixed(v % 1000 ? 1 : 0)}K` : "");
const shortTime = (t) => t.replace(":00", "");
const hourLabel = (h) => `${h % 12 || 12}:00 ${h < 12 ? "AM" : "PM"}`;

/* Helper to display "--" when value is 0 */
const formatZero = (n) => (Number(n) === 0 ? "--" : Number(n).toLocaleString("en-IN"));

/* ==================================================================
   TURNING RAW BOOKINGS INTO NUMBERS
   ================================================================== */

/* Works for plain ids, {$oid}, and populated objects ({ _id, name, ... }) */
const idOf = (v) => {
  if (!v) return "";
  if (typeof v === "object") return String(v._id?.$oid || v._id || v.$oid || "");
  return String(v);
};

const normalize = (b, lookup) => {
  const when = new Date(b.bookingTime?.$date || b.bookingTime);
  if (Number.isNaN(when.getTime())) return null;

  const svc = b.service && typeof b.service === "object" && !b.service.$oid ? b.service : null;
  const svcId = idOf(b.service);
  const listed = lookup[svcId];
  const user = b.userId && typeof b.userId === "object" && !b.userId.$oid ? b.userId : null;

  return {
    when,
    status: String(b.status || "").toLowerCase(),
    svcId,
    svcName: svc?.serviceName || svc?.name || listed?.name || `Service ${svcId.slice(-4)}`,
    price: Number(svc?.price ?? listed?.price ?? b.price ?? 0) || 0,
    userId: idOf(b.userId),
    userName: user?.name || user?.fullName || user?.username || null,
  };
};

const monthKey = (date) => date.getFullYear() * 12 + date.getMonth();

/* All the numbers for ONE month */
const summarize = (items) => {
  const done = items.filter((b) => COMPLETED_STATUSES.includes(b.status));
  const cancelled = items.filter((b) => CANCELLED_STATUSES.includes(b.status)).length;

  const customers = new Map();
  const services = new Map();
  const hours = new Map();

  done.forEach((b) => {
    const c = customers.get(b.userId) || { id: b.userId, name: b.userName, count: 0 };
    c.count += 1;
    customers.set(b.userId, c);

    const s = services.get(b.svcId) || { name: b.svcName, value: 0 };
    s.value += 1;
    services.set(b.svcId, s);

    const h = b.when.getHours();
    hours.set(h, (hours.get(h) || 0) + 1);
  });

  /* Services: biggest first; if there are more than 4, the rest become "Other" */
  let serviceList = [...services.values()].sort((a, b) => b.value - a.value);
  if (serviceList.length > 4) {
    const other = serviceList.slice(3).reduce((t, s) => t + s.value, 0);
    serviceList = [...serviceList.slice(0, 3), { name: "Other", value: other }];
  }

  const topCustomers = [...customers.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((c) => ({ name: c.name || `Customer ${c.id.slice(-4)}`, bookings: c.count }));

  /* Time slots: 8 AM to 5 PM, widened if bookings happen outside it */
  const hourKeys = [...hours.keys()];
  const fromH = Math.min(8, ...hourKeys);
  const toH = Math.max(17, ...hourKeys);
  const times = [];
  for (let h = fromH; h <= toH; h += 1) {
    times.push({ time: hourLabel(h), bookings: hours.get(h) || 0 });
  }

  return {
    income: done.reduce((t, b) => t + b.price, 0),
    completed: done.length,
    customers: customers.size,
    cancellations: cancelled,
    services: serviceList,
    topCustomers,
    times,
  };
};

/* ---------- BUTTON (same variants as the app's shared Button) ---------- */
const lift = { transform: "translateY(-1px)" };
const press = { transform: "translateY(0) scale(0.97)" };

const variantStyles = {
  primary: {
    backgroundColor: C.gold,
    color: C.ink,
    border: `1px solid ${C.gold}`,
    "&:hover": { backgroundColor: C.goldHover, borderColor: C.goldHover, ...lift },
    "&:active": press,
  },
  secondary: {
    backgroundColor: C.navy,
    color: "#FFFFFF",
    border: `1px solid ${C.navy}`,
    "&:hover": { backgroundColor: C.navyHover, borderColor: C.navyHover, ...lift },
    "&:active": press,
  },
  tertiary: {
    backgroundColor: "rgba(15, 23, 42, 0.04)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    color: C.ink,
    border: "1px solid rgba(15, 23, 42, 0.28)",
    "&:hover": {
      backgroundColor: "rgba(15, 23, 42, 0.09)",
      borderColor: C.ink,
      ...lift,
    },
    "&:active": { ...press, backgroundColor: "rgba(15, 23, 42, 0.14)" },
  },
};

const focusRing = {
  "&:focus-visible": { outline: `2px solid ${C.gold}`, outlineOffset: 2 },
};

const AppButton = ({ variant = "primary", sx, children, ...rest }) => (
  <Button
    disableElevation
    {...rest}
    sx={{
      minHeight: 44,
      px: 2,
      borderRadius: { xs: "10px", md: "6px" },
      fontSize: 14,
      fontWeight: 500,
      textTransform: "none",
      transition: "all 160ms ease",
      ...variantStyles[variant],
      ...focusRing,
      ...sx,
    }}
  >
    {children}
  </Button>
);

/* ---------- SMALL PIECES (Conditional Sharp Desktop vs Soft Mobile Styles) ---------- */
const cardSx = (isDesktop) => ({
  minWidth: 0,
  backgroundColor: "#FFFFFF",
  border: `1px solid ${C.line}`,
  borderRadius: isDesktop ? "8px" : "16px",
  boxShadow: isDesktop ? "none" : "0 1px 2px rgba(15,23,42,0.05)",
  p: { xs: 2.5, md: 3 },
});

const Card = ({ sx, children, isDesktop }) => <Box sx={{ ...cardSx(isDesktop), ...sx }}>{children}</Box>;

const IconBox = ({ children, bg = C.gold, color = C.ink, size = 36, isDesktop }) => (
  <Box
    sx={{
      width: size,
      height: size,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      borderRadius: isDesktop ? "6px" : "10px",
      backgroundColor: bg,
      color,
    }}
  >
    {children}
  </Box>
);

const SectionTitle = ({ icon, children, right, isDesktop }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 1.5,
      mb: 2,
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <IconBox isDesktop={isDesktop}>{icon}</IconBox>
      <Typography component="h2" sx={{ fontSize: isDesktop ? 18 : 20, fontWeight: isDesktop ? 600 : 700, color: C.ink, letterSpacing: isDesktop ? "-0.2px" : "normal" }}>
        {children}
      </Typography>
    </Box>
    {right}
  </Box>
);

const RankBadge = ({ rank, isDesktop }) => (
  <Box
    sx={{
      width: 28,
      height: 28,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      borderRadius: isDesktop ? "4px" : "8px",
      fontSize: 13,
      fontWeight: isDesktop ? 600 : 800,
      color: C.ink,
      backgroundColor: rank === 1 ? C.gold : C.soft,
    }}
  >
    {rank}
  </Box>
);

const ShowMore = ({ open, onClick, more, less, isDesktop }) => (
  <AppButton
    variant="tertiary"
    fullWidth
    onClick={onClick}
    aria-expanded={open}
    endIcon={open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
    sx={{ mt: 2, borderRadius: isDesktop ? "6px" : "10px" }}
  >
    {open ? less : more}
  </AppButton>
);

const EmptyNote = ({ children }) => (
  <Typography sx={{ py: 3, textAlign: "center", fontSize: 15, fontWeight: 400, color: C.muted }}>
    {children}
  </Typography>
);

const cellHead = { color: C.muted, fontSize: 13, fontWeight: 500, borderBottom: `1px solid ${C.line}`, px: 0, py: 1 };
const cellBody = { color: C.ink, borderBottom: `1px solid ${C.soft}`, px: 0, py: 1.5 };

/* ================================================================== */
/* PAGE                                                                */
/* ================================================================== */
const BarberAnalytics = () => {
  const isDesktop = useMediaQuery("(min-width:900px)");

  /* real bookings from Redux */
  const bookings = useSelector(selectBookings) || NO_BOOKINGS;
  const services = useSelector(selectServices) || NO_BOOKINGS;

  /* service id -> { name, price } */
  const serviceLookup = useMemo(() => {
    const map = {};
    services.forEach((sv) => {
      map[idOf(sv)] = { name: sv.serviceName || sv.name, price: sv.price };
    });
    return map;
  }, [services]);

  /* start on the current month */
  const [view, setView] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [activeService, setActiveService] = useState(null);
  const [showAllCustomers, setShowAllCustomers] = useState(false);
  const [showAllTimes, setShowAllTimes] = useState(false);

  const selectedKey = view.year * 12 + view.month;
  const monthName = months[view.month];

  /* group every booking by month once */
  const byMonth = useMemo(() => {
    const map = new Map();
    bookings.forEach((raw) => {
      const b = normalize(raw, serviceLookup);
      if (!b) return;
      const key = monthKey(b.when);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(b);
    });
    return map;
  }, [bookings, serviceLookup]);

  const data = useMemo(() => summarize(byMonth.get(selectedKey) || []), [byMonth, selectedKey]);
  const prevIncome = useMemo(() => summarize(byMonth.get(selectedKey - 1) || []).income, [byMonth, selectedKey]);

  const hasData = data.completed > 0 || data.cancellations > 0;

  /* growth vs last month (null when last month had no income) */
  const change = prevIncome > 0 ? Math.round(((data.income - prevIncome) / prevIncome) * 100) : null;
  const up = change !== null && change > 0;
  const down = change !== null && change < 0;

  /* most recent month that has completed bookings (for the empty-state button) */
  const latestKey = useMemo(() => {
    let latest = null;
    byMonth.forEach((items, key) => {
      if (items.some((b) => COMPLETED_STATUSES.includes(b.status)) && (latest === null || key > latest)) {
        latest = key;
      }
    });
    return latest;
  }, [byMonth]);

  const goTo = (key) => setView({ year: Math.floor(key / 12), month: key % 12 });
  const goPrev = () => goTo(selectedKey - 1);
  const goNext = () => goTo(selectedKey + 1);

  /* services */
  const serviceData = data.services;
  const serviceTotal = serviceData.reduce((t, s) => t + s.value, 0);
  const activeItem = activeService === null ? null : serviceData[activeService] || null;

  /* income trend: the 6 months ending at the selected month */
  const trendData = useMemo(
    () =>
      Array.from({ length: 6 }, (_, n) => {
        const key = selectedKey - 5 + n;
        return {
          month: months[((key % 12) + 12) % 12].slice(0, 3),
          value: summarize(byMonth.get(key) || []).income,
          i: key,
        };
      }),
    [byMonth, selectedKey]
  );
  const trendMax = Math.max(...trendData.map((p) => p.value), 1);
  const showTrend = trendData.some((p) => p.value > 0);

  /* customers */
  const popularCustomers = data.topCustomers;
  const customersShown = isDesktop || showAllCustomers ? popularCustomers : popularCustomers.slice(0, 3);

  /* times */
  const popularTimes = data.times;
  const rawMaxTime = Math.max(...popularTimes.map((t) => t.bookings), 0);
  const maxTime = Math.max(rawMaxTime, 1);
  const busiest = popularTimes.find((t) => t.bookings === rawMaxTime);
  const timesRanked = [...popularTimes].sort((a, b) => b.bookings - a.bookings);
  const timesShown = showAllTimes ? timesRanked : timesRanked.slice(0, 3);
  const timesChart = popularTimes.map((t) => ({ ...t, label: shortTime(t.time) }));

  const pill = down
    ? { bg: "#FFF1F2", fg: "#BE123C", ring: "#FECDD3" }
    : up
    ? { bg: "#ECFDF5", fg: "#047857", ring: "#A7F3D0" }
    : { bg: C.soft, fg: "#334155", ring: C.line };

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        boxSizing: "border-box",
        backgroundColor: C.page,
        color: C.ink,
        p: { xs: 1.5, sm: 2.5, md: 4 },
      }}
    >
      <Box sx={{ width: "100%", maxWidth: { xs: 640, md: 1280 }, mx: "auto" }}>
        {/* ---------- HEADER ---------- */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            gap: { xs: 1.5, md: 3 },
            mb: { xs: 2, md: 3 },
          }}
        >
          <Typography
            component="h1"
            sx={{
              px: 0.5,
              fontSize: { xs: 30, md: 32 },
              fontWeight: isDesktop ? 700 : 800,
              letterSpacing: isDesktop ? "-0.5px" : "normal",
            }}
          >
            Analytics
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              width: { xs: "100%", md: 360 },
              p: 1,
              backgroundColor: "#FFFFFF",
              border: `1px solid ${C.line}`,
              borderRadius: isDesktop ? "8px" : "16px",
              boxShadow: isDesktop ? "none" : "0 1px 2px rgba(15,23,42,0.05)",
            }}
          >
            <AppButton variant="secondary" onClick={goPrev} aria-label="Previous month" sx={{ minWidth: 48, px: 0 }}>
              <ChevronLeft />
            </AppButton>
            <Box sx={{ flex: 1, textAlign: "center", lineHeight: 1.15 }}>
              <Typography sx={{ fontSize: isDesktop ? 18 : 22, fontWeight: isDesktop ? 700 : 800 }}>{monthName}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: C.muted }}>{view.year}</Typography>
            </Box>
            <AppButton variant="secondary" onClick={goNext} aria-label="Next month" sx={{ minWidth: 48, px: 0 }}>
              <ChevronRight />
            </AppButton>
          </Box>
        </Box>

        {!hasData ? (
          /* ---------- EMPTY MONTH ---------- */
          <Card isDesktop={isDesktop} sx={{ textAlign: "center", py: 6 }}>
            <EventBusyOutlined sx={{ fontSize: 48, color: C.muted }} />
            <Typography sx={{ mt: 1, fontSize: 18, fontWeight: isDesktop ? 500 : 700 }}>
              No bookings in {monthName} {view.year}
            </Typography>
            {latestKey !== null && latestKey !== selectedKey && (
              <AppButton variant="primary" onClick={() => goTo(latestKey)} sx={{ mt: 3, minWidth: 220 }}>
                Show {months[latestKey % 12]} {Math.floor(latestKey / 12)}
              </AppButton>
            )}
          </Card>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: { xs: 1.5, lg: 2.5 },
              gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(12, minmax(0, 1fr))" },
            }}
          >
            {/* ---------- 1. HERO: INCOME ---------- */}
            <Box
              sx={{
                gridColumn: { md: "span 8" },
                minWidth: 0,
                p: { xs: 3, md: 3.5 },
                borderRadius: isDesktop ? "8px" : "16px",
                border: `1px solid ${C.line}`,
                boxShadow: isDesktop ? "none" : "0 1px 2px rgba(15,23,42,0.05)",
                backgroundColor: "#FFFFFF",
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 3,
              }}
            >
              <Box
                sx={{
                  flex: { md: "0 0 46%" },
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 3,
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <IconBox isDesktop={isDesktop} size={36}>
                      <AccountBalanceWalletOutlined />
                    </IconBox>
                    <Typography sx={{ fontSize: 15, fontWeight: 500, color: C.muted }}>Income</Typography>
                  </Box>

                  <Typography
                    sx={{
                      mt: 2,
                      fontSize: { xs: 40, sm: 46, md: 62, lg: 68 },
                      fontWeight: isDesktop ? 700 : 800,
                      lineHeight: 1.05,
                      letterSpacing: isDesktop ? "-1px" : "-0.5px",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {formatCurrency(data.income)}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    alignSelf: "flex-start",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: isDesktop ? "6px" : "999px",
                    backgroundColor: pill.bg,
                    color: pill.fg,
                    border: `1px solid ${pill.ring}`,
                  }}
                >
                  {change === null ? null : down ? (
                    <TrendingDown sx={{ fontSize: 18 }} />
                  ) : (
                    <TrendingUp sx={{ fontSize: 18 }} />
                  )}
                  {change === null ? (
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>
                      No income last month
                    </Typography>
                  ) : (
                    <>
                      <Typography sx={{ fontSize: 14, fontWeight: isDesktop ? 600 : 800, color: "inherit" }}>
                        {up ? "+" : ""}
                        {change}%
                      </Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 400, color: "#334155" }}>
                        than last month
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>

              {/* Desktop only: income trend (recharts) */}
              {isDesktop && showTrend && (
                <Box sx={{ flex: 1, minWidth: 0, height: 190 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 28, right: 24, left: 24, bottom: 0 }}>
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: C.muted, fontWeight: 500 }}
                      />
                      <YAxis hide domain={[0, trendMax * 1.1]} />
                      <Tooltip
                        formatter={(v) => [formatCurrency(v), "Income"]}
                        contentStyle={{ border: `1px solid ${C.line}`, borderRadius: 6, boxShadow: "none", fontSize: 12 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={C.navy}
                        strokeWidth={2}
                        fill={C.navy}
                        fillOpacity={0.06}
                        dot={(p) => {
                          const last = p.payload.i === selectedKey;
                          return (
                            <circle
                              key={p.index}
                              cx={p.cx}
                              cy={p.cy}
                              r={last ? 6 : 4}
                              fill={last ? C.gold : "#FFFFFF"}
                              stroke={C.navy}
                              strokeWidth={2}
                            />
                          );
                        }}
                        activeDot={{ r: 6, fill: C.gold, stroke: C.navy, strokeWidth: 2 }}
                      >
                        <LabelList
                          dataKey="value"
                          position="top"
                          offset={12}
                          formatter={formatK}
                          style={{ fontSize: 11, fontWeight: 600, fill: C.ink }}
                        />
                      </Area>
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Box>

            {/* ---------- 2. SECONDARY NUMBERS ---------- */}
            <Box
              sx={{
                gridColumn: { md: "span 4" },
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", md: "1fr" },
                gap: { xs: 1.5, lg: 2.5 },
                minWidth: 0,
              }}
            >
              <Card isDesktop={isDesktop} sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 1.5 }}>
                <IconBox isDesktop={isDesktop} bg="rgba(255,195,0,0.25)" size={36}>
                  <GroupsOutlined />
                </IconBox>
                <Box>
                  <Typography sx={{ fontSize: isDesktop ? 32 : 38, fontWeight: isDesktop ? 700 : 800, lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: isDesktop ? "-0.5px" : "normal" }}>
                    {formatZero(data.customers)}
                  </Typography>
                  <Typography sx={{ mt: 0.75, fontSize: 14, fontWeight: 500, color: C.muted }}>Customers</Typography>
                </Box>
              </Card>

              <Card isDesktop={isDesktop} sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 1.5 }}>
                <IconBox isDesktop={isDesktop} bg="#FFF1F2" color={C.red} size={36}>
                  <BlockOutlined />
                </IconBox>
                <Box>
                  <Typography sx={{ fontSize: isDesktop ? 32 : 38, fontWeight: isDesktop ? 700 : 800, lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: isDesktop ? "-0.5px" : "normal" }}>
                    {formatZero(data.cancellations)}
                  </Typography>
                  <Typography sx={{ mt: 0.75, fontSize: 14, fontWeight: 500, color: C.muted }}>Cancelled</Typography>
                </Box>
              </Card>
            </Box>

            {/* ---------- 3. SERVICES: DONUT (recharts) + LEGEND ---------- */}
            <Card isDesktop={isDesktop} sx={{ gridColumn: { md: "span 12", lg: "span 7" } }}>
              <SectionTitle isDesktop={isDesktop} icon={<ContentCutOutlined />}>Services</SectionTitle>

              {serviceTotal === 0 ? (
                <EmptyNote>No completed bookings yet</EmptyNote>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", lg: "row" },
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <Box sx={{ position: "relative", width: { xs: 230, md: 240 }, height: { xs: 230, md: 240 }, flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={serviceData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius="62%"
                          outerRadius="96%"
                          startAngle={90}
                          endAngle={-270}
                          paddingAngle={serviceData.length > 1 ? 3 : 0}
                          stroke="none"
                          onMouseEnter={(_, i) => setActiveService(i)}
                          onMouseLeave={() => setActiveService(null)}
                          onClick={(_, i) => setActiveService(i)}
                        >
                          {serviceData.map((s, i) => (
                            <Cell
                              key={s.name}
                              fill={SERVICE_COLORS[i % SERVICE_COLORS.length]}
                              fillOpacity={activeService === null || activeService === i ? 1 : 0.3}
                              style={{ cursor: "pointer", outline: "none", transition: "fill-opacity 150ms" }}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Number in the middle of the donut */}
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        px: 7,
                        pointerEvents: "none",
                      }}
                    >
                      <Typography sx={{ fontSize: isDesktop ? 26 : 30, fontWeight: isDesktop ? 700 : 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                        {formatZero(activeItem ? activeItem.value : serviceTotal)}
                      </Typography>
                      <Typography sx={{ mt: 0.5, fontSize: 13, fontWeight: 500, lineHeight: 1.2, color: C.muted }}>
                        {activeItem ? activeItem.name : "Total"}
                      </Typography>
                    </Box>
                  </Box>

                  <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, width: "100%", minWidth: 0, flex: 1 }}>
                    {serviceData.map((s, i) => {
                      const selected = activeService === i;
                      return (
                        <Box component="li" key={s.name} sx={{ mb: 0.5 }}>
                          <ButtonBase
                            aria-pressed={selected}
                            onClick={() => setActiveService(selected ? null : i)}
                            onMouseEnter={() => setActiveService(i)}
                            onMouseLeave={() => setActiveService(null)}
                            sx={{
                              width: "100%",
                              minHeight: 46,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-start",
                              gap: 1.5,
                              px: 1.5,
                              py: 1,
                              textAlign: "left",
                              borderRadius: isDesktop ? "6px" : "12px",
                              backgroundColor: selected ? C.soft : "transparent",
                              transition: "background-color 150ms, transform 120ms",
                              "&:hover": { backgroundColor: selected ? C.soft : "#F8FAFC" },
                              "&:active": { transform: "scale(0.99)" },
                              ...focusRing,
                            }}
                          >
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: isDesktop ? "2px" : "50%",
                                flexShrink: 0,
                                backgroundColor: SERVICE_COLORS[i % SERVICE_COLORS.length],
                              }}
                            />
                            <Typography sx={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: isDesktop ? 400 : 500, overflowWrap: "anywhere" }}>
                              {s.name}
                            </Typography>
                            <Typography sx={{ fontSize: 16, fontWeight: isDesktop ? 600 : 800, fontVariantNumeric: "tabular-nums" }}>
                              {formatZero(s.value)}
                            </Typography>
                            <Typography
                              sx={{ width: 42, textAlign: "right", fontSize: 13, fontWeight: 500, color: C.muted, fontVariantNumeric: "tabular-nums" }}
                            >
                              {serviceTotal > 0 ? `${Math.round((s.value / serviceTotal) * 100)}%` : "--"}
                            </Typography>
                          </ButtonBase>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}
            </Card>

            {/* ---------- 4. TOP CUSTOMERS: TABLE ---------- */}
            <Card isDesktop={isDesktop} sx={{ gridColumn: { md: "span 12", lg: "span 5" } }}>
              <SectionTitle isDesktop={isDesktop} icon={<EmojiEventsOutlined />}>Top Customers</SectionTitle>

              {popularCustomers.length === 0 ? (
                <EmptyNote>No completed bookings yet</EmptyNote>
              ) : (
                <>
                  <Table size="small" aria-label="Top customers">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ ...cellHead, width: 48 }}>No.</TableCell>
                        <TableCell sx={cellHead}>Name</TableCell>
                        <TableCell align="right" sx={cellHead}>
                          Bookings
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customersShown.map((c, i) => (
                        <TableRow
                          key={`${c.name}-${i}`}
                          sx={{ "&:last-child td": { borderBottom: 0 }, "&:hover": { backgroundColor: "#F8FAFC" } }}
                        >
                          <TableCell sx={cellBody}>
                            <RankBadge isDesktop={isDesktop} rank={i + 1} />
                          </TableCell>
                          <TableCell sx={{ ...cellBody, fontSize: 14, fontWeight: i === 0 && isDesktop ? 600 : i === 0 ? 700 : 400 }}>{c.name}</TableCell>
                          <TableCell align="right" sx={{ ...cellBody, fontSize: 16, fontWeight: isDesktop ? 600 : 800, fontVariantNumeric: "tabular-nums" }}>
                            {formatZero(c.bookings)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {!isDesktop && popularCustomers.length > 3 && (
                    <ShowMore
                      isDesktop={isDesktop}
                      open={showAllCustomers}
                      onClick={() => setShowAllCustomers((v) => !v)}
                      more={`See all ${popularCustomers.length}`}
                      less="Show less"
                    />
                  )}
                </>
              )}
            </Card>

            {/* ---------- 5. BUSY TIMES ---------- */}
            <Card isDesktop={isDesktop} sx={{ gridColumn: { md: "span 12" } }}>
              <SectionTitle
                isDesktop={isDesktop}
                icon={<AccessTimeOutlined />}
                right={
                  rawMaxTime > 0 && (
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: isDesktop ? "6px" : "999px",
                        backgroundColor: "rgba(255,195,0,0.25)",
                        fontSize: 13,
                        fontWeight: isDesktop ? 600 : 700,
                      }}
                    >
                      Busiest: {busiest.time} ({formatZero(busiest.bookings)})
                    </Box>
                  )
                }
              >
                Busy Times
              </SectionTitle>

              {rawMaxTime === 0 ? (
                <EmptyNote>No completed bookings yet</EmptyNote>
              ) : isDesktop ? (
                /* Desktop: column chart (recharts), number on every column */
                <Box sx={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timesChart} margin={{ top: 28, right: 8, left: 8, bottom: 0 }} barCategoryGap="22%">
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: C.muted, fontWeight: 500 }}
                      />
                      <YAxis hide domain={[0, maxTime]} />
                      <Tooltip
                        cursor={{ fill: "rgba(15,23,42,0.04)" }}
                        formatter={(v) => [formatZero(v), "Bookings"]}
                        contentStyle={{ border: `1px solid ${C.line}`, borderRadius: 6, boxShadow: "none", fontSize: 12 }}
                      />
                      <Bar dataKey="bookings" radius={[6, 6, 0, 0]} maxBarSize={56}>
                        {timesChart.map((t) => (
                          <Cell key={t.time} fill={t.bookings === rawMaxTime ? C.gold : C.navy} />
                        ))}
                        <LabelList
                          dataKey="bookings"
                          position="top"
                          offset={8}
                          formatter={(v) => (Number(v) === 0 ? "--" : v)}
                          style={{ fontSize: 13, fontWeight: 600, fill: C.ink }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                /* Mobile: ranked list, top 3 first */
                <>
                  <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
                    {timesShown.map((t, i) => (
                      <Box
                        component="li"
                        key={t.time}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          py: 1.5,
                          borderBottom: `1px solid ${C.soft}`,
                          "&:last-of-type": { borderBottom: 0 },
                        }}
                      >
                        <RankBadge isDesktop={isDesktop} rank={i + 1} />
                        <Typography sx={{ flex: 1, fontSize: 15, fontWeight: i === 0 ? 700 : 500 }}>{t.time}</Typography>
                        <Typography sx={{ fontSize: 18, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                          {formatZero(t.bookings)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  <ShowMore
                    isDesktop={isDesktop}
                    open={showAllTimes}
                    onClick={() => setShowAllTimes((v) => !v)}
                    more={`See all ${popularTimes.length} times`}
                    less="Show less"
                  />
                </>
              )}
            </Card>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default BarberAnalytics;