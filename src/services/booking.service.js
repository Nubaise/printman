const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");

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
    // 1. Validate request object
    if (
        !request ||
        typeof request !== "object" ||
        Array.isArray(request)
    ) {
        throw new AppError("Invalid booking request", 400);
    }

    // 2. Reject unexpected request fields
    const allowedFields = [
        "rollNumber",
        "date",
        "startTime",
        "pages",
        "copies",
        "type",
        "doubleSided",
        "binding"
    ];

    const unexpectedFields = Object.keys(request).filter(
        field => !allowedFields.includes(field)
    );

    if (unexpectedFields.length > 0) {
        throw new AppError(
            `Unexpected booking field: ${unexpectedFields[0]}`,
            400
        );
    }

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

    // 3. Validate and normalize student details
    if (
        typeof rollNumber !== "string" ||
        !rollNumber.trim()
    ) {
        throw new AppError("Valid roll number is required", 400);
    }

    const normalizedRollNumber = rollNumber.trim();

    // 4. Validate date and time
    if (!isValidDate(date)) {
        throw new AppError("Invalid date. Use YYYY-MM-DD", 400);
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime || "")) {
        throw new AppError("Invalid start time. Use HH:mm", 400);
    }

    // 5. Validate printing options
    if (!["BW", "COLOR"].includes(type)) {
        throw new AppError("Printing type must be BW or COLOR", 400);
    }

    if (
        typeof doubleSided !== "boolean" ||
        typeof binding !== "boolean"
    ) {
        throw new AppError("Invalid printing options", 400);
    }

    if (type === "COLOR" && doubleSided) {
        throw new AppError(
            "Colour printing supports single-sided only",
            400
        );
    }

    // 6. Validate pages and copies and calculate price
    const price = calculatePrice({
        pages,
        copies,
        type,
        binding
    });

    const bookingDate = new Date(`${date}T00:00:00.000Z`);

    const startDateTime = new Date(
        `1970-01-01T${startTime}:00.000Z`
    );

    // 7. Allocate printer and save booking transactionally
    return prisma.$transaction(async (tx) => {

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

        compatiblePrinters.sort((a, b) => {
            if (a.reliability !== b.reliability) {
                return a.reliability === "HIGH" ? -1 : 1;
            }

            return b.speed - a.speed;
        });

        if (compatiblePrinters.length === 0) {
            throw new AppError(
                "No compatible printer available",
                400
            );
        }

        // Lock candidate printers in a consistent order
        for (const printer of compatiblePrinters) {
            await tx.$queryRaw`
                SELECT id
                FROM printers
                WHERE id = ${printer.id}
                FOR UPDATE
            `;
        }

        // 8. Check printer availability
        for (const printer of compatiblePrinters) {

            const duration = calculateDuration({
                pages,
                copies,
                printerSpeed: printer.speed
            });

            const startMinutes = timeToMinutes(startTime);
            const endMinutes = startMinutes + duration.totalDuration;

            if (startMinutes < 480 || endMinutes > 1080) {
                throw new AppError(
                    "Booking must be within shop hours (08:00-18:00)",
                    400
                );
            }

            const endTime = minutesToTime(endMinutes);

            const endDateTime = new Date(
                `1970-01-01T${endTime}:00.000Z`
            );

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

            // 9. Save booking
            const booking = await tx.booking.create({
                data: {
                    rollNumber: normalizedRollNumber,
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

        throw new AppError(
            "No printer available for the requested time slot",
            400
        );
    });
};

module.exports = {
    createBooking
};
