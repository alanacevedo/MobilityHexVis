import * as d3 from "d3";
import { getBoundaryIndexesFromDistances } from "./helperFunctions.js";
import { displayRows } from "./mapFunctions.js";
import { AppState } from "../appState.js";


function addTooltipDiv() {
    d3.select("body").append('div')
        .attr('class', 'tooltip')
        .style("position", "absolute")
        .style("z-index", "1000")
        .attr('width', 200)
        .attr('height', 200)
        .attr('id', 'tooltip')
}

// Define cómo actuan ciertos elementos del dom ante eventos.
function setListenersUp() {
    const state = new AppState()
    const data = state.getState("data")
    const dbscanMinPoints = state.getState("dbscanMinPoints")
    const dbscanMaxDistance = state.getState("dbscanMaxDistance")

    const [minDist, maxDist] = [data[0].distance, data.slice(-1)[0].distance]

    d3.select("#generateMapsButton").on("click", () => generateMaps())

    const boundariesInputNode = d3.select("#boundariesInput").node()
    boundariesInputNode.setAttribute("placeholder", `Min: ${Number(minDist).toFixed(2)} Max: ${Number(maxDist).toFixed(2)}`)
    boundariesInputNode.addEventListener("input", (e) => {
        state.setState("boundariesString", e.target.value)
    })

    const dbscanMinPointsInputNode = d3.select("#dbscanMinPointsInput").node()
    dbscanMinPointsInputNode.value = dbscanMinPoints
    dbscanMinPointsInputNode.addEventListener("input", (e) => {
        state.setState("dbscanMinPoints", e.target.value)
    })

    const dbscanMaxDistanceInputNode = d3.select("#dbscanMaxDistanceInput").node()
    dbscanMaxDistanceInputNode.value = dbscanMaxDistance
    dbscanMaxDistanceInputNode.addEventListener("input", (e) => {
        state.setState("dbscanMaxDistance", e.target.value)
    })
}

function generateMaps() {

    const state = new AppState()
    const boundariesString = state.getState("boundariesString")
    const mapMatrix = state.getState("mapMatrix")
    const data = state.getState("data")

    let distances = boundariesString.split(" ").map(x => Number(x))
    if (boundariesString === "") {
        distances = []
    }

    const rowDataSlices = []
    let prevIndex = 0

    const indexes = getBoundaryIndexesFromDistances(data, distances)

    for (const index of indexes) {
        rowDataSlices.push(data.slice(prevIndex, index))
        prevIndex = index
    }
    rowDataSlices.push(data.slice(prevIndex))

    displayRows(mapMatrix, rowDataSlices)
}

export { addTooltipDiv, setListenersUp, generateMaps }