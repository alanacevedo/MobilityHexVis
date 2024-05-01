import * as d3 from "d3";
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm'
import { categories, INITIAL_CENTER, INITIAL_ZOOM, MAX_ZOOM, LINK_COUNT_THRESHOLD } from "./static.js";
import { accessToken } from "./token.js";
import { setDataSettingsOnMap, updateSvgPaths } from "./utils/drawFunctions.js";


const MAPS_PER_ROW = 5

function addMapRow(insertionIndex, mapMatrix) {
    const container = d3.select("#rowsContainer")
    const mapRows = container.selectAll(".mapRow")
    const referenceRowDiv = mapRows.filter((d, i) => i === insertionIndex)

    const newRowClasses = ["mapRow", "mb-4", "row", "align-items-center", "justify-content-center"]
    const newRowDiv = document.createElement("div")
    newRowDiv.classList.add(...newRowClasses)

    container.node().insertBefore(newRowDiv, referenceRowDiv.node())

    const mapRow = []

    for (let i = 0; i < MAPS_PER_ROW; i++) {
        const colDiv = document.createElement("div")
        colDiv.classList.add("col-2")
        newRowDiv.appendChild(colDiv)
        if (i === MAPS_PER_ROW - 1) {
            colDiv.classList.add("ms-4") // left margin
        }

        const mapDiv = document.createElement("div")
        mapDiv.classList.add("leafletMap")
        colDiv.appendChild(mapDiv)

        const map = addMap(mapDiv, mapMatrix)
        mapRow.push(map)
    }

    // insert at a certain index?
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

function addMap(mapDiv, mapMatrix) {
    const map = L.map(mapDiv, { attributionControl: false, zoomControl: false })
        .setView(INITIAL_CENTER, INITIAL_ZOOM)

    L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${accessToken}`,
        { maxZoom: MAX_ZOOM }
    ).addTo(map)

    L.svg({ clickable: true }).addTo(map)

    const overlay = d3.select(map.getPanes().overlayPane)
    const svg = overlay.select('svg').attr("pointer-events", "auto")

    // create a group that is hidden during zooming, because svg lines are updated after the zoom finishes
    svg.append('g').attr('class', 'leaflet-zoom-hide')


    map.on('zoomend', () => {
        setViewToAllMaps(mapMatrix, map.getCenter(), map.getZoom())
        updateSvgPaths(map, "line")
    })

    map.on('mouseup', () => {
        setViewToAllMaps(mapMatrix, map.getCenter(), map.getZoom())
    })

    return map
}

function displayDataOnRow(data, mapRow) {
    const dataByGroup = getDataByGroup(data)

    for (let i = 0; i < mapRow.length - 1; i++) {
        const map = mapRow[i]
        const pathData = dataByGroup[i + 1] ?? []
        setDataSettingsOnMap(pathData, map)
        updateSvgPaths(map, "line")
    }
}

function getDataByGroup(data) {
    const dataByGroup = {}

    for (const entry of data) {
        const group = entry.group
        if (group in dataByGroup) {
            dataByGroup[group].push(entry)
        } else {
            dataByGroup[group] = [entry]
        }
    }

    return dataByGroup
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

function displayRows(mapMatrix, rows) {
    const rowCount = rows.length

    while (mapMatrix.length < rowCount) {
        addMapRow(mapMatrix.length, mapMatrix)
    }

    while (mapMatrix.length > rowCount) {
        removeMapRow(mapMatrix.length - 1, mapMatrix)
    }

    for (let i = 0; i < rowCount; i++) {
        displayDataOnRow(rows[i], mapMatrix[i])
    }
}

export { addMapRow, displayDataOnRow, removeMapRow, displayRows }