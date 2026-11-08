const request = require("supertest");
const app = require("../src/app");

describe("API error handling", () => {
    test("returns JSON 404 for unknown routes", async () => {
        const response = await request(app)
            .get("/api/unknown");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            success: false,
            message: "Route not found: GET /api/unknown"
        });
    });

    test("returns HTTP 400 for malformed JSON", async () => {
        const response = await request(app)
            .post("/api/bookings")
            .set("Content-Type", "application/json")
            .send('{"rollNumber":');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            message: "Invalid JSON request body"
        });
    });

    test("returns a consistent health-check response", async () => {
        const response = await request(app).get("/");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            success: true,
            message: "Campus Xerox Booking API is running"
        });
    });
});
