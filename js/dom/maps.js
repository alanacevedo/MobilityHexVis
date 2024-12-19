import * as d3 from "d3";
import { AppState } from "@js/appState.js";
import { addMap } from "@js/map/mapControl.js";

const MAPS_PER_ROW = 5

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

export { addMapRow, removeMapRow }