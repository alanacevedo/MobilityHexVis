import * as d3 from "d3";
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm'
import { INITIAL_CENTER, INITIAL_ZOOM, MAX_ZOOM, MIN_ZOOM } from "../static.js";
import { accessToken } from "../token.js";
import { setDataSettingsOnMap, updateSvgPaths, drawH3Hexagons } from "./drawFunctions.js";
import { addSimpsonIndexToFlow, addGiniIndexToFlow } from "./segregationIndexes.js";
import { getRangeStringsFromBoundaries } from "./helperFunctions.js";
import { getSnnFlowClusters } from "../clustering/snnFlowClustering.js";
import { drawDistributionChart } from "./charts/distribution/distributionChart.js";
import { AppState } from "../appState.js";
import { Chart } from "chart.js";
import { getGroupPercentages } from "./charts/distribution/utils.js";
import { v4 } from "uuid"

const MAPS_PER_ROW = 4

function addMapRow(insertionIndex, mapMatrix) {
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

        const map = addMap(mapDiv, mapMatrix)
        mapRow.push(map)
    }

    mapMatrix.splice(insertionIndex, 0, mapRow)
    return
}

function setViewToAllMaps(mapMatrix, center, zoom) {
    for (const mapRow of mapMatrix) {
        if (!mapRow) continue;
        for (const map of mapRow) {
            map.setView(center, zoom)
        }
    }
}

// agregar un mapa leaflet en la división con id mapDiv. Esto no agrega los datos aún.
function addMap(mapDiv, mapMatrix) {
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
        setViewToAllMaps(mapMatrix, map.getCenter(), map.getZoom())
        updateSvgPaths(map, "line")
    })

    map.on('mouseup', () => {
        setViewToAllMaps(mapMatrix, map.getCenter(), map.getZoom())
    })

    return map
}

// Muestra los datos en la fila de mapas correspondiente.
function displayDataOnRow(rowDataSlice, mapRow) {
    const dataByGroup = getDataByGroup(rowDataSlice)

    // TODO: Get count of distance 0 fluxes for each hexagon. Idea: mapa adicional en donde se muestre el gini de viajes internos.

    for (let i = 0; i < mapRow.length; i++) {
        const map = mapRow[i]
        const groupData = dataByGroup[i + 1] ?? []
        const dataByH3 = getDataByH3(groupData)
        drawH3Hexagons(dataByH3, map)


        //setDataSettingsOnMap(pathData, map)
        //updateSvgPaths(map, "line")
    }

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
    const dataByHex = {}

    for (const entry of data) {
        if (appState.getState("showOriginHex")) {
            const originHex = entry.h3_O
            if (!(originHex in dataByHex))
                dataByHex[originHex] = {}

            if (!('origin' in dataByHex[originHex]))
                dataByHex[originHex].origin = {
                    count: 0,
                    normGroup: 0,
                    normTotal: 0,
                }

            const originObj = dataByHex[originHex].origin
            originObj.count += entry.count
            originObj.normGroup += entry.normGroup
            originObj.normTotal += entry.normTotal
        }



        // código duplicado jijiiji
        if (appState.getState("showDestinationHex")) {
            const destinationHex = entry.h3_D
            if (!(destinationHex in dataByHex))
                dataByHex[destinationHex] = {}

            if (!('destination' in dataByHex[destinationHex]))
                dataByHex[destinationHex].destination = {
                    count: 0,
                    normGroup: 0,
                    normTotal: 0,
                }

            const destinationObj = dataByHex[destinationHex].destination
            destinationObj.count += entry.count
            destinationObj.normGroup += entry.normGroup
            destinationObj.normTotal += entry.normTotal
        }

    }

    return dataByHex
}

function removeMapRow(removalIndex, mapMatrix) {
    const container = d3.select("#rowsContainer")
    const mapRows = container.selectAll(".mapRow")
    const referenceRowDiv = mapRows.filter((d, i) => i === removalIndex)

    for (const map of mapMatrix[removalIndex]) {
        map.remove()
    }

    referenceRowDiv.node().remove()
    mapMatrix.splice(removalIndex, 1)
}

function displayRows(mapMatrix, rowDataSlices, boundaries) {
    const rowCount = rowDataSlices.length

    while (mapMatrix.length < rowCount) {
        addMapRow(mapMatrix.length, mapMatrix)
    }

    while (mapMatrix.length > rowCount) {
        removeMapRow(mapMatrix.length - 1, mapMatrix)
    }

    for (let i = 0; i < rowCount; i++) {
        displayDataOnRow(rowDataSlices[i], mapMatrix[i])
    }

    const rangeStrings = getRangeStringsFromBoundaries(boundaries)
    const distChartDivs = document.querySelectorAll(".distChartDiv")
    const appState = new AppState()
    const totalEntries = appState.getState("totalEntries")
    for (let i = 0; i < rowCount; i++) {
        const distChartCtxNode = createChartCanvasChild(distChartDivs[i])
        const rangeString = rangeStrings[i]
        const rowGroupPercentages = getGroupPercentages(rowDataSlices[i], totalEntries)
        drawDistributionChart(distChartCtxNode, rowGroupPercentages, rangeString)
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