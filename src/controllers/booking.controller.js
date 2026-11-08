const prisma = require("../config/prisma");
const { createBooking } = require("../services/booking.service");

const createBookingController = async (req, res) => {
    const booking = await createBooking(req.body);

    return res.status(201).json({
        success: true,
        message: "Booking created successfully",
        data: booking
    });
};

const getBookingsController = async (req, res) => {
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
};

module.exports = {
    createBookingController,
    getBookingsController
};
