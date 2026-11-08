const prisma = require("../config/prisma");

const { calculatePrice } = require("./pricing.service");
const { calculateDuration } = require("./duration.service");

const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
};

const isValidDate = (date) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
        return false;
    }

    const [year, month, day] = date.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));

    return (
        parsed.getUTCFullYear() === year &&
        parsed.getUTCMonth() === month - 1 &&
        parsed.getUTCDate() === day
    );
};

const createBooking = async (request) => {
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

    // 3. Validate printing options
    if (!["BW", "COLOR"].includes(type)) {
        throw new Error("Printing type must be BW or COLOR");
    }

    if (
        typeof doubleSided !== "boolean" ||
        typeof binding !== "boolean"
    ) {
        throw new Error("Invalid printing options");
    }

    if (type === "COLOR" && doubleSided) {
        throw new Error("Colour printing supports single-sided only");
    }

    // 4. Calculate price
    const price = calculatePrice({
        pages,
        copies,
        type,
        binding
    });

    // Convert input date and times into Date objects
    const bookingDate = new Date(`${date}T00:00:00.000Z`);
    const startDateTime = new Date(
        `1970-01-01T${startTime}:00.000Z`
    );

    // 5. Allocate printer and save booking transactionally
    return prisma.$transaction(async (tx) => {

        // Find compatible printers from PostgreSQL
        const compatiblePrinters = await tx.printer.findMany({
            where: {
                status: "ACTIVE",
                type,
                ...(doubleSided ? { doubleSided: true } : {})
            },
            orderBy: [
                { reliability: "asc" },
                { speed: "desc" }
            ]
        });

        // HIGH reliability must be preferred over LOW.
        compatiblePrinters.sort((a, b) => {
            if (a.reliability !== b.reliability) {
                return a.reliability === "HIGH" ? -1 : 1;
            }

            return b.speed - a.speed;
        });

        if (compatiblePrinters.length === 0) {
            throw new Error("No compatible printer available");
        }

        // Lock all candidate printers in a consistent order.
        // Concurrent booking requests must wait for these locks.
        for (const printer of compatiblePrinters) {
            await tx.$queryRaw`
                SELECT id
                FROM printers
                WHERE id = ${printer.id}
                FOR UPDATE
            `;
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

            if (startMinutes < 480 || endMinutes > 1080) {
                throw new Error(
                    "Booking must be within shop hours (08:00-18:00)"
                );
            }

            const endTime = minutesToTime(endMinutes);

            const endDateTime = new Date(
                `1970-01-01T${endTime}:00.000Z`
            );

            // Check overlapping bookings in PostgreSQL
            const existingBooking = await tx.booking.findFirst({
                where: {
                    printerId: printer.id,
                    bookingDate,
                    startTime: {
                        lt: endDateTime
                    },
                    endTime: {
                        gt: startDateTime
                    },
                    status: {
                        not: "CANCELLED"
                    }
                }
            });

            if (existingBooking) {
                continue;
            }

            // 7. Create booking in PostgreSQL
            const booking = await tx.booking.create({
                data: {
                    rollNumber,
                    printerId: printer.id,
                    bookingDate,
                    startTime: startDateTime,
                    endTime: endDateTime,
                    pages,
                    copies,
                    type,
                    doubleSided,
                    binding,
                    durationMinutes: duration.totalDuration,
                    price: price.totalPrice,
                    status: "CONFIRMED"
                }
            });

            // Preserve the existing API response format
            return {
                id: booking.id,
                rollNumber: booking.rollNumber,
                printerId: booking.printerId,
                date,
                startTime,
                endTime,
                pages: booking.pages,
                copies: booking.copies,
                type: booking.type,
                doubleSided: booking.doubleSided,
                binding: booking.binding,
                durationMinutes: booking.durationMinutes,
                price: Number(booking.price),
                status: booking.status,
                createdAt: booking.createdAt.toISOString()
            };
        }

        throw new Error(
            "No printer available for the requested time slot"
        );
    });
};

module.exports = {
    createBooking
};
