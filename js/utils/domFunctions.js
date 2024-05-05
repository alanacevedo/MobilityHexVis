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


    const startHourInputNode = d3.select("#startHourInput").node()
    startHourInputNode.value = startHour
    startHourInputNode.addEventListener("input", async (e) => { // no hay que hacerle await? Si ocurre un bug de sincronización revisar esto
        state.setState("startHour", e.target.value)
        await updateData()
        updateChart(state.getState("data"))
        generateMaps()
    })

    const endHourInputNode = d3.select("#endHourInput").node()
    endHourInputNode.value = endHour
    endHourInputNode.addEventListener("input", async (e) => {
        state.setState("endHour", e.target.value)
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

    displayRows(mapMatrix, rowDataSlices)
}

export { addTooltipDiv, setupSideMenu, generateMaps }