
const optsPoolCode = [{ value: 'TEST_POOL_A', label: 'TEST_POOL_A' },
{ value: 'TEST_POOL_B', label: 'TEST_POOL_B' }];

export const colDefs = [
    {
        colIdx: 0,
        colName: "pk",
        visible: false,
        pk: true
    },
    {
        colName: "poolcode",
        header: "Pool Code",
        colIdx: 1,
        editable: true,
        type: 'select',
        options: optsPoolCode,
        required: true

    },
    {
        colName: "startdate",
        header: "Start Date",
        colIdx: 2,
        displayField: 'startdate',
        type: "date",
        required: true
    },
    {
        colName: "availablefrom",
        header: "Available From",
        colIdx: 3,
        type: "timestamp",
        required: true
    },
    {
        colName: "availableto",
        header: "Availble To",
        colIdx: 4,
        type: "timestamp",
        get: "checkAvailableDates"
    }
]

export const dataURL = "/ds?pAction=poolstartQueueData";