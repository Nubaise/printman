const AppError = require("../utils/AppError");

const PRICES = {
    BW: 1,
    COLOR: 8,
    SPIRAL_BINDING: 30
};

const calculatePrice = ({
    pages,
    copies,
    type,
    binding
}) => {

    const rate = PRICES[type];

    if (!rate) {
        throw new AppError("Invalid printing type", 400);
    }

    if (!Number.isInteger(pages) || pages <= 0) {
        throw new AppError("Pages must be a positive integer", 400);
    }

    if (!Number.isInteger(copies) || copies <= 0) {
        throw new AppError("Copies must be a positive integer", 400);
    }

    const printingCost = pages * copies * rate;

    const bindingCost = binding
        ? copies * PRICES.SPIRAL_BINDING
        : 0;

    return {
        printingCost,
        bindingCost,
        totalPrice: printingCost + bindingCost
    };
};

module.exports = { calculatePrice };

