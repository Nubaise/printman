const prisma = require("../config/prisma");
const { createBooking } = require("../services/booking.service");

const createBookingController = async (req, res) => {
    try {
        const booking = await createBooking(req.body);

        return res.status(201).json({
            success: true,
            message: "Booking created successfully",
            data: booking
        });

    } catch (error) {
        console.error("Booking creation failed:", error);

        const clientErrors = [
            "Valid roll number is required",
            "Invalid date. Use YYYY-MM-DD",
            "Invalid start time. Use HH:mm",
            "Printing type must be BW or COLOR",
            "Invalid printing options",
            "Colour printing supports single-sided only",
            "No compatible printer available",
            "Booking must be within shop hours (08:00-18:00)",
            "No printer available for the requested time slot"
        ];

        const isClientError = clientErrors.includes(error.message);

        return res.status(isClientError ? 400 : 500).json({
            success: false,
            message: isClientError
                ? error.message
                : "Internal server error"
        });
    }
};

const getBookingsController = async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            orderBy: [
                { bookingDate: "asc" },
                { startTime: "asc" }
            ]
        });

        const data = bookings.map(booking => ({
            id: booking.id,
            rollNumber: booking.rollNumber,
            printerId: booking.printerId,
            date: booking.bookingDate.toISOString().slice(0, 10),
            startTime: booking.startTime.toISOString().slice(11, 16),
            endTime: booking.endTime.toISOString().slice(11, 16),
            pages: booking.pages,
            copies: booking.copies,
            type: booking.type,
            doubleSided: booking.doubleSided,
            binding: booking.binding,
            durationMinutes: booking.durationMinutes,
            price: Number(booking.price),
            status: booking.status,
            createdAt: booking.createdAt.toISOString()
        }));

        return res.status(200).json({
            success: true,
            count: data.length,
            data
        });

    } catch (error) {
        console.error("Error fetching bookings:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch bookings"
        });
    }
};

module.exports = {
    createBookingController,
    getBookingsController
};
