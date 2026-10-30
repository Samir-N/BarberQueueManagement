import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import { Box, Typography, Paper, GlobalStyles } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import PeopleIcon from "@mui/icons-material/People";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import ScheduleIcon from "@mui/icons-material/Schedule";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

import Button from "../components/Button";

/* ------------------------------------------------------------------ */
/* Theme + constants                                                   */
/* ------------------------------------------------------------------ */
const C = {
  navy: "#0F172A",
  slate: "#64748B",
  border: "#E2E8F0",
  soft: "#F8FAFC",
  yellow: "#FFC300",
  yellowSoft: "#FDE68A",
  green: "#10B981",
  red: "#EF4444",
  grey: "#CBD5E1",
};

const CURRENCY = "$"; // change to "Rs." etc. if you like
const RANGES = [7, 14, 30];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_COLORS = {
  completed: C.navy,
  confirmed: C.yellow,
  pending: C.yellowSoft,
  cancelled: C.grey,
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const normStatus = (s) => {
  const v = (s || "pending").toLowerCase();
  return v === "rejected" ? "cancelled" : v;
};

const getBarberId = (b) =>
  typeof b?.barberId === "object" ? b.barberId?._id || b.barberId?.id : b?.barberId;

const getClientKey = (b) => String(b?.userId?._id || b?.userId || "");
const getClientName = (b) => b?.userId?.name || "Guest";
const getServiceName = (b) => b?.service?.serviceName || "Service";
const getPrice = (b) =>
  Number(b?.service?.price ?? b?.service?.servicePrice ?? b?.price ?? 0) || 0;

const money = (n) =>
  `${CURRENCY}${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const pctChange = (cur, prev) => {
  if (prev === 0) return cur === 0 ? 0 : null; // null => "New"
  return Math.round(((cur - prev) / prev) * 100);
};

const emptyDay = () => ({ total: 0, active: 0, completed: 0, confirmed: 0, pending: 0, cancelled: 0, revenue: 0 });

const niceMax = (max) => Math.max(4, Math.ceil(max / 4) * 4);

function useCountUp(target, duration = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    let start;
    const step = (t) => {
      if (start === undefined) start = t;
      const p = Math.min((t - start) / duration, 1);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */
const SectionCard = ({ title, subtitle, right, children, sx }) => (
  <Paper
    elevation={0}
    className="print-avoid-break"
    sx={{
      p: { xs: 2, md: 3 },
      borderRadius: 2,
      border: `1px solid ${C.border}`,
      backgroundColor: "#fff",
      ...sx,
    }}
  >
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 2.5, flexWrap: "wrap" }}>
      <Box>
        <Typography sx={{ fontSize: "17px", fontWeight: 600, color: C.navy }}>{title}</Typography>
        {subtitle && (
          <Typography sx={{ fontSize: "13px", color: C.slate, mt: 0.3 }}>{subtitle}</Typography>
        )}
      </Box>
      {right}
    </Box>
    {children}
  </Paper>
);

const Delta = ({ value, invert = false, suffix = "vs previous period" }) => {
  if (value === null) {
    return <Typography sx={{ fontSize: "12px", fontWeight: 500, color: C.slate }}>New activity</Typography>;
  }
  const good = invert ? value <= 0 : value >= 0;
  const Icon = value >= 0 ? TrendingUpIcon : TrendingDownIcon;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: value === 0 ? C.slate : good ? C.green : C.red }}>
      <Icon sx={{ fontSize: 15 }} />
      <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "inherit" }}>
        {value > 0 ? "+" : ""}
        {value}%
      </Typography>
      <Typography sx={{ fontSize: "12px", color: C.slate }}>{suffix}</Typography>
    </Box>
  );
};

const KpiCard = ({ title, value, format, icon, children }) => {
  const animated = useCountUp(value);
  return (
    <Paper
      elevation={0}
      className="print-avoid-break"
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: `1px solid ${C.border}`,
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Typography sx={{ fontSize: "13px", fontWeight: 500, color: C.slate }}>{title}</Typography>
        <Box sx={{ p: 0.9, borderRadius: 1.5, backgroundColor: C.soft, display: "flex" }}>{icon}</Box>
      </Box>
      <Typography sx={{ fontSize: "28px", fontWeight: 700, color: C.navy, mb: 0.5, lineHeight: 1.1 }}>
        {format(animated)}
      </Typography>
      {children}
    </Paper>
  );
};

const Legend = ({ items }) => (
  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
    {items.map((i) => (
      <Box key={i.label} sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: i.color, border: i.dashed ? `1px dashed ${C.slate}` : "none" }} />
        <Typography sx={{ fontSize: "12px", color: C.slate }}>{i.label}</Typography>
      </Box>
    ))}
  </Box>
);

/* ------------------------------------------------------------------ */
/* Charts (pure CSS / SVG, no extra dependencies)                      */
/* ------------------------------------------------------------------ */
const PLOT_H = 200;

const YAxisGrid = ({ max }) => {
  const ticks = [4, 3, 2, 1, 0].map((i) => Math.round((max / 4) * i));
  return (
    <>
      {ticks.map((t, i) => (
        <Box
          key={i}
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: `${(i === 4 ? 0 : (4 - i) / 4) * 100}%`,
            borderTop: i === 4 ? `1px solid ${C.border}` : `1px dashed ${C.border}`,
          }}
        />
      ))}
    </>
  );
};

const YLabels = ({ max }) => (
  <Box sx={{ position: "relative", width: 26, height: PLOT_H, flexShrink: 0 }}>
    {[0, 1, 2, 3, 4].map((i) => (
      <Typography
        key={i}
        sx={{
          position: "absolute",
          right: 6,
          bottom: `${(i / 4) * 100}%`,
          transform: "translateY(50%)",
          fontSize: "11px",
          color: C.slate,
        }}
      >
        {Math.round((max / 4) * i)}
      </Typography>
    ))}
  </Box>
);

const labelStep = (n) => (n <= 7 ? 1 : n <= 14 ? 2 : 5);

const BarChart = ({ days }) => {
  const max = niceMax(Math.max(...days.map((d) => d.stats.total), 0));
  const step = labelStep(days.length);
  const showCounts = days.length <= 14;
  const order = ["completed", "confirmed", "pending", "cancelled"];

  return (
    <Box sx={{ display: "flex" }}>
      <YLabels max={max} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ position: "relative", height: PLOT_H }}>
          <YAxisGrid max={max} />
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", gap: { xs: "3px", sm: "6px" }, px: 0.5 }}>
            {days.map((d, i) => {
              const h = (d.stats.total / max) * 100;
              return (
                <Box
                  key={d.key}
                  title={`${d.date.format("ddd, DD MMM")}: ${d.stats.total} booking(s)`}
                  sx={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", minWidth: 0 }}
                >
                  {showCounts && d.stats.total > 0 && (
                    <Typography sx={{ fontSize: "11px", fontWeight: 600, color: C.navy, mb: 0.4, animation: `bx-fade 0.4s ease ${0.5 + i * 0.04}s both` }}>
                      {d.stats.total}
                    </Typography>
                  )}
                  <Box
                    sx={{
                      width: "100%",
                      maxWidth: 44,
                      height: `${h}%`,
                      display: "flex",
                      flexDirection: "column-reverse",
                      borderRadius: "6px 6px 2px 2px",
                      overflow: "hidden",
                      transformOrigin: "bottom",
                      animation: `bx-grow 0.7s cubic-bezier(.2,.8,.2,1) ${i * 0.04}s both`,
                      "&:hover": { filter: "brightness(0.95)" },
                    }}
                  >
                    {order.map((s) =>
                      d.stats[s] > 0 ? (
                        <Box key={s} sx={{ flexGrow: d.stats[s], bgcolor: STATUS_COLORS[s] }} />
                      ) : null
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: { xs: "3px", sm: "6px" }, px: 0.5, mt: 1 }}>
          {days.map((d, i) => (
            <Box key={d.key} sx={{ flex: 1, minWidth: 0, textAlign: "center" }}>
              {i % step === 0 || i === days.length - 1 ? (
                <>
                  <Typography sx={{ fontSize: "11px", color: C.navy, fontWeight: 500, lineHeight: 1.2 }}>
                    {d.date.format("DD")}
                  </Typography>
                  <Typography sx={{ fontSize: "10px", color: C.slate, lineHeight: 1.2 }}>
                    {d.date.format(days.length <= 7 ? "ddd" : "MMM")}
                  </Typography>
                </>
              ) : null}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

const LineChart = ({ days, prevDays, animKey }) => {
  const cur = days.map((d) => d.stats.active);
  const prev = prevDays.map((d) => d.stats.active);
  const max = niceMax(Math.max(...cur, ...prev, 0));
  const n = days.length;
  const step = labelStep(n);

  const xPct = (i) => 2 + (n === 1 ? 0 : (i / (n - 1)) * 96);
  const yPct = (v) => 100 - (v / max) * 100;
  const toPath = (arr) => arr.map((v, i) => `${i === 0 ? "M" : "L"}${xPct(i)},${yPct(v)}`).join(" ");
  const areaPath = `${toPath(cur)} L${xPct(n - 1)},100 L${xPct(0)},100 Z`;

  return (
    <Box sx={{ display: "flex" }}>
      <YLabels max={max} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ position: "relative", height: PLOT_H }}>
          <YAxisGrid max={max} />

          {/* Previous period (dashed, behind) */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
            <path d={toPath(prev)} fill="none" stroke={C.grey} strokeWidth="2" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
          </svg>

          {/* Current period, revealed left -> right */}
          <Box key={animKey} sx={{ position: "absolute", inset: 0, animation: "bx-reveal 1.2s ease-out 0.1s both" }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
              <defs>
                <linearGradient id="bxArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.yellow} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={C.yellow} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#bxArea)" />
              <path d={toPath(cur)} fill="none" stroke={C.navy} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
            {cur.map((v, i) => (
              <Box
                key={i}
                title={`${days[i].date.format("ddd, DD MMM")}: ${v} (previous: ${prev[i]})`}
                sx={{
                  position: "absolute",
                  left: `${xPct(i)}%`,
                  top: `${yPct(v)}%`,
                  width: n > 14 ? 7 : 11,
                  height: n > 14 ? 7 : 11,
                  transform: "translate(-50%, -50%)",
                  borderRadius: "50%",
                  bgcolor: "#fff",
                  border: `2.5px solid ${C.yellow}`,
                  boxSizing: "border-box",
                }}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ position: "relative", height: 30, mt: 1 }}>
          {days.map((d, i) =>
            i % step === 0 || i === n - 1 ? (
              <Box key={d.key} sx={{ position: "absolute", left: `${xPct(i)}%`, transform: "translateX(-50%)", textAlign: "center" }}>
                <Typography sx={{ fontSize: "11px", color: C.navy, fontWeight: 500, lineHeight: 1.2 }}>{d.date.format("DD")}</Typography>
                <Typography sx={{ fontSize: "10px", color: C.slate, lineHeight: 1.2 }}>{d.date.format(n <= 7 ? "ddd" : "MMM")}</Typography>
              </Box>
            ) : null
          )}
        </Box>
      </Box>
    </Box>
  );
};

const HBarList = ({ rows, emptyText }) => {
  const max = Math.max(...rows.map((r) => r.value), 1);
  if (rows.length === 0) {
    return <Typography sx={{ fontSize: "13px", color: C.slate }}>{emptyText}</Typography>;
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.6 }}>
      {rows.map((r, i) => (
        <Box key={r.label}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.6, gap: 1 }}>
            <Typography sx={{ fontSize: "13px", fontWeight: 500, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {r.label}
            </Typography>
            <Typography sx={{ fontSize: "13px", color: C.slate, whiteSpace: "nowrap" }}>{r.right}</Typography>
          </Box>
          <Box sx={{ height: 8, borderRadius: 4, bgcolor: C.soft, overflow: "hidden" }}>
            <Box
              sx={{
                height: "100%",
                width: `${(r.value / max) * 100}%`,
                bgcolor: i === 0 ? C.yellow : C.navy,
                borderRadius: 4,
                transformOrigin: "left",
                animation: `bx-grow-x 0.8s cubic-bezier(.2,.8,.2,1) ${i * 0.08}s both`,
              }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const VerticalMini = ({ items, highlightIndex }) => {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <Box sx={{ display: "flex", alignItems: "flex-end", gap: { xs: "4px", sm: "8px" }, height: 130 }}>
      {items.map((it, i) => (
        <Box key={it.label} sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", height: "100%" }}>
          <Typography sx={{ fontSize: "10px", color: C.slate, mb: 0.4 }}>{it.value || ""}</Typography>
          <Box
            title={`${it.label}: ${it.value}`}
            sx={{
              width: "100%",
              height: `${Math.max((it.value / max) * 100, it.value ? 4 : 1.5)}%`,
              bgcolor: i === highlightIndex ? C.yellow : C.navy,
              opacity: it.value ? 1 : 0.15,
              borderRadius: "4px 4px 2px 2px",
              transformOrigin: "bottom",
              animation: `bx-grow 0.7s cubic-bezier(.2,.8,.2,1) ${i * 0.04}s both`,
            }}
          />
          <Typography sx={{ fontSize: "10px", color: C.slate, mt: 0.6, whiteSpace: "nowrap" }}>{it.label}</Typography>
        </Box>
      ))}
    </Box>
  );
};

const StatusPill = ({ status }) => {
  const s = normStatus(status);
  const map = {
    completed: { bg: "rgba(15,23,42,0.08)", color: C.navy },
    confirmed: { bg: "rgba(255,195,0,0.2)", color: "#8A6A00" },
    pending: { bg: "rgba(253,230,138,0.45)", color: "#92710A" },
    cancelled: { bg: C.soft, color: C.slate },
  }[s];
  return (
    <Box sx={{ display: "inline-block", px: 1.2, py: 0.3, borderRadius: "12px", bgcolor: map.bg, color: map.color, fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>
      {s}
    </Box>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
const BarberAnalytics = () => {
  const allBookings = useSelector((state) => state.booking?.bookings || []);
  const user = useSelector((state) => state.auth?.user);
  const [range, setRange] = useState(7);

  const currentUserId = user?._id || user?.id;

  // Only this barber's bookings
  const bookings = useMemo(() => {
    if (user?.role !== "barber" || !currentUserId) return allBookings;
    return allBookings.filter((b) => String(getBarberId(b)) === String(currentUserId));
  }, [allBookings, user, currentUserId]);

  const report = useMemo(() => {
    const today = dayjs().startOf("day");
    const rangeStart = today.subtract(range - 1, "day");
    const prevStart = rangeStart.subtract(range, "day");

    const buildDays = (start) =>
      Array.from({ length: range }, (_, i) => {
        const date = start.add(i, "day");
        return { date, key: date.format("YYYY-MM-DD"), stats: emptyDay() };
      });

    const days = buildDays(rangeStart);
    const prevDays = buildDays(prevStart);
    const dayMap = new Map(days.map((d) => [d.key, d]));
    const prevMap = new Map(prevDays.map((d) => [d.key, d]));

    const inRange = [];
    const prevInRange = [];
    const now = dayjs();

    bookings.forEach((b) => {
      if (!b.bookingTime) return;
      const t = dayjs(b.bookingTime);
      const key = t.format("YYYY-MM-DD");
      const s = normStatus(b.status);

      const apply = (d) => {
        d.stats.total += 1;
        d.stats[s] = (d.stats[s] || 0) + 1;
        if (s !== "cancelled") d.stats.active += 1;
        if (s === "completed") d.stats.revenue += getPrice(b);
      };

      if (dayMap.has(key)) {
        apply(dayMap.get(key));
        inRange.push(b);
      } else if (prevMap.has(key)) {
        apply(prevMap.get(key));
        prevInRange.push(b);
      }
    });

    const sum = (arr, k) => arr.reduce((a, d) => a + d.stats[k], 0);
    const cur = {
      total: sum(days, "total"),
      completed: sum(days, "completed"),
      cancelled: sum(days, "cancelled"),
      confirmed: sum(days, "confirmed"),
      pending: sum(days, "pending"),
      revenue: sum(days, "revenue"),
    };
    const prev = {
      total: sum(prevDays, "total"),
      completed: sum(prevDays, "completed"),
      cancelled: sum(prevDays, "cancelled"),
      revenue: sum(prevDays, "revenue"),
    };

    const completionRate = cur.total ? Math.round((cur.completed / cur.total) * 100) : 0;
    const prevCompletionRate = prev.total ? Math.round((prev.completed / prev.total) * 100) : 0;
    const cancelRate = cur.total ? Math.round((cur.cancelled / cur.total) * 100) : 0;
    const prevCancelRate = prev.total ? Math.round((prev.cancelled / prev.total) * 100) : 0;

    // Clients
    const clientsInRange = new Set(inRange.map(getClientKey).filter(Boolean));
    const prevClients = new Set(prevInRange.map(getClientKey).filter(Boolean));
    const clientTotals = {};
    bookings.forEach((b) => {
      const k = getClientKey(b);
      if (k) clientTotals[k] = (clientTotals[k] || 0) + 1;
    });
    const returning = [...clientsInRange].filter((k) => clientTotals[k] > 1).length;

    // Upcoming (not cancelled / completed, in the future)
    const upcoming = bookings.filter((b) => {
      const s = normStatus(b.status);
      return (s === "pending" || s === "confirmed") && b.bookingTime && dayjs(b.bookingTime).isAfter(now);
    });
    const expectedRevenue = upcoming.reduce((a, b) => a + getPrice(b), 0);

    // Services
    const svc = {};
    inRange
      .filter((b) => normStatus(b.status) !== "cancelled")
      .forEach((b) => {
        const name = getServiceName(b);
        svc[name] = svc[name] || { count: 0, revenue: 0 };
        svc[name].count += 1;
        if (normStatus(b.status) === "completed") svc[name].revenue += getPrice(b);
      });
    const services = Object.entries(svc)
      .map(([label, v]) => ({ label, value: v.count, right: `${v.count} · ${money(v.revenue)}` }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // Top clients
    const cl = {};
    inRange
      .filter((b) => normStatus(b.status) !== "cancelled")
      .forEach((b) => {
        const name = getClientName(b);
        cl[name] = (cl[name] || 0) + 1;
      });
    const topClients = Object.entries(cl)
      .map(([label, value]) => ({ label, value, right: `${value} visit${value > 1 ? "s" : ""}` }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Peak hours + weekdays (non-cancelled)
    const activeInRange = inRange.filter((b) => normStatus(b.status) !== "cancelled");
    const hourCounts = {};
    const weekdayCounts = Array(7).fill(0);
    activeInRange.forEach((b) => {
      const t = dayjs(b.bookingTime);
      hourCounts[t.hour()] = (hourCounts[t.hour()] || 0) + 1;
      weekdayCounts[(t.day() + 6) % 7] += 1;
    });
    const hourKeys = Object.keys(hourCounts).map(Number);
    const hMin = Math.min(9, ...(hourKeys.length ? hourKeys : [9]));
    const hMax = Math.max(20, ...(hourKeys.length ? hourKeys : [20]));
    const hours = Array.from({ length: hMax - hMin + 1 }, (_, i) => {
      const h = hMin + i;
      return { label: dayjs().hour(h).format("hA").toLowerCase(), value: hourCounts[h] || 0, hour: h };
    });
    const peakHourIdx = hours.reduce((bi, h, i, arr) => (h.value > arr[bi].value ? i : bi), 0);
    const weekdays = WEEKDAYS.map((label, i) => ({ label, value: weekdayCounts[i] }));
    const busiestWeekdayIdx = weekdays.reduce((bi, d, i, arr) => (d.value > arr[bi].value ? i : bi), 0);

    // Busiest single day
    const busiestDay = days.reduce((best, d) => (d.stats.total > best.stats.total ? d : best), days[0]);

    // Recent bookings table
    const recent = [...inRange].sort((a, b) => new Date(b.bookingTime) - new Date(a.bookingTime)).slice(0, 12);

    return {
      days,
      prevDays,
      cur,
      prev,
      completionRate,
      prevCompletionRate,
      cancelRate,
      prevCancelRate,
      clients: clientsInRange.size,
      prevClients: prevClients.size,
      returning,
      upcoming: upcoming.length,
      expectedRevenue,
      services,
      topClients,
      hours,
      peakHourIdx,
      weekdays,
      busiestWeekdayIdx,
      busiestDay,
      recent,
      hasPeak: activeInRange.length > 0,
      rangeStart,
      today,
    };
  }, [bookings, range]);

  const bookingChange = pctChange(report.cur.total, report.prev.total);
  const revenueChange = pctChange(report.cur.revenue, report.prev.revenue);
  const clientChange = pctChange(report.clients, report.prevClients);
  const completionDiff = report.completionRate - report.prevCompletionRate;
  const cancelDiff = report.cancelRate - report.prevCancelRate;

  // Auto-written summary
  const insights = useMemo(() => {
    const out = [];
    const r = report;
    if (r.cur.total === 0) {
      out.push(`No bookings were recorded in the last ${range} days.`);
      return out;
    }
    if (bookingChange === null) out.push(`Bookings started picking up: ${r.cur.total} in the last ${range} days, none in the period before.`);
    else if (bookingChange === 0) out.push(`Bookings held steady at ${r.cur.total} compared with the previous ${range} days.`);
    else out.push(`Bookings ${bookingChange > 0 ? "rose" : "fell"} ${Math.abs(bookingChange)}% to ${r.cur.total} compared with the previous ${range} days.`);
    if (r.busiestDay.stats.total > 0) out.push(`${r.busiestDay.date.format("dddd, DD MMM")} was the busiest day with ${r.busiestDay.stats.total} booking(s).`);
    if (r.hasPeak) out.push(`Peak time is around ${r.hours[r.peakHourIdx].label}, and ${WEEKDAYS[r.busiestWeekdayIdx]} is the busiest weekday.`);
    out.push(`${r.completionRate}% of bookings were completed and ${r.cancelRate}% were cancelled.`);
    if (r.upcoming > 0) out.push(`${r.upcoming} upcoming booking(s) are waiting${r.expectedRevenue ? `, worth about ${money(r.expectedRevenue)}` : ""}.`);
    return out;
  }, [report, range, bookingChange]);

  const handleDownload = useCallback(() => {
    const prevTitle = document.title;
    document.title = `Barber-Report-${dayjs().format("YYYY-MM-DD")}`;
    const restore = () => {
      document.title = prevTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }, []);

  const periodLabel = `${report.rangeStart.format("DD MMM")} – ${report.today.format("DD MMM YYYY")}`;

  return (
    <Box
      sx={{
        maxWidth: "1280px",
        width: "100%",
        mx: "auto",
        px: { xs: 2, md: 4 },
        pt: { xs: "88px", md: "100px" },
        pb: 6,
        "@media print": { pt: 0, px: 0, pb: 0 },
      }}
    >
      <GlobalStyles
        styles={{
          "@keyframes bx-grow": { from: { transform: "scaleY(0)" }, to: { transform: "scaleY(1)" } },
          "@keyframes bx-grow-x": { from: { transform: "scaleX(0)" }, to: { transform: "scaleX(1)" } },
          "@keyframes bx-fade": { from: { opacity: 0 }, to: { opacity: 1 } },
          "@keyframes bx-reveal": { from: { clipPath: "inset(-10% 100% -10% 0)" }, to: { clipPath: "inset(-10% -5% -10% 0)" } },
          "@page": { size: "A4", margin: "12mm" },
          "@media print": {
            "header, nav, .MuiAppBar-root, .no-print": { display: "none !important" },
            body: { background: "#fff !important" },
            "*": {
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
              animation: "none !important",
              transition: "none !important",
            },
            ".print-avoid-break": { breakInside: "avoid", pageBreakInside: "avoid" },
          },
        }}
      />

      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: { xs: "stretch", sm: "flex-start" }, flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: "24px", md: "30px" }, fontWeight: 700, color: C.navy, mb: 0.5 }}>
            Barber Analytics Report
          </Typography>
          <Typography sx={{ fontSize: "14px", color: C.slate }}>
            {user?.name ? `${user.name} · ` : ""}
            {periodLabel} · Generated {dayjs().format("DD MMM YYYY, h:mm A")}
          </Typography>
        </Box>

        <Box className="no-print" sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", p: 0.4, borderRadius: 2, border: `1px solid ${C.border}`, bgcolor: "#fff" }}>
            {RANGES.map((r) => (
              <Box
                key={r}
                onClick={() => setRange(r)}
                sx={{
                  px: 1.6,
                  py: 0.6,
                  borderRadius: 1.5,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  userSelect: "none",
                  color: range === r ? C.navy : C.slate,
                  bgcolor: range === r ? C.yellow : "transparent",
                  transition: "all .2s ease",
                  "&:hover": { bgcolor: range === r ? C.yellow : C.soft },
                }}
              >
                {r}D
              </Box>
            ))}
          </Box>
          <Button variant="primary" size="sm" onClick={handleDownload} startIcon={<PictureAsPdfIcon />} className="whitespace-nowrap">
            Download PDF
          </Button>
        </Box>
      </Box>

      {/* KPIs */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" },
          gap: { xs: 1.5, md: 2.5 },
          mb: 3,
          "@media print": { gridTemplateColumns: "repeat(3, 1fr)" },
        }}
      >
        <KpiCard title="Total Bookings" value={report.cur.total} format={(v) => Math.round(v)} icon={<EventAvailableIcon sx={{ color: C.navy, fontSize: 24 }} />}>
          <Delta value={bookingChange} />
        </KpiCard>
        <KpiCard title="Revenue (completed)" value={report.cur.revenue} format={(v) => money(v)} icon={<AttachMoneyIcon sx={{ color: C.yellow, fontSize: 24 }} />}>
          <Delta value={revenueChange} />
        </KpiCard>
        <KpiCard title="Completion Rate" value={report.completionRate} format={(v) => `${Math.round(v)}%`} icon={<TaskAltIcon sx={{ color: C.green, fontSize: 24 }} />}>
          <Delta value={completionDiff} suffix="pts vs previous" />
        </KpiCard>
        <KpiCard title="Cancellation Rate" value={report.cancelRate} format={(v) => `${Math.round(v)}%`} icon={<EventBusyIcon sx={{ color: C.red, fontSize: 24 }} />}>
          <Delta value={cancelDiff} invert suffix="pts vs previous" />
        </KpiCard>
        <KpiCard title="Clients" value={report.clients} format={(v) => Math.round(v)} icon={<PeopleIcon sx={{ color: C.navy, fontSize: 24 }} />}>
          <Box>
            <Delta value={clientChange} />
            <Typography sx={{ fontSize: "12px", color: C.slate, mt: 0.2 }}>{report.returning} returning</Typography>
          </Box>
        </KpiCard>
        <KpiCard title="Upcoming" value={report.upcoming} format={(v) => Math.round(v)} icon={<ScheduleIcon sx={{ color: C.navy, fontSize: 24 }} />}>
          <Typography sx={{ fontSize: "12px", color: C.slate }}>
            {report.expectedRevenue ? `${money(report.expectedRevenue)} expected` : "Pending + confirmed"}
          </Typography>
        </KpiCard>
      </Box>

      {/* Bar chart */}
      <SectionCard
        title="Bookings by day"
        subtitle={`Daily bookings for the last ${range} days, split by status`}
        right={
          <Legend
            items={[
              { label: "Completed", color: STATUS_COLORS.completed },
              { label: "Confirmed", color: STATUS_COLORS.confirmed },
              { label: "Pending", color: STATUS_COLORS.pending },
              { label: "Cancelled", color: STATUS_COLORS.cancelled },
            ]}
          />
        }
        sx={{ mb: 3 }}
      >
        <BarChart key={`bar-${range}-${report.cur.total}`} days={report.days} />
      </SectionCard>

      {/* Line chart */}
      <SectionCard
        title="Booking trend"
        subtitle="Active bookings per day (cancelled excluded) compared with the previous period"
        right={
          <Legend
            items={[
              { label: "This period", color: C.navy },
              { label: "Previous period", color: C.grey, dashed: true },
            ]}
          />
        }
        sx={{ mb: 3 }}
      >
        <LineChart animKey={`line-${range}-${report.cur.total}`} days={report.days} prevDays={report.prevDays} />
      </SectionCard>

      {/* Insights */}
      <SectionCard title="Performance overview" subtitle="Summary generated from your booking data" sx={{ mb: 3 }}>
        <Box component="ul" sx={{ m: 0, pl: 2.5, display: "flex", flexDirection: "column", gap: 0.8 }}>
          {insights.map((t, i) => (
            <Typography component="li" key={i} sx={{ fontSize: "14px", color: C.navy, lineHeight: 1.6, "&::marker": { color: C.yellow } }}>
              {t}
            </Typography>
          ))}
        </Box>
      </SectionCard>

      {/* Breakdowns */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mb: 3, "@media print": { gridTemplateColumns: "1fr 1fr" } }}>
        <SectionCard title="Peak hours" subtitle="When customers book most">
          <VerticalMini items={report.hours} highlightIndex={report.hasPeak ? report.peakHourIdx : -1} />
        </SectionCard>
        <SectionCard title="Busiest weekdays" subtitle="Bookings by day of week">
          <VerticalMini items={report.weekdays} highlightIndex={report.hasPeak ? report.busiestWeekdayIdx : -1} />
        </SectionCard>
        <SectionCard title="Top services" subtitle="Bookings · revenue from completed">
          <HBarList rows={report.services} emptyText="No services booked in this period." />
        </SectionCard>
        <SectionCard title="Top clients" subtitle="Most frequent in this period">
          <HBarList rows={report.topClients} emptyText="No clients in this period." />
        </SectionCard>
      </Box>

      {/* Recent bookings */}
      <SectionCard title="Booking log" subtitle={`Latest ${report.recent.length} bookings in this period`}>
        {report.recent.length === 0 ? (
          <Typography sx={{ fontSize: "13px", color: C.slate }}>No bookings in this period.</Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
              <Box component="thead">
                <Box component="tr" sx={{ bgcolor: C.soft }}>
                  {["Date", "Time", "Customer", "Service", "Price", "Status"].map((h) => (
                    <Box component="th" key={h} sx={{ textAlign: "left", p: 1.2, fontSize: "12px", fontWeight: 600, color: C.slate }}>
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {report.recent.map((b, i) => (
                  <Box component="tr" key={b._id || i} sx={{ borderTop: `1px solid ${C.border}` }}>
                    <Box component="td" sx={{ p: 1.2, fontSize: "13px", color: C.navy }}>{dayjs(b.bookingTime).format("DD MMM YYYY")}</Box>
                    <Box component="td" sx={{ p: 1.2, fontSize: "13px", color: C.navy }}>{dayjs(b.bookingTime).format("h:mm A")}</Box>
                    <Box component="td" sx={{ p: 1.2, fontSize: "13px", color: C.navy, fontWeight: 600 }}>{getClientName(b)}</Box>
                    <Box component="td" sx={{ p: 1.2, fontSize: "13px", color: C.navy }}>{getServiceName(b)}</Box>
                    <Box component="td" sx={{ p: 1.2, fontSize: "13px", color: C.navy }}>{getPrice(b) ? money(getPrice(b)) : "—"}</Box>
                    <Box component="td" sx={{ p: 1.2 }}><StatusPill status={b.status} /></Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </SectionCard>
    </Box>
  );
};

export default BarberAnalytics;