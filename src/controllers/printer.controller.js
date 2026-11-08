const prisma = require("../config/prisma");

const getPrinters = async (req, res) => {
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
};

module.exports = { getPrinters };
