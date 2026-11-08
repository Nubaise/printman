class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);

        if (
            !Number.isInteger(statusCode) ||
            statusCode < 400 ||
            statusCode > 599
        ) {
            throw new TypeError("Invalid HTTP error status code");
        }

        this.name = "AppError";
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
