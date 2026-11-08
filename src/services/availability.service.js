const printers = require("../data/printers");
const bookings = require("../data/bookings");

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

const getDailyAvailability = (date) => {
    return printers.map(printer => {

        // Get bookings for this printer and date
        const printerBookings = bookings
            .filter(booking =>
                booking.printerId === printer.id &&
                booking.date === date
            )
            .sort((a, b) =>
                a.startTime.localeCompare(b.startTime)
            );

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

        // Add remaining free time until shop closing
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
