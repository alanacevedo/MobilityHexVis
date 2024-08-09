import * as d3 from "d3";
import { getBoundaryIndexesFromDistances } from "./helperFunctions.js";
import { displayRows } from "./mapFunctions.js";
import { AppState, updateData } from "../appState.js";
import { drawBoundariesChart, getChartData } from "./charts/boundaries/boundariesChart.js";
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

    const chart = Chart.getChart(boundariesChartCtxNode)
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

function addColorGradientSvg() {
    const svg = d3.select("#color-scale");

    const width = svg.node().getBoundingClientRect().width; // Obtener el ancho dinámico del contenedor
    const height = 10; // Reducir la altura del rectángulo para que no ocupe mucho espacio vertical
    const margin = { left: 0, right: 0, top: 0, bottom: 0 };

    // Crear un grupo para la escala de color
    const gradientGroup = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Definir la escala de color secuencial
    const colorScale = d3.scaleSequential(d3.interpolateWarm)
        .domain([0, 1]);

    // Definir el gradiente en el SVG
    const defs = svg.append("defs");

    const gradient = defs.append("linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    // Añadir los pasos de color al gradiente
    for (let i = 20; i <= 100; i++) {
        gradient.append("stop")
            .attr("offset", `${i}%`)
            .attr("stop-color", colorScale(1 - (i / 100)));
    }

    // Dibujar el rectángulo con el gradiente de color
    gradientGroup.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "url(#gradient)");

    // Añadir etiquetas a los extremos de la escala
    gradientGroup.append("text")
        .attr("x", 0)
        .attr("y", height + 15)
        .attr("text-anchor", "start")
        .style("font-size", "12px")
        .text("Baja");

    gradientGroup.append("text")
        .attr("x", width)
        .attr("y", height + 15)
        .attr("text-anchor", "end")
        .style("font-size", "12px")
        .text("Alta");
}

export { addTooltipDiv, setupSideMenu, generateMaps, addColorGradientSvg }