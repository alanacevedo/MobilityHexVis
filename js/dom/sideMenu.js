import * as d3 from "d3";
import Picker from 'vanilla-picker';
import { hideLoadingOverlay, showLoadingOverlay } from "../utils/loadingOverlay"
import { updateHighlightColor, updateComunaBoundaryColor, updateMixturaColorScale } from "../map/draw/update";
import { AppState, updateData } from "../appState.js";
import { drawBoundariesChart, getChartData } from "../charts/boundaries/boundariesChart";
import { generateMaps } from "../map/mapControl";
import Chart from 'chart.js/auto';


function setupSideMenu() {
    const state = new AppState()
    setupHourRangeInput()
    updateBoundariesChart(state.getState("data"))
    setupCheckboxes()
    setupHexResolutionSelector()
    setupColorPickers()

}

function updateBoundariesChart(data) {
    const chartData = getChartData(data)
    const boundariesChartCtxNode = document.getElementById('myChart');

    const chart = Chart.getChart(boundariesChartCtxNode)
    if (chart) {
        chart.destroy()
    }

    drawBoundariesChart(boundariesChartCtxNode, chartData)
}

function setupHourRangeInput() {
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
}

function setupCheckboxes() {
    const state = new AppState()
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
}

function setupHexResolutionSelector() {
    const state = new AppState()
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
}

function setupColorPickers() {
    const state = new AppState()
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

function updateHexColorGradients() {
    const state = new AppState();
    const mapMatrix = state.getState("mapMatrix");
    const originColor = state.getState("originColor");
    const destinationColor = state.getState("destinationColor");

    // Flatten the mapMatrix and include the global map
    const allMaps = [...mapMatrix.flat(), state.getState("globalMap")];

    allMaps.forEach(map => {
        if (!map) return;
        const svg = d3.select(map.getPanes().overlayPane).select("svg");
        const defs = svg.select("defs");

        defs.selectAll("linearGradient").each(function () {
            const gradient = d3.select(this);
            gradient.select("stop:nth-child(1)")
                .attr("stop-color", originColor);
            gradient.select("stop:nth-child(2)")
                .attr("stop-color", destinationColor);
            gradient.select("stop:nth-child(3)")
                .attr("stop-color", destinationColor);
        });
    });
}

export { setupSideMenu }