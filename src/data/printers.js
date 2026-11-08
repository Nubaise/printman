const printers = [
    {
        id: "P1",
        name: "Printer 1",
        type: "BW",
        speed: 30,
        capabilities: {
            singleSided: true,
            doubleSided: true,
            color: false
        },
        reliability: "HIGH",
        status: "ACTIVE"
    },
    {
        id: "P2",
        name: "Printer 2",
        type: "BW",
        speed: 20,
        capabilities: {
            singleSided: true,
            doubleSided: true,
            color: false
        },
        reliability: "LOW",
        status: "ACTIVE"
    },
    {
        id: "P3",
        name: "Printer 3",
        type: "COLOR",
        speed: 10,
        capabilities: {
            singleSided: true,
            doubleSided: false,
            color: true
        },
        reliability: "HIGH",
        status: "ACTIVE"
    }
];

module.exports = printers;
