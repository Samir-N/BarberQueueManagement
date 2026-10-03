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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import Button from "./Button";
import { showLoading, hideLoading } from "../redux/features/alertSlice";
import { setUser } from "../redux/features/authSlice";

const Profile = ({ onEdit }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
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
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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

    const cleanPhone = Number(cleanPhoneStr); // Converted to Number for the schema

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

  return (
    <>
      <Card
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          border: "1px solid #E5E7EB",
          backgroundColor: "#FFFFFF",
          mb: { xs: 3, sm: 0 },
          width: "100%",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
          <Typography
            sx={{
              fontSize: { xs: 16, sm: 18 },
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Profile Details
          </Typography>
        </Box>

        <Box sx={{ overflowX: "auto", mb: 3 }}>
          <Table
            size="small"
            sx={{
              minWidth: 260,
              "& td, & th": { py: 0.75, px: 1.5 },
            }}
          >
            <TableBody>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 500,
                    color: "#6B7280",
                    width: "40%",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  ID
                </TableCell>
                <TableCell sx={{ borderBottom: "1px solid #E5E7EB" }}>
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
                      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', Consolas, monospace",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      letterSpacing: "0.75px",
                    }}
                  >
                    {user?.publicId || "N/A"}
                  </Box>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 500,
                    color: "#6B7280",
                    width: "40%",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  Name
                </TableCell>
                <TableCell
                  sx={{
                    color: "#111827",
                    fontWeight: 600,
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  {user?.name || "N/A"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 500,
                    color: "#6B7280",
                    width: "40%",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  Role
                </TableCell>
                <TableCell
                  sx={{
                    color: "#111827",
                    fontWeight: 600,
                    borderBottom: "1px solid #E5E7EB",
                    textTransform: "capitalize",
                  }}
                >
                  {user?.role || "N/A"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 500,
                    color: "#6B7280",
                    width: "40%",
                    borderBottom: "none",
                  }}
                >
                  Phone
                </TableCell>
                <TableCell
                  sx={{
                    color: "#111827",
                    fontWeight: 600,
                    borderBottom: "none",
                  }}
                >
                  {user?.phone || "N/A"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        <Stack direction="row" sx={{ width: "100%" }}>
          <Button
            variant="tertiary"
            size="sm"
            onClick={handleEditClick}
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
      </Card>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
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
            inputProps={{ maxLength: 10 }}
            helperText="Must be exactly 10 digits"
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