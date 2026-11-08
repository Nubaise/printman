const prisma = require("../config/prisma");

const SHOP_OPEN = 8 * 60;
const SHOP_CLOSE = 18 * 60;

const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
};

const getDailyAvailability = async (date) => {

    const bookingDate = new Date(`${date}T00:00:00.000Z`);

    // Fetch all printers and their bookings for the requested date
    const printers = await prisma.printer.findMany({
        where: {
            status: "ACTIVE"
        },
        include: {
            bookings: {
                where: {
                    bookingDate,
                    status: {
                        not: "CANCELLED"
                    }
                },
                orderBy: {
                    startTime: "asc"
                }
            }
        },
        orderBy: {
            id: "asc"
        }
    });

    return printers.map(printer => {

        const printerBookings = printer.bookings.map(booking => ({
            id: booking.id,
            rollNumber: booking.rollNumber,
            printerId: booking.printerId,
            date,
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

        // Calculate free intervals
        const freeSlots = [];
        let currentTime = SHOP_OPEN;

        for (const booking of printerBookings) {
            const bookingStart = timeToMinutes(booking.startTime);
            const bookingEnd = timeToMinutes(booking.endTime);

            if (currentTime < bookingStart) {
                freeSlots.push({
                    startTime: minutesToTime(currentTime),
                    endTime: minutesToTime(bookingStart)
                });
            }

            currentTime = Math.max(currentTime, bookingEnd);
        }

        if (currentTime < SHOP_CLOSE) {
            freeSlots.push({
                startTime: minutesToTime(currentTime),
                endTime: minutesToTime(SHOP_CLOSE)
            });
        }

        return {
            printerId: printer.id,
            printerName: printer.name,
            type: printer.type,
            speed: printer.speed,
            bookings: printerBookings,
            freeSlots
        };
    });
};

module.exports = { getDailyAvailability };
