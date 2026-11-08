const express = require("express");
const router = express.Router();

const {
    getPrinters
} = require("../controllers/printer.controller");

router.get("/", getPrinters);

module.exports = router;
