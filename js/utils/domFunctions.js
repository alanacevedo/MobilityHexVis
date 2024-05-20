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
        .attr('id', 'tooltip')
}

// Define cómo actuan ciertos elementos del dom ante eventos.
function setupSideMenu() {
    const state = new AppState()
    const startHour = state.getState("startHour")
    const endHour = state.getState("endHour")
    const snnK = state.getState("snnK")

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

    const snnKInputNode = d3.select("#snnKInput").node()
    snnKInputNode.value = snnK
    snnKInputNode.addEventListener("input", (e) => {
        state.setState("snnK", e.target.value)
        generateMaps()
    })
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