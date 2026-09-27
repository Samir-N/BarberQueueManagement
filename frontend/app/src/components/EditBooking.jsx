import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
} from "@mui/material";
import Button from "./Button";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import dayjs from "dayjs";
import TimeManager from "./TimeManager";
import { insertPersonalBooking, hideBooking } from "../redux/features/bookingSlice";
import { showLoading, hideLoading } from "../redux/features/alertSlice";

const EditBooking = () => {
  const { personalBooking } = useSelector((state) => state.booking);
  const { services } = useSelector((state) => state.service);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    serviceId: personalBooking?.service?._id || "",
    serviceName: personalBooking?.service?.serviceName || "",
    time: personalBooking?.bookingTime ? dayjs(personalBooking.bookingTime) : null,
    price: personalBooking?.service?.price || "",
  });

  const [openConfirm, setOpenConfirm] = useState(false);

  useEffect(() => {
    if (personalBooking) {
      setFormData({
        serviceId: personalBooking?.service?._id || "",
        serviceName: personalBooking?.service?.serviceName || "",
        time: personalBooking?.bookingTime ? dayjs(personalBooking.bookingTime) : null,
        price: personalBooking?.service?.price || "",
      });
    }
  }, [personalBooking]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "serviceName") {
      const selectedService = services.find((s) => s.serviceName === value);
      setFormData((prev) => ({
        ...prev,
        serviceId: selectedService ? selectedService._id : "",
        serviceName: value,
        price: selectedService ? selectedService.price : "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTimeSelect = (timeString) => {
    const [t, modifier] = timeString.split(" ");
    let [hours, minutes] = t.split(":").map(Number);

    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    const newTime = dayjs().hour(hours).minute(minutes).second(0);
    setFormData((prev) => ({ ...prev, time: newTime }));
  };

  const handleSave = async () => {
    try {
      dispatch(showLoading());
      const token = localStorage.getItem("token");
      
      if (!formData.serviceId || !formData.time) {
        alert("Please select both service and time!");
        dispatch(hideLoading());
        setOpenConfirm(false);
        return;
      }

      const response = await axios.put(
        `/api/v1/user/personalBooking/edit/${personalBooking._id}`,
        {
          service: formData.serviceId,
          bookingTime: formData.time.toDate(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const res = await axios.post(
          "/api/v1/user/personalBookings",
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.data.success) {
          dispatch(insertPersonalBooking(res.data.data));
        }
        alert("Booking updated successfully!");
        dispatch(hideBooking());
      } else {
        alert("Failed to update booking!");
      }
    } catch (err) {
      console.error("Error saving booking:", err);
      alert(err.response?.data?.message || "Failed to update booking!");
    } finally {
      dispatch(hideLoading());
      setOpenConfirm(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setOpenConfirm(true);
  };

  const handleCancel = () => {
    dispatch(hideBooking());
  };

  return (
    <Box sx={{ mx: "auto", maxWidth: 600 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        Edit Booking
      </Typography>

      <form onSubmit={handleSubmit}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            p: 2,
            borderRadius: 2,
            border: "1px solid #E5E7EB",
          }}
        >
          {/* Service + Price */}
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <FormControl fullWidth size="small">
              <InputLabel>Service</InputLabel>
              <Select
                label="Service"
                name="serviceName"
                value={formData.serviceName}
                onChange={handleChange}
              >
                {services.map((s) => (
                  <MenuItem key={s.serviceName} value={s.serviceName}>
                    {s.serviceName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Price"
              value={formData.price}
              InputProps={{ readOnly: true }}
              size="small"
              sx={{ width: 120 }}
            />
          </Box>

          {/* Time */}
          <TimeManager onTimeSelect={handleTimeSelect} />
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ mt: 3, width: "100%" }}>
          <Button type="submit" variant="primary" sx={{ flex: 1 }}>
            Save
          </Button>
          <Button variant="tertiary" onClick={handleCancel} sx={{ flex: 1 }}>
            Cancel
          </Button>
        </Stack>
      </form>

      {/* Confirmation Dialog */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>Confirm Edit</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to update this booking?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="danger" size="sm" onClick={() => setOpenConfirm(false)} sx={{ flex: 1 }}>
            No
          </Button>
          <Button variant="success" size="sm" onClick={handleSave} sx={{ flex: 1 }}>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EditBooking;