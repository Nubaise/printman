const { createBooking } = require("../services/booking.service");

const createBookingController = (req, res) => {
    try {
        const booking = createBooking(req.body);

        return res.status(201).json({
            success: true,
            message: "Booking created successfully",
            data: booking
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const bookings = require("../data/bookings");

const getBookingsController = (req, res) => {
    return res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings
    });
};

module.exports = {
    createBookingController,
    getBookingsController
};
