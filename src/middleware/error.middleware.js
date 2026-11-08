const errorMiddleware = (err, req, res, next) => {
    const clientErrors = [
        "Valid roll number is required",
        "Invalid date. Use YYYY-MM-DD",
        "Invalid start time. Use HH:mm",
        "Printing type must be BW or COLOR",
        "Invalid printing options",
        "Colour printing supports single-sided only",
        "Pages must be a positive integer",
        "Copies must be a positive integer",
        "No compatible printer available",
        "Booking must be within shop hours (08:00-18:00)",
        "No printer available for the requested time slot",
        "Invalid booking request",
        "Valid date is required (YYYY-MM-DD)"
    ];

    const statusCode = err.statusCode ||
        (clientErrors.includes(err.message) ? 400 : 500);

    if (statusCode >= 500) {
        console.error("Internal server error:", err);
    }

    return res.status(statusCode).json({
        success: false,
        message: statusCode >= 500
            ? "Internal server error"
            : err.message
    });
};

module.exports = errorMiddleware;
