
const optsPoolCode = [{ value: 'TEST_POOL_A', label: 'TEST_POOL_A' },
{ value: 'TEST_POOL_B', label: 'TEST_POOL_B' }];

export const colDefs = [
    {
        colName: "poolcode",
        colHdr: "Pool Code",
        colIdx: 1,
        editable: true,
        type: 'select',
        options: optsPoolCode,
        required: true

    },
    {
        colName: "startdate",
        colHdr: "Start Date",
        colIdx: 2,
        displayField: 'startdate',
        type: "date",
        required: true
    },
    {
        colName: "availablefrom",
        colHdr: "Available From",
        colIdx: 3,
        type: "timestamp",
        required: true
    },
    {
        colName: "availableto",
        colHdr: "Availble To",
        colIdx: 4,
        type: "timestamp",
        get: "checkAvailableDates"
    }
]

export const dataURL = "/ds?pAction=poolstartQueueData";