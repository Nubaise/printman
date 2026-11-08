const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.isOperational ? err.statusCode : 500;

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
