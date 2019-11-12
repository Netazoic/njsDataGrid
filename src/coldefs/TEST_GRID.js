
export const colDefs = [
    { colName: "name", colHdr: "Hero Name", colIdx: 0 },
    { colName: "power", colHdr: "Power", colIdx: 1 },
    {
        colName: "birthdate",
        colHdr: "DOB",
        colIdx: 1,
        type: "date",
        editable: false
    },
];

export const dataDef = [
    { name: "Chuck Norris", power: Infinity, birthdate: "1-1-1" },
    { name: "Bruce Lee", power: 9000, birthdate: "1967-1-1" },
    { name: "Jackie Chan", power: 7000, birthdate: "1990-1-1" },
    { name: "Jet Li", power: 8000, birthdate: "1992-1-1" }
]

export const dataURL = "/ds?pAction=poolstartQueueData";