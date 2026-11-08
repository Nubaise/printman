const prisma = require("../config/prisma");

const getPrinters = async (req, res) => {
    try {
        const printers = await prisma.printer.findMany({
            orderBy: {
                id: "asc"
            }
        });

        return res.status(200).json({
            success: true,
            count: printers.length,
            data: printers
        });

    } catch (error) {
        console.error("Error fetching printers:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch printers"
        });
    }
};

module.exports = { getPrinters };
