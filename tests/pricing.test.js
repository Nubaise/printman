
const { calculatePrice } = require("../src/services/pricing.service");

describe("Pricing Service", () => {
    test("calculates B&W printing cost", () => {
        expect(calculatePrice({
            pages: 50,
            copies: 2,
            type: "BW",
            binding: false
        })).toEqual({
            printingCost: 100,
            bindingCost: 0,
            totalPrice: 100
        });
    });

    test("calculates colour printing cost", () => {
        expect(calculatePrice({
            pages: 10,
            copies: 2,
            type: "COLOR",
            binding: false
        }).totalPrice).toBe(160);
    });

    test("includes spiral binding cost per copy", () => {
        expect(calculatePrice({
            pages: 50,
            copies: 2,
            type: "BW",
            binding: true
        }).totalPrice).toBe(160);
    });

    test("rejects zero pages", () => {
        expect(() => calculatePrice({
            pages: 0,
            copies: 1,
            type: "BW"
        })).toThrow("Pages must be a positive integer");
    });

    test("rejects zero copies", () => {
        expect(() => calculatePrice({
            pages: 10,
            copies: 0,
            type: "BW"
        })).toThrow("Copies must be a positive integer");
    });

    test("rejects unsupported printing type", () => {
        expect(() => calculatePrice({
            pages: 10,
            copies: 1,
            type: "INVALID"
        })).toThrow("Invalid printing type");
    });
});
