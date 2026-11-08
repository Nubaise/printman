const errorMiddleware = require("../src/middleware/error.middleware");
const AppError = require("../src/utils/AppError");

describe("Centralized Error Middleware", () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("returns the specified status for operational errors", () => {
        const error = new AppError("Invalid request", 400);

        errorMiddleware(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Invalid request"
        });
    });

    test("returns HTTP 500 for unexpected errors", () => {
        const error = new Error("Database connection failed");
        jest.spyOn(console, "error").mockImplementation(() => {});

        errorMiddleware(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Internal server error"
        });
    });

    test("does not expose unexpected error details", () => {
        const error = new Error("Sensitive database information");
        jest.spyOn(console, "error").mockImplementation(() => {});

        errorMiddleware(error, req, res, next);

        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Internal server error"
        });

        expect(res.json.mock.calls[0][0].message)
            .not.toContain("Sensitive database information");
    });
});
