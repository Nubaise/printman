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
        throw new Error("Invalid printing type");
    }

    if (!Number.isInteger(pages) || pages <= 0) {
        throw new Error("Pages must be a positive integer");
    }

    if (!Number.isInteger(copies) || copies <= 0) {
        throw new Error("Copies must be a positive integer");
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
