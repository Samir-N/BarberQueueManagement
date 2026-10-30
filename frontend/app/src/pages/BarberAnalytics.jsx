import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import { Box, Typography, GlobalStyles } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import PeopleIcon from "@mui/icons-material/People";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ScheduleIcon from "@mui/icons-material/Schedule";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import BarChartIcon from "@mui/icons-material/BarChart";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import AssessmentIcon from "@mui/icons-material/Assessment";
import TodayIcon from "@mui/icons-material/Today";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ListAltIcon from "@mui/icons-material/ListAlt";

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
  yellowTint: "#FFFBEA",
  yellowSoft: "#FDE68A",
  gold: "#9A7400",
  green: "#10B981",
  red: "#EF4444",
  grey: "#CBD5E1",
};

const CURRENCY = "$"; // change to "Rs." etc.
const RANGES = [7, 14, 30];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS = [
  { key: "completed", label: "Completed", color: C.navy },
  { key: "confirmed", label: "Confirmed", color: C.yellow },
  { key: "pending", label: "Pending", color: C.yellowSoft },
  { key: "cancelled", label: "Cancelled", color: C.grey },
];

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
  if (prev === 0) return cur === 0 ? 0 : null;
  return Math.round(((cur - prev) / prev) * 100);
};
const emptyDay = () => ({ total: 0, active: 0, completed: 0, confirmed: 0, pending: 0, cancelled: 0, revenue: 0 });
const niceMax = (max) => Math.max(4, Math.ceil(max / 4) * 4);
const labelStep = (n) => (n <= 7 ? 1 : n <= 14 ? 2 : 5);

const grid = (xs, md, gap = 1.5) => ({
  display: "grid",
  gap,
  gridTemplateColumns: { xs, md },
  "@media print": { gridTemplateColumns: md },
});

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
/* Card system (mirrors the reference: badge header, chips, tiles)     */
/* ------------------------------------------------------------------ */
const Badge = ({ children, bg = C.navy }) => (
  <Box sx={{ width: 26, height: 26, borderRadius: "6px", bgcolor: bg, color: bg === C.yellow ? C.navy : "#fff", display: "grid", placeItems: "center", flexShrink: 0, "& svg": { fontSize: 15 } }}>
    {children}
  </Box>
);

const NoteChip = ({ children }) => (
  <Box sx={{ border: `1px solid ${C.border}`, borderRadius: "4px", px: 1, py: 0.3, fontSize: "10px", color: C.slate, bgcolor: C.soft, whiteSpace: "nowrap" }}>
    {children}
  </Box>
);

const Card = ({ icon, title, subtitle, note, children, sx }) => (
  <Box className="print-avoid-break" sx={{ border: `1px solid ${C.border}`, borderRadius: "8px", bgcolor: "#fff", p: { xs: 1.5, md: 2 }, minWidth: 0, ...sx }}>
    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
      <Box sx={{ display: "flex", gap: 1.2, alignItems: "center", minWidth: 0 }}>
        {icon && <Badge>{icon}</Badge>}
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: "13.5px", fontWeight: 700, color: C.navy, lineHeight: 1.25 }}>{title}</Typography>
          {subtitle && <Typography sx={{ fontSize: "11px", color: C.slate, lineHeight: 1.3 }}>{subtitle}</Typography>}
        </Box>
      </Box>
      {note && <NoteChip>{note}</NoteChip>}
    </Box>
    {children}
  </Box>
);

const Note = ({ children }) => (
  <Box sx={{ mt: 1.5, p: 1.2, borderRadius: "6px", bgcolor: C.soft, border: `1px solid ${C.border}`, fontSize: "10.5px", color: C.slate, lineHeight: 1.5 }}>
    {children}
  </Box>
);

const Chip = ({ label, color = C.navy, bg = "#fff" }) => (
  <Box sx={{ display: "inline-flex", alignItems: "center", px: 1.2, py: 0.35, borderRadius: "999px", border: `1px solid ${color}`, bgcolor: bg, color, fontSize: "10.5px", fontWeight: 600, whiteSpace: "nowrap" }}>
    {label}
  </Box>
);

const DeltaFoot = ({ value, invert = false, suffix = "vs previous period" }) => {
  if (value === null) return <Typography sx={{ fontSize: "10px", color: C.slate }}>New activity</Typography>;
  const good = invert ? value <= 0 : value >= 0;
  const Icon = value >= 0 ? TrendingUpIcon : TrendingDownIcon;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, color: value === 0 ? C.slate : good ? C.green : C.red }}>
      <Icon sx={{ fontSize: 13 }} />
      <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "inherit" }}>
        {value > 0 ? "+" : ""}
        {value}%
      </Typography>
      <Typography sx={{ fontSize: "10px", color: "inherit", opacity: 0.8 }}>{suffix}</Typography>
    </Box>
  );
};

const Tile = ({ title, caption, value, text, format = (v) => Math.round(v), footnote, icon, variant = "default" }) => {
  const animated = useCountUp(typeof value === "number" ? value : 0);
  const filled = variant === "filled";
  const highlight = variant === "highlight";
  return (
    <Box
      className="print-avoid-break"
      sx={{
        position: "relative",
        p: 1.5,
        borderRadius: "8px",
        border: `1px solid ${highlight ? C.yellow : filled ? C.navy : C.border}`,
        bgcolor: filled ? C.navy : highlight ? C.yellowTint : "#fff",
        color: filled ? "#fff" : C.navy,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 0.4,
        transition: "transform .2s ease, box-shadow .2s ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 14px -6px rgba(15,23,42,0.18)" },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: "11.5px", fontWeight: 700, lineHeight: 1.25, color: highlight ? C.gold : "inherit" }}>{title}</Typography>
          {caption && <Typography sx={{ fontSize: "10px", opacity: filled ? 0.7 : 1, color: filled ? "#fff" : C.slate, lineHeight: 1.3 }}>{caption}</Typography>}
        </Box>
        {icon && <Box sx={{ color: highlight ? C.gold : filled ? C.yellow : C.slate, display: "flex", "& svg": { fontSize: 18 } }}>{icon}</Box>}
      </Box>
      <Typography sx={{ fontSize: { xs: "18px", md: "20px" }, fontWeight: 800, letterSpacing: "-0.3px", lineHeight: 1.2, mt: 0.6 }}>
        {text !== undefined ? text : format(animated)}
      </Typography>
      {footnote && (
        <Box sx={{ fontSize: "10px", color: filled ? "rgba(255,255,255,0.7)" : C.slate, lineHeight: 1.35 }}>{footnote}</Box>
      )}
    </Box>
  );
};

/* ------------------------------------------------------------------ */
/* Charts (pure CSS / SVG)                                             */
/* ------------------------------------------------------------------ */
const GridLines = ({ n = 4 }) =>
  Array.from({ length: n + 1 }, (_, i) => (
    <Box key={i} sx={{ position: "absolute", left: 0, right: 0, bottom: `${(i / n) * 100}%`, borderTop: i === 0 ? `1px solid ${C.grey}` : `1px dashed ${C.border}` }} />
  ));

const YLabels = ({ max, height }) => (
  <Box sx={{ position: "relative", width: 28, height, flexShrink: 0 }}>
    {[0, 1, 2, 3, 4].map((i) => (
      <Typography key={i} sx={{ position: "absolute", right: 6, bottom: `${(i / 4) * 100}%`, transform: "translateY(50%)", fontSize: "10px", color: C.slate }}>
        {Math.round((max / 4) * i)}
      </Typography>
    ))}
  </Box>
);

/* Stacked daily bars */
const DailyBars = ({ days }) => {
  const H = 190;
  const max = niceMax(Math.max(...days.map((d) => d.stats.total), 0));
  const step = labelStep(days.length);
  const showCounts = days.length <= 14;
  return (
    <Box sx={{ display: "flex" }}>
      <YLabels max={max} height={H} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ position: "relative", height: H }}>
          <GridLines />
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", gap: { xs: "3px", sm: "5px" }, px: 0.5 }}>
            {days.map((d, i) => (
              <Box key={d.key} title={`${d.date.format("ddd, DD MMM")}: ${d.stats.total} booking(s)`} sx={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", minWidth: 0 }}>
                {showCounts && d.stats.total > 0 && (
                  <Typography sx={{ fontSize: "10px", fontWeight: 700, color: C.navy, mb: 0.3, animation: `bx-fade .4s ease ${0.5 + i * 0.04}s both` }}>{d.stats.total}</Typography>
                )}
                <Box sx={{ width: "100%", maxWidth: 40, height: `${(d.stats.total / max) * 100}%`, display: "flex", flexDirection: "column-reverse", borderRadius: "4px 4px 1px 1px", overflow: "hidden", transformOrigin: "bottom", animation: `bx-grow .7s cubic-bezier(.2,.8,.2,1) ${i * 0.04}s both` }}>
                  {STATUS.map((s) => (d.stats[s.key] > 0 ? <Box key={s.key} sx={{ flexGrow: d.stats[s.key], bgcolor: s.color }} /> : null))}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: { xs: "3px", sm: "5px" }, px: 0.5, mt: 0.8 }}>
          {days.map((d, i) => (
            <Box key={d.key} sx={{ flex: 1, minWidth: 0, textAlign: "center" }}>
              {i % step === 0 || i === days.length - 1 ? (
                <>
                  <Typography sx={{ fontSize: "10px", color: C.navy, fontWeight: 600, lineHeight: 1.2 }}>{d.date.format("DD")}</Typography>
                  <Typography sx={{ fontSize: "9px", color: C.slate, lineHeight: 1.2 }}>{d.date.format(days.length <= 7 ? "ddd" : "MMM")}</Typography>
                </>
              ) : null}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

/* Line chart: this period vs previous */
const TrendLine = ({ days, prevDays }) => {
  const H = 190;
  const cur = days.map((d) => d.stats.active);
  const prev = prevDays.map((d) => d.stats.active);
  const max = niceMax(Math.max(...cur, ...prev, 0));
  const n = days.length;
  const step = labelStep(n);
  const xPct = (i) => 2 + (n === 1 ? 0 : (i / (n - 1)) * 96);
  const yPct = (v) => 100 - (v / max) * 100;
  const toPath = (arr) => arr.map((v, i) => `${i === 0 ? "M" : "L"}${xPct(i)},${yPct(v)}`).join(" ");
  const area = `${toPath(cur)} L${xPct(n - 1)},100 L${xPct(0)},100 Z`;
  const svgStyle = { position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" };

  return (
    <Box sx={{ display: "flex" }}>
      <YLabels max={max} height={H} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ position: "relative", height: H }}>
          <GridLines />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={svgStyle}>
            <path d={toPath(prev)} fill="none" stroke={C.yellow} strokeWidth="2" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
          </svg>
          <Box sx={{ position: "absolute", inset: 0, animation: "bx-reveal 1.2s ease-out .1s both" }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={svgStyle}>
              <defs>
                <linearGradient id="bxArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.navy} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={C.navy} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={area} fill="url(#bxArea)" />
              <path d={toPath(cur)} fill="none" stroke={C.navy} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
            {cur.map((v, i) => (
              <Box key={i} title={`${days[i].date.format("ddd, DD MMM")}: ${v} (previous: ${prev[i]})`} sx={{ position: "absolute", left: `${xPct(i)}%`, top: `${yPct(v)}%`, width: n > 14 ? 6 : 9, height: n > 14 ? 6 : 9, transform: "translate(-50%,-50%)", borderRadius: "50%", bgcolor: "#fff", border: `2px solid ${C.navy}`, boxSizing: "border-box" }} />
            ))}
          </Box>
        </Box>
        <Box sx={{ position: "relative", height: 28, mt: 0.8 }}>
          {days.map((d, i) =>
            i % step === 0 || i === n - 1 ? (
              <Box key={d.key} sx={{ position: "absolute", left: `${xPct(i)}%`, transform: "translateX(-50%)", textAlign: "center" }}>
                <Typography sx={{ fontSize: "10px", color: C.navy, fontWeight: 600, lineHeight: 1.2 }}>{d.date.format("DD")}</Typography>
                <Typography sx={{ fontSize: "9px", color: C.slate, lineHeight: 1.2 }}>{d.date.format(n <= 7 ? "ddd" : "MMM")}</Typography>
              </Box>
            ) : null
          )}
        </Box>
      </Box>
    </Box>
  );
};

/* Horizontal bars with axis ticks (like "By channel" cards) */
const HBars = ({ rows, color = C.navy, emptyText }) => {
  if (!rows.length) return <Typography sx={{ fontSize: "12px", color: C.slate, py: 2 }}>{emptyText}</Typography>;
  const max = niceMax(Math.max(...rows.map((r) => r.value), 0));
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "84px 1fr", sm: "110px 1fr" }, columnGap: 1, rowGap: 0.9, alignItems: "center" }}>
      {rows.map((r, i) => (
        <React.Fragment key={r.label}>
          <Typography title={r.label} sx={{ fontSize: "10.5px", color: C.navy, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {r.label}
          </Typography>
          <Box sx={{ position: "relative", height: 16, backgroundImage: `repeating-linear-gradient(to right, ${C.border} 0, ${C.border} 1px, transparent 1px, transparent 25%)` }}>
            <Box title={r.right} sx={{ height: "100%", width: `${(r.value / max) * 100}%`, bgcolor: color, borderRadius: "0 3px 3px 0", transformOrigin: "left", animation: `bx-grow-x .8s cubic-bezier(.2,.8,.2,1) ${i * 0.08}s both`, minWidth: 2 }} />
            <Typography sx={{ position: "absolute", left: `calc(${(r.value / max) * 100}% + 6px)`, top: 0, lineHeight: "16px", fontSize: "10px", fontWeight: 700, color: C.navy, whiteSpace: "nowrap" }}>
              {r.right}
            </Typography>
          </Box>
        </React.Fragment>
      ))}
      <Box />
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Typography key={i} sx={{ fontSize: "9px", color: C.slate }}>{Math.round((max / 4) * i)}</Typography>
        ))}
      </Box>
    </Box>
  );
};

/* Simple vertical bars with y axis */
const VBars = ({ items, highlightIndex = -1, height = 150 }) => {
  const max = niceMax(Math.max(...items.map((i) => i.value), 0));
  return (
    <Box sx={{ display: "flex" }}>
      <YLabels max={max} height={height} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ position: "relative", height }}>
          <GridLines />
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", gap: { xs: "3px", sm: "6px" }, px: 0.5 }}>
            {items.map((it, i) => (
              <Box key={it.label} title={`${it.label}: ${it.value}`} sx={{ flex: 1, minWidth: 0, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
                <Box sx={{ width: "100%", maxWidth: 34, height: `${(it.value / max) * 100}%`, bgcolor: i === highlightIndex ? C.yellow : C.navy, borderRadius: "3px 3px 0 0", transformOrigin: "bottom", animation: `bx-grow .7s cubic-bezier(.2,.8,.2,1) ${i * 0.04}s both` }} />
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: { xs: "3px", sm: "6px" }, px: 0.5, mt: 0.6 }}>
          {items.map((it) => (
            <Typography key={it.label} sx={{ flex: 1, minWidth: 0, textAlign: "center", fontSize: "9.5px", color: C.slate, whiteSpace: "nowrap" }}>{it.label}</Typography>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

/* Donut for status split */
const Donut = ({ segments, total }) => {
  const R = 40;
  const CIRC = 2 * Math.PI * R;
  let offset = 0;
  return (
    <Box sx={{ position: "relative", width: { xs: 140, md: 160 }, height: { xs: 140, md: 160 }, flexShrink: 0 }}>
      <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
        <circle cx="50" cy="50" r={R} fill="none" stroke={C.soft} strokeWidth="16" />
        {total > 0 &&
          segments.map((s, i) => {
            if (!s.value) return null;
            const len = (s.value / total) * CIRC;
            const el = (
              <circle
                key={s.key}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="16"
                transform="rotate(-90 50 50)"
                style={{
                  "--len": len,
                  "--c": CIRC,
                  strokeDasharray: `${len} ${CIRC}`,
                  strokeDashoffset: -offset,
                  animation: `bx-donut .9s cubic-bezier(.2,.8,.2,1) ${i * 0.12}s both`,
                }}
              />
            );
            offset += len;
            return el;
          })}
      </svg>
      <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", pointerEvents: "none" }}>
        <Box>
          <Typography sx={{ fontSize: "20px", fontWeight: 800, color: C.navy, lineHeight: 1.1 }}>{total}</Typography>
          <Typography sx={{ fontSize: "9.5px", color: C.slate }}>by status</Typography>
        </Box>
      </Box>
    </Box>
  );
};

const StatusPill = ({ status }) => {
  const s = normStatus(status);
  const map = {
    completed: { bg: "rgba(15,23,42,0.08)", color: C.navy },
    confirmed: { bg: "rgba(255,195,0,0.22)", color: "#7A5C00" },
    pending: { bg: "rgba(253,230,138,0.5)", color: "#7A5C00" },
    cancelled: { bg: C.soft, color: C.slate },
  }[s] || { bg: C.soft, color: C.slate };
  return (
    <Box sx={{ display: "inline-block", px: 1, py: 0.2, borderRadius: "10px", bgcolor: map.bg, color: map.color, fontSize: "10.5px", fontWeight: 700, textTransform: "capitalize" }}>{s}</Box>
  );
};

/* Booking pipeline (like "How contributions reach the fund") */
const Flow = ({ steps, cancelled, pending }) => (
  <>
    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: "stretch", gap: 0.5 }}>
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        return (
          <React.Fragment key={s.title}>
            <Box sx={{ flex: 1, minWidth: 0, p: 1.3, borderRadius: "8px", border: `1px solid ${last ? C.navy : C.border}`, bgcolor: last ? C.navy : C.soft, color: last ? "#fff" : C.navy, display: "flex", flexDirection: "column", gap: 0.5, minHeight: 170, animation: `bx-fade .5s ease ${i * 0.15}s both` }}>
              <Box sx={{ color: last ? C.yellow : C.gold, display: "flex", "& svg": { fontSize: 18 } }}>{s.icon}</Box>
              <Typography sx={{ fontSize: "11.5px", fontWeight: 800, lineHeight: 1.2 }}>{s.title}</Typography>
              <Typography sx={{ fontSize: "9.5px", lineHeight: 1.35, opacity: last ? 0.75 : 1, color: last ? "#fff" : C.slate }}>{s.desc}</Typography>
              <Box sx={{ mt: "auto" }}>
                <Typography sx={{ fontSize: "22px", fontWeight: 800, lineHeight: 1 }}>{s.value}</Typography>
                <Typography sx={{ fontSize: "9.5px", opacity: last ? 0.75 : 1, color: last ? "#fff" : C.slate }}>{s.foot}</Typography>
              </Box>
            </Box>
            {!last && (
              <Box sx={{ display: "grid", placeItems: "center", color: C.grey, fontWeight: 800, fontSize: "16px", transform: { xs: "rotate(90deg)", sm: "none" } }}>›</Box>
            )}
          </React.Fragment>
        );
      })}
    </Box>
    <Note>
      <b style={{ color: C.navy }}>{cancelled}</b> cancelled or rejected and <b style={{ color: C.navy }}>{pending}</b> still waiting for confirmation in this period. Percentages are shares of all bookings made.
    </Note>
  </>
);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
const BarberAnalytics = () => {
  const allBookings = useSelector((state) => state.booking?.bookings || []);
  const user = useSelector((state) => state.auth?.user);
  const [range, setRange] = useState(7);
  const currentUserId = user?._id || user?.id;

  const bookings = useMemo(() => {
    if (user?.role !== "barber" || !currentUserId) return allBookings;
    return allBookings.filter((b) => String(getBarberId(b)) === String(currentUserId));
  }, [allBookings, user, currentUserId]);

  const report = useMemo(() => {
    const now = dayjs();
    const today = now.startOf("day");
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

    bookings.forEach((b) => {
      if (!b.bookingTime) return;
      const key = dayjs(b.bookingTime).format("YYYY-MM-DD");
      const s = normStatus(b.status);
      const apply = (d) => {
        d.stats.total += 1;
        d.stats[s] = (d.stats[s] || 0) + 1;
        if (s !== "cancelled") d.stats.active += 1;
        if (s === "completed") d.stats.revenue += getPrice(b);
      };
      if (dayMap.has(key)) { apply(dayMap.get(key)); inRange.push(b); }
      else if (prevMap.has(key)) { apply(prevMap.get(key)); prevInRange.push(b); }
    });

    const sum = (arr, k) => arr.reduce((a, d) => a + d.stats[k], 0);
    const cur = { total: sum(days, "total"), active: sum(days, "active"), completed: sum(days, "completed"), cancelled: sum(days, "cancelled"), confirmed: sum(days, "confirmed"), pending: sum(days, "pending"), revenue: sum(days, "revenue") };
    const prev = { total: sum(prevDays, "total"), completed: sum(prevDays, "completed"), cancelled: sum(prevDays, "cancelled"), revenue: sum(prevDays, "revenue") };

    const completionRate = cur.total ? Math.round((cur.completed / cur.total) * 100) : 0;
    const prevCompletionRate = prev.total ? Math.round((prev.completed / prev.total) * 100) : 0;
    const cancelRate = cur.total ? Math.round((cur.cancelled / cur.total) * 100) : 0;
    const prevCancelRate = prev.total ? Math.round((prev.cancelled / prev.total) * 100) : 0;

    const clientsInRange = new Set(inRange.map(getClientKey).filter(Boolean));
    const prevClients = new Set(prevInRange.map(getClientKey).filter(Boolean));
    const clientTotals = {};
    bookings.forEach((b) => { const k = getClientKey(b); if (k) clientTotals[k] = (clientTotals[k] || 0) + 1; });
    const returning = [...clientsInRange].filter((k) => clientTotals[k] > 1).length;

    const upcomingAll = bookings
      .filter((b) => ["pending", "confirmed"].includes(normStatus(b.status)) && b.bookingTime && dayjs(b.bookingTime).isAfter(now))
      .sort((a, b) => new Date(a.bookingTime) - new Date(b.bookingTime));
    const expectedRevenue = upcomingAll.reduce((a, b) => a + getPrice(b), 0);
    const todayCount = bookings.filter((b) => b.bookingTime && normStatus(b.status) !== "cancelled" && dayjs(b.bookingTime).isSame(today, "day")).length;

    const activeInRange = inRange.filter((b) => normStatus(b.status) !== "cancelled");

    const svc = {};
    activeInRange.forEach((b) => {
      const name = getServiceName(b);
      svc[name] = svc[name] || { count: 0, revenue: 0 };
      svc[name].count += 1;
      if (normStatus(b.status) === "completed") svc[name].revenue += getPrice(b);
    });
    const services = Object.entries(svc)
      .map(([label, v]) => ({ label, value: v.count, right: `${v.count}${v.revenue ? ` · ${money(v.revenue)}` : ""}` }))
      .sort((a, b) => b.value - a.value).slice(0, 7);

    const cl = {};
    activeInRange.forEach((b) => { const n = getClientName(b); cl[n] = (cl[n] || 0) + 1; });
    const topClients = Object.entries(cl)
      .map(([label, value]) => ({ label, value, right: `${value} visit${value > 1 ? "s" : ""}` }))
      .sort((a, b) => b.value - a.value).slice(0, 7);

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
      return { label: dayjs().hour(h).format("ha").toLowerCase(), value: hourCounts[h] || 0 };
    });
    const peakHourIdx = hours.reduce((bi, h, i, a) => (h.value > a[bi].value ? i : bi), 0);
    const weekdays = WEEKDAYS.map((label, i) => ({ label, value: weekdayCounts[i] }));
    const bestWeekdayIdx = weekdays.reduce((bi, d, i, a) => (d.value > a[bi].value ? i : bi), 0);
    const busiestDay = days.reduce((best, d) => (d.stats.total > best.stats.total ? d : best), days[0]);

    const recent = [...inRange].sort((a, b) => new Date(b.bookingTime) - new Date(a.bookingTime)).slice(0, 12);

    return {
      now, today, rangeStart, days, prevDays, cur, prev,
      completionRate, prevCompletionRate, cancelRate, prevCancelRate,
      clients: clientsInRange.size, prevClients: prevClients.size, returning,
      upcoming: upcomingAll, expectedRevenue, todayCount,
      services, topClients, hours, peakHourIdx, weekdays, bestWeekdayIdx, busiestDay, recent,
      hasData: activeInRange.length > 0,
      avgPerDay: Math.round((cur.active / range) * 10) / 10,
      avgTicket: cur.completed ? Math.round(cur.revenue / cur.completed) : 0,
    };
  }, [bookings, range]);

  const bookingChange = pctChange(report.cur.total, report.prev.total);
  const revenueChange = pctChange(report.cur.revenue, report.prev.revenue);
  const clientChange = pctChange(report.clients, report.prevClients);
  const completionDiff = report.completionRate - report.prevCompletionRate;
  const cancelDiff = report.cancelRate - report.prevCancelRate;
  const r = report;

  const insights = useMemo(() => {
    const out = [];
    if (r.cur.total === 0) return [`No bookings were recorded in the last ${range} days.`];
    if (bookingChange === null) out.push(`Bookings picked up: ${r.cur.total} in the last ${range} days, none in the period before.`);
    else if (bookingChange === 0) out.push(`Bookings held steady at ${r.cur.total} compared with the previous ${range} days.`);
    else out.push(`Bookings ${bookingChange > 0 ? "rose" : "fell"} ${Math.abs(bookingChange)}% to ${r.cur.total} compared with the previous ${range} days.`);
    if (r.busiestDay.stats.total > 0) out.push(`${r.busiestDay.date.format("dddd, DD MMM")} was the busiest day with ${r.busiestDay.stats.total} booking(s).`);
    if (r.hasData) out.push(`Peak time is around ${r.hours[r.peakHourIdx].label}, and ${WEEKDAYS[r.bestWeekdayIdx]} is the busiest weekday.`);
    out.push(`${r.completionRate}% of bookings were completed and ${r.cancelRate}% were cancelled.`);
    if (r.upcoming.length) out.push(`${r.upcoming.length} upcoming booking(s) are waiting${r.expectedRevenue ? `, worth about ${money(r.expectedRevenue)}` : ""}.`);
    return out;
  }, [r, range, bookingChange]);

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

  const periodLabel = `${r.rangeStart.format("DD MMM")} – ${r.today.format("DD MMM YYYY")}`;
  const donutSegments = STATUS.map((s) => ({ ...s, value: r.cur[s.key] }));
  const dayLabel = (t) => {
    const d = dayjs(t);
    if (d.isSame(r.today, "day")) return "Today";
    if (d.isSame(r.today.add(1, "day"), "day")) return "Tomorrow";
    return d.format("DD MMM");
  };
  const bookedBase = r.cur.total || 1;
  const reachedConfirmed = r.cur.confirmed + r.cur.completed;

  return (
    <Box sx={{ maxWidth: "1100px", width: "100%", mx: "auto", px: { xs: 1.5, md: 3 }, pt: { xs: "84px", md: "92px" }, pb: 6, "@media print": { pt: 0, px: 0, pb: 0 } }}>
      <GlobalStyles
        styles={{
          "@keyframes bx-grow": { from: { transform: "scaleY(0)" }, to: { transform: "scaleY(1)" } },
          "@keyframes bx-grow-x": { from: { transform: "scaleX(0)" }, to: { transform: "scaleX(1)" } },
          "@keyframes bx-fade": { from: { opacity: 0, transform: "translateY(4px)" }, to: { opacity: 1, transform: "none" } },
          "@keyframes bx-reveal": { from: { clipPath: "inset(-10% 100% -10% 0)" }, to: { clipPath: "inset(-10% -5% -10% 0)" } },
          "@keyframes bx-donut": { from: { strokeDasharray: "0 var(--c)" }, to: { strokeDasharray: "var(--len) var(--c)" } },
          "@keyframes bx-pulse": { "0%": { boxShadow: "0 0 0 0 rgba(16,185,129,.5)" }, "100%": { boxShadow: "0 0 0 7px rgba(16,185,129,0)" } },
          "@page": { size: "A4", margin: "12mm" },
          "@media print": {
            "header, nav, .MuiAppBar-root, .no-print": { display: "none !important" },
            body: { background: "#fff !important" },
            "*": { WebkitPrintColorAdjust: "exact", printColorAdjust: "exact", animation: "none !important", transition: "none !important" },
            ".print-avoid-break": { breakInside: "avoid", pageBreakInside: "avoid" },
          },
        }}
      />

      {/* Status strip + controls */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 1.2, mb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", fontSize: "11px", color: C.slate }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, color: C.green, fontWeight: 800, letterSpacing: "0.5px" }} className="no-print">
            <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: C.green, animation: "bx-pulse 1.6s infinite" }} /> LIVE
          </Box>
          <span>Updated {r.now.format("DD MMM YYYY, h:mm A")}</span>
          <span>·</span>
          <span>Period {periodLabel}</span>
        </Box>
        <Box className="no-print" sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Box sx={{ display: "flex", p: 0.4, borderRadius: "8px", border: `1px solid ${C.border}`, bgcolor: "#fff" }}>
            {RANGES.map((x) => (
              <Box key={x} onClick={() => setRange(x)} sx={{ px: 1.5, py: 0.5, borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer", userSelect: "none", color: range === x ? C.navy : C.slate, bgcolor: range === x ? C.yellow : "transparent", transition: "all .2s ease", "&:hover": { bgcolor: range === x ? C.yellow : C.soft } }}>
                {x}D
              </Box>
            ))}
          </Box>
          <Button variant="primary" size="sm" onClick={handleDownload} startIcon={<PictureAsPdfIcon />} className="whitespace-nowrap">
            Download PDF
          </Button>
        </Box>
      </Box>

      {/* Hero */}
      <Box className="print-avoid-break" sx={{ border: `1px solid ${C.border}`, borderRadius: "8px", bgcolor: "#fff", p: { xs: 1.5, md: 2.5 }, mb: 1.5, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.15fr 1fr" }, gap: { xs: 2.5, md: 3 }, alignItems: "center", "@media print": { gridTemplateColumns: "1.15fr 1fr" } }}>
        <Box>
          <Box sx={{ display: "flex", gap: 0.8, alignItems: "center", mb: 1, flexWrap: "wrap" }}>
            <NoteChip>Barber report · {range} days</NoteChip>
            <NoteChip>all statuses</NoteChip>
          </Box>
          <Typography sx={{ fontSize: { xs: "20px", md: "26px" }, fontWeight: 800, color: C.navy, lineHeight: 1.2, letterSpacing: "-0.4px" }}>
            {user?.name ? `${user.name}'s` : "Your"} chair: bookings, earnings and client activity
          </Typography>
          <Typography sx={{ fontSize: "11.5px", color: C.slate, mt: 1, mb: 1.8, lineHeight: 1.5, maxWidth: 460 }}>
            Every appointment booked with you in the last {range} days, how each one ended, and how this period compares with the {range} days before it.
          </Typography>

          <Box sx={{ borderLeft: `4px solid ${C.yellow}`, bgcolor: C.yellowTint, borderRadius: "0 8px 8px 0", p: 1.6 }}>
            <Typography sx={{ fontSize: "10px", color: C.slate }}>Total bookings in period</Typography>
            <HeroNumber value={r.cur.total} />
            <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", mt: 1 }}>
              <Chip label={`Completed ${r.completionRate}%`} color={C.navy} />
              <Chip label={`Cancelled ${r.cancelRate}%`} color={C.slate} />
              <Chip label={`${r.clients} clients`} color={C.gold} bg="#fff" />
              <Chip label={bookingChange === null ? "New activity" : `${bookingChange > 0 ? "+" : ""}${bookingChange}% vs previous`} color={bookingChange !== null && bookingChange < 0 ? C.red : C.green} />
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: { xs: 2, md: 2.5 }, flexWrap: "wrap" }}>
          <Donut key={`donut-${range}-${r.cur.total}`} segments={donutSegments} total={r.cur.total} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.9, minWidth: 130 }}>
            {donutSegments.map((s) => (
              <Box key={s.key} sx={{ display: "flex", alignItems: "center", gap: 0.8, fontSize: "10.5px" }}>
                <Box sx={{ width: 9, height: 9, borderRadius: "2px", bgcolor: s.color, flexShrink: 0 }} />
                <Typography sx={{ fontSize: "10.5px", color: C.navy, flex: 1 }}>{s.label}</Typography>
                <Typography sx={{ fontSize: "10.5px", color: C.slate, fontWeight: 700 }}>{r.cur.total ? Math.round((s.value / r.cur.total) * 100) : 0}%</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Tile row */}
      <Box sx={{ ...grid("1fr 1fr", "repeat(4, 1fr)"), mb: 1.5 }}>
        <Tile title="Completed" caption="Finished appointments" value={r.cur.completed} icon={<TaskAltIcon />} footnote={<DeltaFoot value={pctChange(r.cur.completed, r.prev.completed)} />} />
        <Tile title="Confirmed" caption="Accepted, not done yet" value={r.cur.confirmed} icon={<EventAvailableIcon />} footnote={`${r.cur.total ? Math.round((r.cur.confirmed / r.cur.total) * 100) : 0}% of bookings`} />
        <Tile variant="highlight" title="Waiting for you" caption="Pending confirmation" value={r.cur.pending} icon={<ScheduleIcon />} footnote="Confirm or decline in the queue" />
        <Tile variant="filled" title="Revenue" caption="Completed bookings only" value={r.cur.revenue} format={(v) => money(v)} icon={<AttachMoneyIcon />} footnote={<Box sx={{ "& *": { color: "inherit !important" } }}><DeltaFoot value={revenueChange} /></Box>} />
      </Box>

      {/* Takeaways */}
      <Card icon={<AssessmentIcon />} title="Key takeaways" subtitle="Written automatically from your booking data" note={`Last ${range} days`} sx={{ mb: 1.5 }}>
        <Box component="ul" sx={{ m: 0, pl: 2.2, display: "flex", flexDirection: "column", gap: 0.6 }}>
          {insights.map((t, i) => (
            <Typography component="li" key={i} sx={{ fontSize: "12.5px", color: C.navy, lineHeight: 1.55, "&::marker": { color: C.yellow } }}>{t}</Typography>
          ))}
        </Box>
      </Card>

      {/* Overview card: tiles + daily bars + trend line */}
      <Card icon={<BarChartIcon />} title="Bookings overview" subtitle="Daily volume and trend against the previous period" note={periodLabel} sx={{ mb: 1.5 }}>
        <Box sx={{ ...grid("1fr 1fr", "repeat(4, 1fr)"), mb: 2 }}>
          <Tile variant="filled" title="Average per day" caption="Active bookings" value={r.avgPerDay} format={(v) => (Math.round(v * 10) / 10).toFixed(1)} icon={<EventNoteIcon />} footnote={`over ${range} days`} />
          <Tile variant="highlight" title="Busiest day" caption="Most bookings" text={r.busiestDay.stats.total ? r.busiestDay.date.format("ddd, DD MMM") : "—"} icon={<TodayIcon />} footnote={`${r.busiestDay.stats.total} booking(s)`} />
          <Tile title="Peak hour" caption="Most popular slot" text={r.hasData ? r.hours[r.peakHourIdx].label : "—"} icon={<AccessTimeIcon />} footnote={r.hasData ? `${r.hours[r.peakHourIdx].value} booking(s)` : "No data yet"} />
          <Tile title="Best weekday" caption="Across this period" text={r.hasData ? WEEKDAYS[r.bestWeekdayIdx] : "—"} icon={<EventAvailableIcon />} footnote={r.hasData ? `${r.weekdays[r.bestWeekdayIdx].value} booking(s)` : "No data yet"} />
        </Box>

        <Box sx={grid("1fr", "1fr 1fr", 2.5)}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: "11px", fontWeight: 700, color: C.navy, mb: 1 }}>Daily bookings — count</Typography>
            <DailyBars key={`bars-${range}-${r.cur.total}`} days={r.days} />
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 1.2 }}>
              {STATUS.map((s) => (
                <Box key={s.key} sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: s.color }} />
                  <Typography sx={{ fontSize: "10px", color: C.slate }}>{s.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: "11px", fontWeight: 700, color: C.navy, mb: 1 }}>Daily trend — this period vs previous</Typography>
            <TrendLine key={`line-${range}-${r.cur.total}`} days={r.days} prevDays={r.prevDays} />
            <Box sx={{ display: "flex", gap: 1.5, mt: 1.2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                <Box sx={{ width: 14, height: 0, borderTop: `2.5px solid ${C.navy}` }} />
                <Typography sx={{ fontSize: "10px", color: C.slate }}>This period</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                <Box sx={{ width: 14, height: 0, borderTop: `2px dashed ${C.yellow}` }} />
                <Typography sx={{ fontSize: "10px", color: C.slate }}>Previous period</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        <Note>Each bar is one calendar day, split by how the booking stands today. The line counts active bookings only (cancelled excluded) so it shows real demand.</Note>
      </Card>

      {/* Services + clients */}
      <Box sx={{ ...grid("1fr", "1fr 1fr"), mb: 1.5 }}>
        <Card icon={<ContentCutIcon />} title="By service" subtitle="Bookings · revenue from completed" note={`${range}D`}>
          <HBars key={`svc-${range}`} rows={r.services} color={C.navy} emptyText="No services booked in this period." />
        </Card>
        <Card icon={<PeopleIcon />} title="By client" subtitle="Most frequent in this period" note={`${r.returning} returning`}>
          <HBars key={`cl-${range}`} rows={r.topClients} color={C.yellow} emptyText="No clients in this period." />
        </Card>
      </Box>

      {/* Peak hours + flow */}
      <Box sx={{ ...grid("1fr", "1.1fr 1fr"), mb: 1.5 }}>
        <Card icon={<AccessTimeIcon />} title="Peak hours" subtitle="When customers book most" note={`${range}D`}>
          <VBars key={`hrs-${range}`} items={r.hours} highlightIndex={r.hasData ? r.peakHourIdx : -1} />
        </Card>
        <Card icon={<EventNoteIcon />} title="How a booking moves" subtitle="From booked slot to finished haircut" note={`${range}D`}>
          <Flow
            cancelled={r.cur.cancelled}
            pending={r.cur.pending}
            steps={[
              { icon: <EventNoteIcon />, title: "Booked", desc: "Customer picks a service and a time slot.", value: r.cur.total, foot: "100% of bookings" },
              { icon: <EventAvailableIcon />, title: "Confirmed", desc: "You accept the appointment.", value: reachedConfirmed, foot: `${Math.round((reachedConfirmed / bookedBase) * 100)}% of bookings` },
              { icon: <TaskAltIcon />, title: "Completed", desc: "Service done and revenue counted.", value: r.cur.completed, foot: `${Math.round((r.cur.completed / bookedBase) * 100)}% of bookings` },
            ]}
          />
        </Card>
      </Box>

      {/* At a glance */}
      <Card icon={<TodayIcon />} title="Schedule and clients at a glance" subtitle="What's coming up and who's coming" note={r.today.format("DD MMM YYYY")} sx={{ mb: 1.5 }}>
        <Box sx={{ ...grid("1fr 1fr", "repeat(6, 1fr)", 1), mb: 2 }}>
          <Tile variant="highlight" title="Today" caption="Active bookings" value={r.todayCount} />
          <Tile title="Upcoming" caption="Pending + confirmed" value={r.upcoming.length} footnote={r.expectedRevenue ? `${money(r.expectedRevenue)} expected` : null} />
          <Tile title="Clients" caption="In this period" value={r.clients} footnote={<DeltaFoot value={clientChange} suffix="vs prev." />} />
          <Tile title="Returning" caption="Booked before" value={r.returning} />
          <Tile title="Avg ticket" caption="Per completed" value={r.avgTicket} format={(v) => money(v)} />
          <Tile title="Cancelled" caption="This period" value={r.cur.cancelled} footnote={<DeltaFoot value={cancelDiff} invert suffix="pts" />} icon={<EventBusyIcon />} />
        </Box>

        <Box sx={grid("1fr", "1fr 1fr", 2.5)}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: "11px", fontWeight: 700, color: C.navy, mb: 1 }}>Bookings by weekday</Typography>
            <VBars key={`wk-${range}`} items={r.weekdays} highlightIndex={r.hasData ? r.bestWeekdayIdx : -1} height={140} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: "11px", fontWeight: 700, color: C.navy, mb: 1 }}>Next up</Typography>
            {r.upcoming.length === 0 ? (
              <Typography sx={{ fontSize: "12px", color: C.slate, py: 2 }}>No upcoming bookings.</Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
                {r.upcoming.slice(0, 5).map((b, i) => (
                  <Box key={b._id || i} sx={{ display: "flex", alignItems: "center", gap: 1.2, p: 1, border: `1px solid ${C.border}`, borderRadius: "6px", animation: `bx-fade .4s ease ${i * 0.08}s both` }}>
                    <Box sx={{ minWidth: 62, textAlign: "center", borderRight: `1px solid ${C.border}`, pr: 1 }}>
                      <Typography sx={{ fontSize: "12px", fontWeight: 800, color: C.navy, lineHeight: 1.2 }}>{dayjs(b.bookingTime).format("h:mm A")}</Typography>
                      <Typography sx={{ fontSize: "9.5px", color: C.slate }}>{dayLabel(b.bookingTime)}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: "12px", fontWeight: 700, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getClientName(b)}</Typography>
                      <Typography sx={{ fontSize: "10px", color: C.slate, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getServiceName(b)}</Typography>
                    </Box>
                    <StatusPill status={b.status} />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Card>

      {/* Log */}
      <Card icon={<ListAltIcon />} title="Booking log" subtitle={`Latest ${r.recent.length} bookings in this period`} note={periodLabel}>
        {r.recent.length === 0 ? (
          <Typography sx={{ fontSize: "12px", color: C.slate }}>No bookings in this period.</Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
              <Box component="thead">
                <Box component="tr" sx={{ bgcolor: C.soft }}>
                  {["Date", "Time", "Customer", "Service", "Price", "Status"].map((h) => (
                    <Box component="th" key={h} sx={{ textAlign: "left", p: 1, fontSize: "11px", fontWeight: 700, color: C.slate }}>{h}</Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {r.recent.map((b, i) => (
                  <Box component="tr" key={b._id || i} sx={{ borderTop: `1px solid ${C.border}` }}>
                    <Box component="td" sx={{ p: 1, fontSize: "12px", color: C.navy }}>{dayjs(b.bookingTime).format("DD MMM YYYY")}</Box>
                    <Box component="td" sx={{ p: 1, fontSize: "12px", color: C.navy }}>{dayjs(b.bookingTime).format("h:mm A")}</Box>
                    <Box component="td" sx={{ p: 1, fontSize: "12px", color: C.navy, fontWeight: 700 }}>{getClientName(b)}</Box>
                    <Box component="td" sx={{ p: 1, fontSize: "12px", color: C.navy }}>{getServiceName(b)}</Box>
                    <Box component="td" sx={{ p: 1, fontSize: "12px", color: C.navy }}>{getPrice(b) ? money(getPrice(b)) : "—"}</Box>
                    <Box component="td" sx={{ p: 1 }}><StatusPill status={b.status} /></Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
        <Note>Revenue counts completed bookings only. Cancelled and rejected bookings are shown but never counted as earnings.</Note>
      </Card>
    </Box>
  );
};

const HeroNumber = ({ value }) => {
  const v = useCountUp(value, 1000);
  return (
    <Typography sx={{ fontSize: { xs: "34px", md: "42px" }, fontWeight: 800, color: C.gold, letterSpacing: "-1px", lineHeight: 1.1 }}>
      {Math.round(v).toLocaleString()}
    </Typography>
  );
};

export default BarberAnalytics;