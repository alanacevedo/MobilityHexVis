import * as d3 from "d3";
import { getBoundaryIndexesFromDistances } from "./helperFunctions.js";
import { displayRows } from "./mapFunctions.js";
import { AppState, updateData } from "../appState.js";
import { drawBoundariesChart } from "./boundariesChart.js";
import { getChartData } from "./boundariesChart.js";
import Chart from 'chart.js/auto';




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
function setupSideMenu() {
    const state = new AppState()
    const startHour = state.getState("startHour")
    const endHour = state.getState("endHour")
    const dbscanMinPoints = state.getState("dbscanMinPoints")
    const dbscanMaxDistance = state.getState("dbscanMaxDistance")

    const hourRangeInputNode = d3.select("#hourRangeInput").node()
    hourRangeInputNode.value1 = startHour
    hourRangeInputNode.value2 = endHour

    hourRangeInputNode.addEventListener("change", e => {
        const [lower, higher] = [e.detail.value1, e.detail.value2].toSorted((a, b) => a - b)
        state.setState("startHour", lower)
        state.setState("endHour", higher)
    })

    hourRangeInputNode.addEventListener("onMouseUp", async (e) => {
        await updateData()
        updateChart(state.getState("data"))
        generateMaps()
    })

    updateChart(state.getState("data"))

    const dbscanMinPointsInputNode = d3.select("#dbscanMinPointsInput").node()
    dbscanMinPointsInputNode.value = dbscanMinPoints
    dbscanMinPointsInputNode.addEventListener("input", (e) => {
        state.setState("dbscanMinPoints", e.target.value)
        generateMaps()
    })

    const dbscanMaxDistanceInputNode = d3.select("#dbscanMaxDistanceInput").node()
    dbscanMaxDistanceInputNode.value = dbscanMaxDistance
    dbscanMaxDistanceInputNode.addEventListener("input", (e) => {
        state.setState("dbscanMaxDistance", e.target.value)
        generateMaps()
    })

    d3.select("#generateMapsButton").on("click", () => generateMaps())
}

function updateChart(data) {
    const chartData = getChartData(data)
    const boundariesChartCtxNode = document.getElementById('myChart');

    const chart = Chart.getChart("myChart")
    if (chart) {
        chart.destroy()
    }

    drawBoundariesChart(boundariesChartCtxNode, chartData)
}

function generateMaps() {

    const state = new AppState()
    const mapMatrix = state.getState("mapMatrix")
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

    displayRows(mapMatrix, rowDataSlices, boundaries)
}

export { addTooltipDiv, setupSideMenu, generateMaps }