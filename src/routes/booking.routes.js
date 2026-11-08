const express = require("express");
const router = express.Router();

const {
    createBookingController,
    getBookingsController
} = require("../controllers/booking.controller");

router.get("/", getBookingsController);
router.post("/", createBookingController);

module.exports = router;
