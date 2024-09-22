import * as d3 from "d3";
import Picker from 'vanilla-picker';
import { getBoundaryIndexesFromDistances } from "./helperFunctions.js";
import { displayRows } from "./mapFunctions.js";
import { AppState, updateData } from "../appState.js";
import { drawBoundariesChart, getChartData } from "./charts/boundaries/boundariesChart.js";
import Chart from 'chart.js/auto';
import { hideLoadingOverlay, showLoadingOverlay } from "./loadingOverlay.js";
import { updateHexColorGradients } from "./drawFunctions.js";
import { updateHighlightColor, updateComunaBoundaryColor, updateMixturaColorScale } from "./drawFunctions.js";

function addTooltipDiv() {
    d3.select("body").append('div')
        .attr('class', 'mapTooltip')
        .attr('id', 'mapTooltip')

}

// Define cómo actuan ciertos elementos del dom ante eventos.
function setupSideMenu() {
    const state = new AppState()
    const startHour = state.getState("startHour")
    const endHour = state.getState("endHour")

    const hourRangeInputNode = d3.select("#hourRangeInput").node()
    hourRangeInputNode.value1 = startHour
    hourRangeInputNode.value2 = endHour

    hourRangeInputNode.addEventListener("change", e => {
        const [lower, higher] = [e.detail.value1, e.detail.value2].toSorted((a, b) => a - b)
        state.setState("startHour", lower)
        state.setState("endHour", higher)
    })

    hourRangeInputNode.addEventListener("onMouseUp", async (e) => {
        showLoadingOverlay()
        await updateData()
        updateBoundariesChart(state.getState("data"))
        generateMaps()
        hideLoadingOverlay()
    })

    updateBoundariesChart(state.getState("data"))

    const showOriginCheckbox = d3.select("#showOriginHexCheckbox").node()
    showOriginCheckbox.checked = state.getState("showOriginHex")
    showOriginCheckbox.addEventListener("input", (e) => {
        state.setState("showOriginHex", e.target.checked)
        generateMaps({ updateDistributionChart: false })
    })

    const showDestinationCheckbox = d3.select("#showDestinationHexCheckbox").node()
    showDestinationCheckbox.checked = state.getState("showDestinationHex")
    showDestinationCheckbox.addEventListener("input", (e) => {
        state.setState("showDestinationHex", e.target.checked)
        generateMaps({ updateDistributionChart: false });
    })

    const showComunaBoundariesCheckbox = d3.select("#showComunaBoundariesCheckbox").node()
    showComunaBoundariesCheckbox.checked = state.getState("showComunaBoundaries")
    showComunaBoundariesCheckbox.addEventListener("input", (e) => {
        state.setState("showComunaBoundaries", e.target.checked)
        generateMaps({ updateDistributionChart: false });
    })

    const selectionModeCheckbox = d3.select("#selectionModeCheckbox").node()
    selectionModeCheckbox.checked = state.getState("selectionMode") === "comuna"
    selectionModeCheckbox.addEventListener("input", (e) => {
        state.setState("selectionMode", e.target.checked ? "comuna" : "hex")
        generateMaps({ updateDistributionChart: false });
    })

    const resolutionInput = d3.select("#resolutionInput").node()
    resolutionInput.value = state.getState("resolution")
    resolutionInput.onchange = async (e) => {
        showLoadingOverlay()
        state.setState("resolution", Number(e.target.value))
        state.setState("selectedH3s", new Set())
        await updateData()
        generateMaps({ updateDistributionChart: false });
        hideLoadingOverlay()
    }


    const originColorPickerNode = d3.select("#originColorPicker").node()
    const originColorPicker = new Picker({
        parent: originColorPickerNode,
        color: state.getState("originColor"),
        alpha: false,
        popup: 'top',
        onOpen: () => {
            const tooltip = bootstrap.Tooltip.getInstance(originColorPickerNode);
            if (tooltip) {
                tooltip.hide();
            }
        }
    })
    originColorPicker.onChange = (color) => {
        state.setState("originColor", color.hex)
        originColorPickerNode.style.backgroundColor = color.hex
        updateHexColorGradients()
    }
    originColorPickerNode.style.backgroundColor = state.getState("originColor")

    const destinationColorPickerNode = d3.select("#destinationColorPicker").node()
    const destinationColorPicker = new Picker({
        parent: destinationColorPickerNode,
        color: state.getState("destinationColor"),
        alpha: false,
        popup: 'top',
        onOpen: () => {
            const tooltip = bootstrap.Tooltip.getInstance(destinationColorPickerNode);
            if (tooltip) {
                tooltip.hide();
            }
        }
    })
    destinationColorPicker.onChange = (color) => {
        state.setState("destinationColor", color.hex)
        destinationColorPickerNode.style.backgroundColor = color.hex
        updateHexColorGradients()
    }
    destinationColorPickerNode.style.backgroundColor = state.getState("destinationColor")

    const highlightColorPickerNode = d3.select("#highlightColorPicker").node()
    const highlightColorPicker = new Picker({
        parent: highlightColorPickerNode,
        color: state.getState("highlightColor"),
        alpha: false,
        popup: 'top',
        onOpen: () => {
            const tooltip = bootstrap.Tooltip.getInstance(highlightColorPickerNode);
            if (tooltip) {
                tooltip.hide();
            }
        }
    })
    highlightColorPicker.onChange = (color) => {
        state.setState("highlightColor", color.hex)
        highlightColorPickerNode.style.backgroundColor = color.hex
        updateHighlightColor(color.hex);
    }
    highlightColorPickerNode.style.backgroundColor = state.getState("highlightColor")

    const comunaBoundaryColorPickerNode = d3.select("#comunaBoundaryColorPicker").node()
    const comunaBoundaryColorPicker = new Picker({
        parent: comunaBoundaryColorPickerNode,
        color: state.getState("comunaBoundaryColor"),
        alpha: false,
        popup: 'top',
        onOpen: () => {
            const tooltip = bootstrap.Tooltip.getInstance(comunaBoundaryColorPickerNode);
            if (tooltip) {
                tooltip.hide();
            }
        }
    })
    comunaBoundaryColorPicker.onChange = (color) => {
        state.setState("comunaBoundaryColor", color.hex)
        comunaBoundaryColorPickerNode.style.backgroundColor = color.hex
        updateComunaBoundaryColor(color.hex);
    }
    comunaBoundaryColorPickerNode.style.backgroundColor = state.getState("comunaBoundaryColor")

    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.forEach(tooltipTriggerEl => {
        new bootstrap.Tooltip(tooltipTriggerEl, {
            trigger: 'hover',
            placement: 'bottom'
        })
    })

    const mixturaColorScalePickerNode = d3.select("#mixturaColorScalePicker").node();
    const colorScales = [
        { name: 'Warm', scale: d3.interpolateWarm },
        { name: 'Plasma', scale: d3.interpolatePlasma },
        { name: 'Viridis', scale: d3.interpolateViridis },
        { name: 'Cool', scale: d3.interpolateCool },
        { name: 'Cividis', scale: d3.interpolateCividis },
        { name: 'Blues', scale: d3.interpolateBlues },
        { name: 'Greens', scale: d3.interpolateGreens },
        { name: 'Purples', scale: d3.interpolatePurples },

    ];

    const dropdown = d3.select("body")
        .append("div")
        .attr("class", "color-scale-dropdown");

    colorScales.forEach(scale => {
        dropdown.append("div")
            .attr("class", "color-scale-option")
            .style("background", `linear-gradient(to right, ${d3.range(0, 1, 0.01).map(t => scale.scale(t)).join(',')})`)
            .on("click", () => {
                state.setState("mixturaColorScale", scale.scale);
                updateMixturaColorScale();
                dropdown.style("display", "none");
            });
    });

    mixturaColorScalePickerNode.addEventListener("click", (event) => {
        const rect = mixturaColorScalePickerNode.getBoundingClientRect();
        dropdown.style("left", `${rect.left}px`)
            .style("top", `${rect.bottom}px`)
            .style("display", "block");
        event.stopPropagation();
    });

    document.addEventListener("click", () => {
        dropdown.style("display", "none");
    });

    updateMixturaColorScale();

}

function updateBoundariesChart(data) {
    const chartData = getChartData(data)
    console.log(chartData)
    const boundariesChartCtxNode = document.getElementById('myChart');

    const chart = Chart.getChart(boundariesChartCtxNode)
    if (chart) {
        chart.destroy()
    }

    drawBoundariesChart(boundariesChartCtxNode, chartData)
}

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

function addColorGradientSvg() {
    const svg = d3.select("#color-scale");
    const width = svg.node().getBoundingClientRect().width;
    const height = 10;
    const margin = { left: 0, right: 0, top: 0, bottom: 0 };

    // Clear existing content
    svg.selectAll("*").remove();

    // Create a group for the color scale
    const gradientGroup = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Get the current mixtura color scale
    const state = new AppState();
    const mixturaColorScale = state.getState("mixturaColorScale") || d3.interpolateWarm;

    // Define the gradient in the SVG
    const defs = svg.append("defs");

    const gradient = defs.append("linearGradient")
        .attr("id", "mixturaGradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    // Add color stops to the gradient
    for (let i = 0; i <= 100; i++) {
        gradient.append("stop")
            .attr("offset", `${i}%`)
            .attr("stop-color", mixturaColorScale(i / 100)); // Remove the inversion
    }

    // Draw the rectangle with the gradient
    gradientGroup.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "url(#mixturaGradient)");

    // Add labels to the ends of the scale
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

function updateColorScaleSvg() {
    const svg = d3.select("#color-scale");
    const width = svg.node().getBoundingClientRect().width;

    // Get the current mixtura color scale
    const state = new AppState();
    const mixturaColorScale = state.getState("mixturaColorScale") || d3.interpolateWarm;

    // Update the gradient
    const gradient = svg.select("#mixturaGradient");
    gradient.selectAll("stop").remove();

    for (let i = 0; i <= 100; i++) {
        gradient.append("stop")
            .attr("offset", `${i}%`)
            .attr("stop-color", mixturaColorScale(i / 100)); // Remove the inversion
    }
}

export { addTooltipDiv, setupSideMenu, generateMaps, addColorGradientSvg, updateColorScaleSvg }