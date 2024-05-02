import * as d3 from "d3";
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm'
import { accessToken } from "../token.js";
import { categories, INITIAL_CENTER, INITIAL_ZOOM, MAX_ZOOM, LINK_COUNT_THRESHOLD } from "../static.js";
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

    const [minDist, maxDist] = [data[0].distance, data.slice(-1)[0].distance]

    d3.select("#generateMapsButton").on("click", () => generateMaps())

    const node = d3.select("#boundariesInput").node()
    node.setAttribute("placeholder", `Min: ${Number(minDist).toFixed(2)} Max: ${Number(maxDist).toFixed(2)}`)
    node.addEventListener("input", (e) => {
        state.setState("boundariesString", e.target.value)
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