const errorMiddleware = (err, req, res, next) => {
    let statusCode = err.isOperational ? err.statusCode : 500;
    let message = statusCode >= 500
        ? "Internal server error"
        : err.message;

    // Malformed JSON sent by the client.
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        statusCode = 400;
        message = "Invalid JSON request body";
    }

    if (statusCode >= 500) {
        console.error("Internal server error:", err);
    }

    return res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = errorMiddleware;
