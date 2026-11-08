const express = require("express");
const cors = require("cors");

const printerRoutes = require("./routes/printer.routes");
const bookingRoutes = require("./routes/booking.routes");
const availabilityRoutes = require("./routes/availability.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Campus Xerox Booking API is running"
    });
});

app.use("/api/printers", printerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/availability", availabilityRoutes);

module.exports = app;
