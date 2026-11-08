const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

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

async function main() {
    for (const printer of printers) {
        await prisma.printer.upsert({
            where: { id: printer.id },
            update: printer,
            create: printer
        });
    }

    console.log("Printers seeded successfully!");
}

main()
    .catch((error) => {
        console.error("Seeding failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
