const { randomUUID } = require("crypto");

const printers = require("../data/printers");
const bookings = require("../data/bookings");

const { calculatePrice } = require("./pricing.service");
const { calculateDuration } = require("./duration.service");

const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
};

const isValidDate = (date) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

    const [year, month, day] = date.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));

    return (
        parsed.getUTCFullYear() === year &&
        parsed.getUTCMonth() === month - 1 &&
        parsed.getUTCDate() === day
    );
};

const createBooking = (request) => {
    const {
        rollNumber,
        date,
        startTime,
        pages,
        copies,
        type,
        doubleSided = false,
        binding = false
    } = request;

    // 1. Validate student details
    if (!rollNumber || typeof rollNumber !== "string") {
        throw new Error("Valid roll number is required");
    }

    // 2. Validate date and time
    if (!isValidDate(date)) {
        throw new Error("Invalid date. Use YYYY-MM-DD");
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime || "")) {
        throw new Error("Invalid start time. Use HH:mm");
    }

    // 3. Validate print options
    if (!["BW", "COLOR"].includes(type)) {
        throw new Error("Printing type must be BW or COLOR");
    }

    if (typeof doubleSided !== "boolean" ||
        typeof binding !== "boolean") {
        throw new Error("Invalid printing options");
    }

    if (type === "COLOR" && doubleSided) {
        throw new Error("Colour printing supports single-sided only");
    }

    if (type === "COLOR" && binding) {
        // Binding is permitted independently of colour mode.
        // No restriction specified by the assessment.
    }

    // 4. Calculate price
    const price = calculatePrice({
        pages,
        copies,
        type,
        binding
    });

    // 5. Find compatible printers
    const compatiblePrinters = printers
        .filter(printer =>
            printer.status === "ACTIVE" &&
            printer.type === type &&
            (!doubleSided || printer.capabilities.doubleSided)
        )
        .sort((a, b) => {
            if (a.reliability !== b.reliability) {
                return a.reliability === "HIGH" ? -1 : 1;
            }

            return b.speed - a.speed;
        });

    if (compatiblePrinters.length === 0) {
        throw new Error("No compatible printer available");
    }

    // 6. Try each compatible printer
    for (const printer of compatiblePrinters) {
        const duration = calculateDuration({
            pages,
            copies,
            printerSpeed: printer.speed
        });

        const startMinutes = timeToMinutes(startTime);
        const endMinutes = startMinutes + duration.totalDuration;

        if (startMinutes < 8 * 60 || endMinutes > 18 * 60) {
            throw new Error("Booking must be within shop hours (08:00-18:00)");
        }

        const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

        // Check interval overlap
        const hasOverlap = bookings.some(booking => {
            if (
                booking.printerId !== printer.id ||
                booking.date !== date
            ) {
                return false;
            }

            const existingStart = timeToMinutes(booking.startTime);
            const existingEnd = timeToMinutes(booking.endTime);

            return (
                startMinutes < existingEnd &&
                endMinutes > existingStart
            );
        });

        if (hasOverlap) continue;

        // 7. Create booking
        const booking = {
            id: randomUUID(),
            rollNumber,
            printerId: printer.id,
            date,
            startTime,
            endTime,
            pages,
            copies,
            type,
            doubleSided,
            binding,
            durationMinutes: duration.totalDuration,
            price: price.totalPrice,
            status: "CONFIRMED",
            createdAt: new Date().toISOString()
        };

        bookings.push(booking);

        return booking;
    }

    throw new Error("No printer available for the requested time slot");
};

module.exports = {
    createBooking
};
