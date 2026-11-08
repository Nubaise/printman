const calculateDuration = ({
    pages,
    copies,
    printerSpeed
}) => {

    if (!Number.isInteger(pages) || pages <= 0) {
        throw new Error("Pages must be a positive integer");
    }

    if (!Number.isInteger(copies) || copies <= 0) {
        throw new Error("Copies must be a positive integer");
    }

    if (!Number.isFinite(printerSpeed) || printerSpeed <= 0) {
        throw new Error("Invalid printer speed");
    }

    const totalPages = pages * copies;

    const printingMinutes = Math.ceil(
        totalPages / printerSpeed
    );

    const handlingMinutes = 2;

    return {
        printingMinutes,
        handlingMinutes,
        totalDuration: printingMinutes + handlingMinutes
    };
};

module.exports = { calculateDuration };
