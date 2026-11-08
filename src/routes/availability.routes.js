const express = require("express");
const router = express.Router();

const {
    getAvailabilityController
} = require("../controllers/availability.controller");

router.get("/", getAvailabilityController);

module.exports = router;
