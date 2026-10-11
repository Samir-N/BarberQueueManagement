import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import {
  Box,
  Card,
  Typography,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Button from "./Button";
import { showLoading, hideLoading } from "../redux/features/alertSlice";
import { setUser } from "../redux/features/authSlice";

const labelSx = { fontWeight: 500, color: "#6B7280", width: "40%" };
const valueSx = { color: "#111827", fontWeight: 600 };

const Profile = ({ onEdit }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(!isMobile);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  // Keep local form state in sync with Redux user state
  useEffect(() => {
    if (user) {
      setFormData({
        name: user?.name || "",
        phone: user?.phone ? String(user.phone) : "",
      });
    }
  }, [user]);

  // Collapse by default on mobile, expand on PC
  useEffect(() => {
    setExpanded(!isMobile);
  }, [isMobile]);

  const handleEditClick = (e) => {
    if (onEdit) {
      onEdit(e);
    } else {
      setOpen(true);
    }
  };

  const handleClose = () => {
    setFormData({
      name: user?.name || "",
      phone: user?.phone ? String(user.phone) : "",
    });
    setOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      // Phone accepts digits only, max 10
      [name]: name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value,
    }));
  };

  const handleSave = async () => {
    const userId = user?._id || user?.id;

    if (!userId) {
      alert("User ID missing. Please re-login.");
      return;
    }

    const cleanName = String(formData.name || "").trim();
    const cleanPhoneStr = String(formData.phone || "").trim();

    if (!cleanName || !cleanPhoneStr) {
      alert("Name and Phone fields cannot be empty.");
      return;
    }

    if (cleanName.length > 40) {
      alert("Name cannot be more than 40 characters.");
      return;
    }

    if (cleanPhoneStr.length !== 10 || isNaN(cleanPhoneStr)) {
      alert("Phone number must be exactly 10 digits and numeric.");
      return;
    }

    const cleanPhone = Number(cleanPhoneStr);

    try {
      dispatch(showLoading());
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `/api/v1/user/profile/edit/${userId}`,
        { name: cleanName, phone: cleanPhone },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const returnedUser = response.data.user || response.data.data;

        const updatedState = {
          ...user,
          ...returnedUser,
          name: cleanName,
          phone: cleanPhone,
        };

        dispatch(setUser({ user: updatedState }));
        alert("Profile updated successfully!");
        setOpen(false);
      } else {
        alert(response.data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert(err.response?.data?.message || "Failed to update profile!");
    } finally {
      dispatch(hideLoading());
    }
  };

  const rows = [
    {
      label: "ID",
      value: (
        <Box
          component="span"
          sx={{
            display: "inline-block",
            px: 1.5,
            py: 0.5,
            backgroundColor: "#EEF2FF",
            color: "#4338CA",
            border: "1px solid #C7D2FE",
            borderRadius: "6px",
            fontFamily:
              "'JetBrains Mono', 'SF Mono', 'Fira Code', Consolas, monospace",
            fontSize: "0.85rem",
            fontWeight: 700,
            letterSpacing: "0.75px",
          }}
        >
          {user?.publicId || "N/A"}
        </Box>
      ),
    },
    { label: "Name", value: user?.name || "N/A" },
    { label: "Role", value: user?.role || "N/A", capitalize: true },
    { label: "Phone", value: user?.phone || "N/A" },
  ];

  return (
    <>
      <Card
        sx={{
          borderRadius: 2,
          border: "1px solid #E5E7EB",
          backgroundColor: "#FFFFFF",
          width: "100%",
          height: "auto", // never stretch to match the sibling card
          alignSelf: "flex-start",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <Accordion
          expanded={expanded}
          onChange={(event, isExpanded) => setExpanded(isExpanded)}
          disableGutters // removes MUI's extra margin when expanded
          elevation={0}
          sx={{
            backgroundColor: "transparent",
            "&:before": { display: "none" },
            "&.Mui-expanded": { margin: 0 },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              px: { xs: 2, sm: 3 },
              py: 0.5,
              minHeight: "auto",
              "& .MuiAccordionSummary-content": { my: 1.5 },
              "&.Mui-expanded": { minHeight: "auto" },
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: 16, sm: 18 },
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Profile Details
            </Typography>
          </AccordionSummary>

          <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pt: 0, pb: { xs: 2, sm: 2.5 } }}>
            <Box sx={{ overflowX: "auto", mb: 2 }}>
              <Table
                size="small"
                sx={{
                  minWidth: 260,
                  "& td, & th": { py: 0.75, px: 1.5 },
                }}
              >
                <TableBody>
                  {rows.map((row, i) => {
                    const border =
                      i === rows.length - 1 ? "none" : "1px solid #E5E7EB";
                    return (
                      <TableRow key={row.label}>
                        <TableCell sx={{ ...labelSx, borderBottom: border }}>
                          {row.label}
                        </TableCell>
                        <TableCell
                          sx={{
                            ...valueSx,
                            borderBottom: border,
                            textTransform: row.capitalize ? "capitalize" : "none",
                          }}
                        >
                          {row.value}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>

            <Stack direction="row" sx={{ width: "100%" }}>
              <Button
                variant="tertiary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick(e);
                }}
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                <EditIcon sx={{ fontSize: 18 }} />
                Edit Profile
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Card>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}
        >
          <TextField
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            size="small"
            inputProps={{ maxLength: 40 }}
            helperText={`${formData.name.length}/40 characters`}
          />
          <TextField
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            fullWidth
            size="small"
            inputProps={{ maxLength: 10, inputMode: "numeric", pattern: "[0-9]*" }}
            helperText={`${formData.phone.length}/10 digits`}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="tertiary" size="sm" onClick={handleClose} sx={{ flex: 1 }}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} sx={{ flex: 1 }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Profile;