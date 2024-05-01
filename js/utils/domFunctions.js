import * as d3 from "d3";
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm'
import { accessToken } from "../token.js";
import { categories, INITIAL_CENTER, INITIAL_ZOOM, MAX_ZOOM, LINK_COUNT_THRESHOLD } from "../static.js";
import { getBoundaryIndexesFromDistances } from "./helperFunctions.js";
import { displayRows } from "../mapFunctions.js";


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
function setListenersUp(mapMatrix, data) {
    const [minDist, maxDist] = [data[0].distance, data.slice(-1)[0].distance]

    d3.select("#addRowButton").on("click", () => addMapRow(1, mapMatrix))

    const node = d3.select("#boundariesInput").node()
    node.setAttribute("placeholder", `Min: ${Number(minDist).toFixed(2)} Max: ${Number(maxDist).toFixed(2)}`)
    node.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
            handleBoundariesInput(e.target.value, mapMatrix, data)
        }
    })
}

function handleBoundariesInput(string, mapMatrix, data) {

    let distances = string.split(" ").map(x => Number(x))
    if (string === "") {
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

export { addTooltipDiv, setListenersUp, handleBoundariesInput }