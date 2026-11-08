
const { calculateDuration } = require("../src/services/duration.service");

describe("Duration Service", () => {
    test("calculates P1 printing duration", () => {
        expect(calculateDuration({
            pages: 62,
            copies: 1,
            printerSpeed: 30
        })).toEqual({
            printingMinutes: 3,
            handlingMinutes: 2,
            totalDuration: 5
        });
    });

    test("calculates duration for multiple copies", () => {
        expect(calculateDuration({
            pages: 14,
            copies: 5,
            printerSpeed: 20
        }).totalDuration).toBe(6);
    });

    test("rounds printing time up", () => {
        expect(calculateDuration({
            pages: 31,
            copies: 1,
            printerSpeed: 30
        }).printingMinutes).toBe(2);
    });

    test("rejects invalid printer speed", () => {
        expect(() => calculateDuration({
            pages: 10,
            copies: 1,
            printerSpeed: 0
        })).toThrow("Invalid printer speed");
    });

    test("rejects invalid page count", () => {
        expect(() => calculateDuration({
            pages: -1,
            copies: 1,
            printerSpeed: 30
        })).toThrow("Pages must be a positive integer");
    });
});
