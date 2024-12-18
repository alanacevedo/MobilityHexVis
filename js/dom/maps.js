import { getBoundaryIndexesFromDistances } from "../utils/helperFunctions.js";
import { displayRows } from "../utils/mapFunctions.js";
import { AppState } from "../appState.js";



function generateMaps({ updateDistributionChart = true } = {}) {

    const state = new AppState()
    const data = state.getState("data")
    const boundaries = state.getState("boundaries").toSorted((x, y) => (x - y))

    const rowDataSlices = []
    let prevIndex = 0

    const indexes = getBoundaryIndexesFromDistances(data, boundaries)

    for (const index of indexes) {
        rowDataSlices.push(data.slice(prevIndex, index))
        prevIndex = index
    }
    rowDataSlices.push(data.slice(prevIndex))

    displayRows(rowDataSlices, boundaries, updateDistributionChart)
}

export { generateMaps }