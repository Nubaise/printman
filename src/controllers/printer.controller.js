const printers = require("../data/printers");

const getPrinters = (req, res) => {
    return res.status(200).json({
        success: true,
        count: printers.length,
        data: printers
    });
};

module.exports = {
    getPrinters
};
