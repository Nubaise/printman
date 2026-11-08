const {
    getDailyAvailability
} = require("../services/availability.service");

const AppError = require("../utils/AppError");

const isValidDate = (date) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
        return false;
    }

    const [year, month, day] = date.split("-").map(Number);

    const parsedDate = new Date(
        Date.UTC(year, month - 1, day)
    );

    return (
        parsedDate.getUTCFullYear() === year &&
        parsedDate.getUTCMonth() === month - 1 &&
        parsedDate.getUTCDate() === day
    );
};

const getAvailabilityController = async (req, res) => {
    const { date } = req.query;

    if (!isValidDate(date)) {
        throw new AppError(
            "Valid date is required (YYYY-MM-DD)",
            400
        );
    }

    const availability = await getDailyAvailability(date);

    return res.status(200).json({
        success: true,
        date,
        data: availability
    });
};

module.exports = { getAvailabilityController };
