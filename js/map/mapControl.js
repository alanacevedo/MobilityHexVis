import * as d3 from "d3";
import { v4 } from "uuid"
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm'
import { updateSvgPaths } from "./draw/update.js";
import { drawH3Hexagons } from "./draw/hexagon.js";
import { drawComunaBoundaries } from "./draw/comuna.js";
import { getRangeStringsFromBoundaries } from "../utils/helperFunctions.js";
import { drawDistributionChart } from "../utils/charts/distribution/distributionChart.js";
import { getGroupPercentages } from "../utils/charts/distribution/utils.js";
import { AppState } from "../appState.js";
import { getBoundaryIndexesFromDistances } from "../utils/helperFunctions.js";
import { getDataByH3, getDataByGroup, getGiniIndexByH3 } from "./getData.js";
import { addMapRow, removeMapRow } from "../dom/maps.js";
import { createChartCanvasChild } from "../dom/chart.js";

const INITIAL_CENTER = [-33.471258, -70.646552]
const INITIAL_ZOOM = 9
const MAX_ZOOM = 12
const MIN_ZOOM = 8

const accessToken = import.meta.env.VITE_MAPBOX_TOKEN

// agregar un mapa leaflet en la división con id mapDiv. Esto no agrega los datos aún.
function addMap(mapDiv) {
    const map = L.map(mapDiv, { attributionControl: false, zoomControl: false, uuid: v4() })
        .setView(INITIAL_CENTER, INITIAL_ZOOM)

    L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${accessToken}`,
        { maxZoom: MAX_ZOOM, minZoom: MIN_ZOOM }
    ).addTo(map)

    L.svg({ clickable: true }).addTo(map)

    const overlay = d3.select(map.getPanes().overlayPane)
    const svg = overlay.select('svg').attr("pointer-events", "auto")

    // create a group that is hidden during zooming, because svg lines are updated after the zoom finishes
    svg.append('g').attr('class', 'leaflet-zoom-hide')


    map.on('zoomend', (e) => {
        setViewToAllMaps(map.getCenter(), map.getZoom())
        updateSvgPaths(map)
    })

    map.on("move", (e, d) => {
        setViewToAllMaps(map.getCenter(), map.getZoom(), map)
    })

    return map
}

// Muestra los datos en la fila de mapas correspondiente.
function displayDataOnRow(rowDataSlice, mapRow) {
    const dataByGroup = getDataByGroup(rowDataSlice)

    for (let i = 0; i < mapRow.length - 1; i++) {
        const map = mapRow[i]
        const groupData = dataByGroup[i + 1] ?? []
        const { dataByHex, hexSet } = getDataByH3(groupData)
        drawH3Hexagons(dataByHex, hexSet, map)
        drawComunaBoundaries(map)
    }

    const giniMap = mapRow[mapRow.length - 1]
    const giniDataByHex = getGiniIndexByH3(rowDataSlice)
    drawH3Hexagons(giniDataByHex, new Set(), giniMap)
    drawComunaBoundaries(giniMap)
}

function displayDataOnGlobalMap() {
    const state = new AppState()
    const data = state.getState("data")
    const { dataByHex, hexSet } = getDataByH3(data)
    const globalMap = state.getState("globalMap")
    drawH3Hexagons(dataByHex, hexSet, globalMap)
    drawComunaBoundaries(globalMap)
}

function setViewToAllMaps(center, zoom, originalMap) {
    const state = new AppState()
    const mapMatrix = state.getState("mapMatrix")
    const globalMap = state.getState("globalMap")

    for (const mapRow of mapMatrix) {
        if (!mapRow) continue;
        for (const map of mapRow) {
            if (map != originalMap)
                map.setView(center, zoom, { animate: false })
        }
    }

    if (globalMap && globalMap != originalMap) {
        globalMap.setView(center, zoom, { animate: false })
    }
}

function displayRows(rowDataSlices, boundaries, updateDistributionChart) {
    const state = new AppState()
    const mapMatrix = state.getState("mapMatrix")
    const rowCount = rowDataSlices.length

    const globalMapDiv = document.getElementById('globalMap');
    if (!globalMapDiv._leaflet_id) {
        const globalMap = addMap(globalMapDiv);
        state.setState("globalMap", globalMap);
    }

    displayDataOnGlobalMap()

    while (mapMatrix.length < rowCount) {
        addMapRow(mapMatrix.length)
    }

    while (mapMatrix.length > rowCount) {
        removeMapRow(mapMatrix.length - 1)
    }

    for (let i = 0; i < rowCount; i++) {
        displayDataOnRow(rowDataSlices[i], mapMatrix[i])
    }


    const rangeStrings = getRangeStringsFromBoundaries(boundaries)
    const distChartDivs = document.querySelectorAll(".distChartDiv")
    const appState = new AppState()
    const totalEntries = appState.getState("totalEntries")

    if (updateDistributionChart) {
        for (let i = 0; i < rowCount; i++) {
            const distChartCtxNode = createChartCanvasChild(distChartDivs[i])
            const rangeString = rangeStrings[i]
            const rowGroupPercentages = getGroupPercentages(rowDataSlices[i], totalEntries)
            drawDistributionChart(distChartCtxNode, rowGroupPercentages, rangeString)
        }
    }
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

export { generateMaps, addMap }