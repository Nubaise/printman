
const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/config/prisma");

describe("Booking API integration tests", () => {
    beforeAll(async () => {
        await prisma.booking.deleteMany();

        const printers = [
            {
                id: "P1",
                name: "Printer 1",
                type: "BW",
                speed: 30,
                reliability: "HIGH",
                status: "ACTIVE",
                singleSided: true,
                doubleSided: true,
                color: false
            },
            {
                id: "P2",
                name: "Printer 2",
                type: "BW",
                speed: 20,
                reliability: "LOW",
                status: "ACTIVE",
                singleSided: true,
                doubleSided: true,
                color: false
            },
            {
                id: "P3",
                name: "Printer 3",
                type: "COLOR",
                speed: 10,
                reliability: "HIGH",
                status: "ACTIVE",
                singleSided: true,
                doubleSided: false,
                color: true
            }
        ];

        for (const printer of printers) {
            await prisma.printer.upsert({
                where: { id: printer.id },
                update: printer,
                create: printer
            });
        }
    });

    beforeEach(async () => {
        await prisma.booking.deleteMany();
    });

    afterAll(async () => {
        await prisma.booking.deleteMany();
        await prisma.$disconnect();
    });

    test("creates a B&W booking and assigns P1", async () => {
        const response = await request(app)
            .post("/api/bookings")
            .send({
                rollNumber: "TEST001",
                date: "2026-11-15",
                startTime: "09:00",
                pages: 30,
                copies: 1,
                type: "BW"
            });

        expect(response.status).toBe(201);
        expect(response.body.data.printerId).toBe("P1");
    });

    test("assigns colour booking exclusively to P3", async () => {
        const response = await request(app)
            .post("/api/bookings")
            .send({
                rollNumber: "TEST002",
                date: "2026-11-15",
                startTime: "09:00",
                pages: 30,
                copies: 1,
                type: "COLOR"
            });

        expect(response.status).toBe(201);
        expect(response.body.data.printerId).toBe("P3");
    });

    test("rejects overlapping bookings on the same printer", async () => {
        const booking = {
            rollNumber: "TEST003",
            date: "2026-11-15",
            startTime: "09:00",
            pages: 30,
            copies: 1,
            type: "COLOR"
        };

        const first = await request(app)
            .post("/api/bookings")
            .send(booking);

        const second = await request(app)
            .post("/api/bookings")
            .send({
                ...booking,
                rollNumber: "TEST004"
            });

        expect(first.status).toBe(201);
        expect(second.status).toBe(400);
        expect(second.body.message).toBe(
            "No printer available for the requested time slot"
        );
    });

    test("rejects colour double-sided printing", async () => {
        const response = await request(app)
            .post("/api/bookings")
            .send({
                rollNumber: "TEST005",
                date: "2026-11-15",
                startTime: "09:00",
                pages: 30,
                copies: 1,
                type: "COLOR",
                doubleSided: true
            });

        expect(response.status).toBe(400);
    });

    test("does not save an invalid booking", async () => {
        const response = await request(app)
            .post("/api/bookings")
            .send({
                rollNumber: "TEST006",
                date: "2026-11-15",
                startTime: "09:00",
                pages: 0,
                copies: 1,
                type: "BW"
            });

        expect(response.status).toBe(400);
        expect(await prisma.booking.count()).toBe(0);
    });

    test("prevents concurrent bookings from reserving the same printer slot", async () => {
        const createBooking = (rollNumber) =>
            request(app)
                .post("/api/bookings")
                .send({
                    rollNumber,
                    date: "2026-11-16",
                    startTime: "10:00",
                    pages: 20,
                    copies: 1,
                    type: "COLOR"
                });

        const responses = await Promise.all([
            createBooking("TEST007"),
            createBooking("TEST008")
        ]);

        expect(
            responses.map(response => response.status).sort()
        ).toEqual([201, 400]);

        const bookings = await prisma.booking.findMany({
            where: {
                bookingDate: new Date("2026-11-16T00:00:00.000Z"),
                printerId: "P3"
            }
        });

        expect(bookings).toHaveLength(1);
    });

    test("returns availability for all active printers", async () => {
        const response = await request(app)
            .get("/api/availability?date=2026-11-17");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.date).toBe("2026-11-17");

        expect(response.body.data).toHaveLength(3);

        const printerIds = response.body.data.map(
            printer => printer.printerId
        );

        expect(printerIds).toEqual(["P1", "P2", "P3"]);

            response.body.data.forEach(printer => {
            expect(printer).toHaveProperty("bookings");
            expect(printer).toHaveProperty("freeSlots");
        });
    });

    test("rejects a missing request body", async () => {
        const response = await request(app)
            .post("/api/bookings")
            .send(null);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid booking request");
    });

    test("rejects a whitespace-only roll number", async () => {
        const response = await request(app)
            .post("/api/bookings")
            .send({
                rollNumber: "   ",
                date: "2026-11-18",
                startTime: "09:00",
                pages: 20,
                copies: 1,
                type: "BW"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Valid roll number is required");
    });

    test("trims whitespace from roll numbers before saving", async () => {
        const response = await request(app)
            .post("/api/bookings")
            .send({
                rollNumber: " TEST009 ",
                date: "2026-11-18",
                startTime: "09:00",
                pages: 20,
                copies: 1,
                type: "BW"
            });

        expect(response.status).toBe(201);
        expect(response.body.data.rollNumber).toBe("TEST009");
    });

    test("database rejects overlapping bookings even when bypassing booking service", async () => {
        const bookingDate = new Date("2026-11-19T00:00:00.000Z");

        const firstBooking = {
            rollNumber: "DBTEST001",
            printerId: "P3",
            bookingDate,
            startTime: new Date("1970-01-01T10:00:00.000Z"),
            endTime: new Date("1970-01-01T10:05:00.000Z"),
            pages: 30,
            copies: 1,
            type: "COLOR",
            doubleSided: false,
            binding: false,
            durationMinutes: 5,
            price: 240,
            status: "CONFIRMED"
        };

        await prisma.booking.create({
            data: firstBooking
        });

        await expect(
            prisma.booking.create({
                data: {
                    ...firstBooking,
                    rollNumber: "DBTEST002",
                    startTime: new Date("1970-01-01T10:03:00.000Z"),
                    endTime: new Date("1970-01-01T10:08:00.000Z")
                }
            })
        ).rejects.toThrow("bookings_no_overlapping_slots");

        expect(
            await prisma.booking.count({
                where: {
                    bookingDate,
                    printerId: "P3"
                }
            })
        ).toBe(1);
    });
});
