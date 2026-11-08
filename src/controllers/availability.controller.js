const {
    getDailyAvailability
} = require("../services/availability.service");

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
    try {
        const { date } = req.query;

        if (!isValidDate(date)) {
            return res.status(400).json({
                success: false,
                message: "Valid date is required (YYYY-MM-DD)"
            });
        }

        const availability = await getDailyAvailability(date);

        return res.status(200).json({
            success: true,
            date,
            data: availability
        });

    } catch (error) {
        console.error("Availability retrieval failed:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch availability"
        });
    }
};

module.exports = { getAvailabilityController };
