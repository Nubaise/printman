const express = require("express");
const cors = require("cors");

const printerRoutes = require("./routes/printer.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Campus Xerox Booking API is running"
    });
});

app.use("/api/printers", printerRoutes);

module.exports = app;
