const express = require("express");
const cors = require("cors");

const printerRoutes = require("./routes/printer.routes");
const bookingRoutes = require("./routes/booking.routes");
const availabilityRoutes = require("./routes/availability.routes");

const notFoundMiddleware = require("./middleware/not-found.middleware");
const errorMiddleware = require("./middleware/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Campus Xerox Booking API is running"
    });
});

app.use("/api/printers", printerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/availability", availabilityRoutes);

// Handle unknown routes.
app.use(notFoundMiddleware);

// Handle all application errors.
app.use(errorMiddleware);

module.exports = app;
