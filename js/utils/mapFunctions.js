import * as d3 from "d3";
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm'
import { updateSvgPaths, drawH3Hexagons, drawComunaBoundaries } from "./drawFunctions.js";
import { getRangeStringsFromBoundaries } from "./helperFunctions.js";
import { drawDistributionChart } from "./charts/distribution/distributionChart.js";
import { AppState } from "../appState.js";
import { getGroupPercentages } from "./charts/distribution/utils.js";
import { v4 } from "uuid"
import { getGiniIndex } from "./segregationIndexes.js";

const MAPS_PER_ROW = 5
const INITIAL_CENTER = [-33.471258, -70.646552]
const INITIAL_ZOOM = 9
const MAX_ZOOM = 12
const MIN_ZOOM = 8

const accessToken = import.meta.env.VITE_MAPBOX_TOKEN

function addMapRow(insertionIndex) {
    const state = new AppState()
    const mapMatrix = state.getState("mapMatrix")
    const container = d3.select("#rowsContainer")
    const mapRows = container.selectAll(".mapRow")
    const referenceRowDiv = mapRows.filter((d, i) => i === insertionIndex)

    const newRowClasses = ["mapRow", "mb-4", "row", "align-items-center", "justify-content-center"]
    const newRowDiv = document.createElement("div")
    newRowDiv.classList.add(...newRowClasses)

    container.node().insertBefore(newRowDiv, referenceRowDiv.node())

    const mapRow = []

    const distributionColDiv = document.createElement("div")
    distributionColDiv.classList.add("col-2", "distChartDiv")
    newRowDiv.appendChild(distributionColDiv)

    // agregar los mapas leaflet, cada uno dentro de una div "col".
    // esto según el sistema de layout de bootstrap.
    for (let i = 0; i < MAPS_PER_ROW; i++) {
        const colDiv = document.createElement("div")
        colDiv.classList.add("col-2")
        newRowDiv.appendChild(colDiv)

        const mapDiv = document.createElement("div")
        mapDiv.classList.add("leafletMap")
        colDiv.appendChild(mapDiv)

        const map = addMap(mapDiv)
        mapRow.push(map)
    }

    mapMatrix.splice(insertionIndex, 0, mapRow)
    return
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

// agregar un mapa leaflet en la división con id mapDiv. Esto no agrega los datos aún.
export function addMap(mapDiv) {
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

function getDataByGroup(data) {
    const dataByGroup = {}

    for (const entry of data) {
        const group = entry.group
        if (!(group in dataByGroup)) {
            dataByGroup[group] = []
        }
        dataByGroup[group].push(entry)
    }

    return dataByGroup
}

function getDataByH3(data) {
    const appState = new AppState()
    const selectedH3s = appState.getState("selectedH3s")
    const hexIndex = appState.getState("hexIndex")
    const dataByHex = {}
    const hexSet = new Set()

    const showOriginHex = appState.getState("showOriginHex")
    const showDestinationHex = appState.getState("showDestinationHex")

    const processHex = (hexId, type, entry) => {
        if (!(hexId in dataByHex)) dataByHex[hexId] = {}
        if (!(type in dataByHex[hexId])) {
            dataByHex[hexId][type] = {
                count: 0,
                normGroup: 0,
                normTotal: 0,
            }
        }
        const hexObj = dataByHex[hexId][type]
        hexObj.count += entry.count
        hexObj.normGroup += entry.normGroup
        hexObj.normTotal += entry.normTotal
    }

    const processEntries = (entries) => {
        for (const entry of entries) {
            hexSet.add(entry.h3_O)
            hexSet.add(entry.h3_D)

            if (entry.distance === 0) continue

            if (showOriginHex && (
                selectedH3s.size === 0 ||
                (!selectedH3s.has(entry.h3_O) && selectedH3s.has(entry.h3_D))
            )) {
                processHex(entry.h3_O, 'origin', entry)
            }

            if (showDestinationHex && (
                selectedH3s.size === 0 ||
                (selectedH3s.has(entry.h3_O) && !selectedH3s.has(entry.h3_D))
            )) {
                processHex(entry.h3_D, 'destination', entry)
            }
        }
    }

    if (selectedH3s.size === 0) {
        processEntries(data)
    } else {
        const relevantEntries = new Set()
        for (const selectedH3 of selectedH3s) {
            const relatedEntries = hexIndex.get(selectedH3) || []
            relatedEntries.forEach(entry => {
                if (data.includes(entry)) {  // Only include entries that are in the current data slice
                    relevantEntries.add(entry)
                }
            })
        }
        processEntries([...relevantEntries])
    }

    // Ensure all hexagons in the current view are included in hexSet
    // this is to render the outlines of those hexagons that do not have any flow
    data.forEach(entry => {
        hexSet.add(entry.h3_O)
        hexSet.add(entry.h3_D)
    })

    return { dataByHex, hexSet }
}

function getGiniIndexByH3(data) {
    const giniByHex = {};
    const hexSet = new Set();

    for (const entry of data) {
        const { h3_O, h3_D, group, count, distance } = entry;

        // Ignore flows where distance is 0 (same origin and destination)
        if (distance === 0) continue;

        [h3_O, h3_D].forEach(h3 => {
            if (!giniByHex[h3]) giniByHex[h3] = { counts: {} };
            if (!giniByHex[h3].counts[group]) giniByHex[h3].counts[group] = 0;
            giniByHex[h3].counts[group] += count;
            hexSet.add(h3);
        });
    }

    Object.values(giniByHex).forEach(hex => {
        hex.gini = getGiniIndex(hex.counts)
    });

    return giniByHex;
}

function removeMapRow(removalIndex) {
    const state = new AppState()
    const mapMatrix = state.getState("mapMatrix")
    const container = d3.select("#rowsContainer")
    const mapRows = container.selectAll(".mapRow")
    const referenceRowDiv = mapRows.filter((d, i) => i === removalIndex)

    for (const map of mapMatrix[removalIndex]) {
        map.remove()
    }

    referenceRowDiv.node().remove()
    mapMatrix.splice(removalIndex, 1)
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

function createChartCanvasChild(distChartDiv) {
    distChartDiv.innerHTML = ""
    /*
    memleak?
    quizás debería encontrar el canvas chart node con Chart.getChart y luego chart.destroy()
    */

    const distChartCtxNode = document.createElement("canvas")
    distChartCtxNode.classList.add("distChartCanvas")
    distChartCtxNode.style.height = "100%"
    distChartCtxNode.style.width = "100%"
    distChartDiv.appendChild(distChartCtxNode)

    return distChartCtxNode
}

export { addMapRow, displayDataOnRow, removeMapRow, displayRows }