const express = require("express");
const router = express.Router();

const {
    createBookingController
} = require("../controllers/booking.controller");

router.post("/", createBookingController);

module.exports = router;
