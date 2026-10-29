    import { Box, Typography, Button } from "@mui/material";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import DirectionsRoundedIcon from "@mui/icons-material/DirectionsRounded";

// design system tokens
const GOLD = "#B8860B";
const GOLD_DARK = "#9A7209";
const CHARCOAL = "#1C1C1E";
const GRAY = "#8E8E93";
const BORDER = "#D1D1D6";

// TODO: replace these with your real details
const SHOP = {
  name: "The Village Barber Shop",
  address: "Add your full address here",
  phone: "+977 98XXXXXXXX",
  hours: [
    { day: "Sun – Fri", time: "8:00 AM – 8:00 PM" },
    { day: "Saturday", time: "9:00 AM – 6:00 PM" },
  ],
};

const MAP_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d529.953419920414!2d87.694512098527!3d26.677685540287595!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39e58f19c4b787df%3A0xb3c7edca446d4672!2sThe%20village%20barber%20shop!5e0!3m2!1sen!2snp!4v1793281804007!5m2!1sen!2snp";

const DIRECTIONS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=26.677685,87.694512";

const cardSx = {
  backgroundColor: "#FFFFFF",
  border: `1px solid ${BORDER}`,
  borderRadius: "12px",
  boxShadow: "0 1px 3px rgba(28, 28, 30, 0.08)",
  transition: "box-shadow 0.2s ease",
  "&:hover": { boxShadow: "0 4px 12px rgba(28, 28, 30, 0.1)" },
};

const InfoCard = ({ icon, label, children }) => (
  <Box sx={{ ...cardSx, display: "flex", gap: 2, p: 2.5 }}>
    <Box
      sx={{
        flexShrink: 0,
        width: 44,
        height: 44,
        borderRadius: "50%",
        backgroundColor: "rgba(184, 134, 11, 0.12)",
        color: GOLD,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{ fontSize: 14, color: GRAY, lineHeight: 1.43, mb: 0.25 }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  </Box>
);

const Contact = () => {
  return (
    <Box sx={{ backgroundColor: "#FAFAF8", minHeight: "100vh" }}>
      <Box
        sx={{
          maxWidth: 1120,
          mx: "auto",
          px: { xs: 2, sm: 3 },
          py: { xs: 4, md: 7 },
        }}
      >
        {/* heading */}
        <Box sx={{ mb: { xs: 3, md: 5 } }}>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: 32, md: 48 },
              lineHeight: 1.25,
              fontWeight: 700,
              color: CHARCOAL,
            }}
          >
            Visit us
          </Typography>
          <Typography
            sx={{
              mt: 1,
              fontSize: 16,
              lineHeight: 1.5,
              color: GRAY,
              maxWidth: 520,
            }}
          >
            Drop by {SHOP.name}, call us, or get directions below.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 2.5, md: 4 },
            gridTemplateColumns: { xs: "1fr", md: "380px 1fr" },
            alignItems: "start",
          }}
        >
          {/* map: first on mobile, right side on desktop */}
          <Box
            sx={{
              ...cardSx,
              order: { xs: 0, md: 1 },
              overflow: "hidden",
              height: { xs: 320, sm: 400, md: 520 },
              "&:hover": { boxShadow: "0 4px 12px rgba(28, 28, 30, 0.1)" },
            }}
          >
            <iframe
              title={`${SHOP.name} location on Google Maps`}
              src={MAP_SRC}
              width="100%"
              height="100%"
              style={{ border: 0, display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </Box>

          {/* info column */}
          <Box
            sx={{
              order: { xs: 1, md: 0 },
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <InfoCard icon={<LocationOnOutlinedIcon />} label="Address">
              <Typography
                sx={{ fontSize: 16, fontWeight: 600, color: CHARCOAL, lineHeight: 1.5 }}
              >
                {SHOP.name}
              </Typography>
              <Typography sx={{ fontSize: 16, color: GRAY, lineHeight: 1.5 }}>
                {SHOP.address}
              </Typography>
            </InfoCard>

            <InfoCard icon={<PhoneOutlinedIcon />} label="Phone">
              <Typography
                component="a"
                href={`tel:${SHOP.phone.replace(/\s/g, "")}`}
                sx={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: CHARCOAL,
                  textDecoration: "none",
                  "&:hover": { color: GOLD },
                }}
              >
                {SHOP.phone}
              </Typography>
            </InfoCard>

            <InfoCard icon={<AccessTimeOutlinedIcon />} label="Opening hours">
              {SHOP.hours.map((h) => (
                <Box
                  key={h.day}
                  sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}
                >
                  <Typography sx={{ fontSize: 16, color: CHARCOAL, lineHeight: 1.5 }}>
                    {h.day}
                  </Typography>
                  <Typography sx={{ fontSize: 16, color: GRAY, lineHeight: 1.5 }}>
                    {h.time}
                  </Typography>
                </Box>
              ))}
            </InfoCard>

            {/* actions */}
            <Box sx={{ display: "flex", gap: 1.5, flexDirection: { xs: "column", sm: "row" } }}>
              <Button
                component="a"
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="contained"
                startIcon={<DirectionsRoundedIcon />}
                sx={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: "8px",
                  textTransform: "none",
                  fontSize: 16,
                  fontWeight: 600,
                  backgroundColor: GOLD,
                  color: "#FAFAF8",
                  boxShadow: "0 2px 8px rgba(184, 134, 11, 0.3)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: GOLD_DARK,
                    boxShadow: "0 4px 12px rgba(184, 134, 11, 0.4)",
                  },
                }}
              >
                Get directions
              </Button>

              <Button
                component="a"
                href={`tel:${SHOP.phone.replace(/\s/g, "")}`}
                variant="outlined"
                startIcon={<PhoneOutlinedIcon />}
                sx={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: "8px",
                  textTransform: "none",
                  fontSize: 16,
                  fontWeight: 600,
                  color: CHARCOAL,
                  borderColor: BORDER,
                  backgroundColor: "transparent",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "#F5F5F3",
                    borderColor: GOLD,
                  },
                }}
              >
                Call now
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Contact;