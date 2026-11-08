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

    // 1. Validate query parameters
    const queryFields = Object.keys(req.query);

    if (queryFields.length === 0) {
        throw new AppError(
            "Valid date is required (YYYY-MM-DD)",
            400
        );
    }

    if (
        queryFields.length !== 1 ||
        queryFields[0] !== "date" ||
        typeof req.query.date !== "string"
    ) {
        throw new AppError(
            "Only one valid date query parameter is allowed",
            400
        );
    }

    const { date } = req.query;

    // 2. Validate date format and actual calendar date
    if (!isValidDate(date)) {
        throw new AppError(
            "Valid date is required (YYYY-MM-DD)",
            400
        );
    }

    // 3. Fetch daily printer availability
    const availability = await getDailyAvailability(date);

    return res.status(200).json({
        success: true,
        date,
        data: availability
    });
};

module.exports = {
    getAvailabilityController
};
