import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm'
import { categories, INITIAL_CENTER, INITIAL_ZOOM, MAX_ZOOM, LINK_COUNT_THRESHOLD } from "../js/static.js";
import { accessToken } from "../js/token.js";



const MAPS_PER_ROW = 4

function addMapRow(insertionIndex) {
    const container = d3.select("#rowsContainer")
    const mapRows = container.selectAll(".mapRow")
    const referenceElement = mapRows.filter((d, i) => i === insertionIndex)

    const newRowClasses = ["mapRow", "mb-4", "row", "align-items-center", "justify-content-center"]
    const newRowDiv = document.createElement("div")
    newRowDiv.classList.add(...newRowClasses)

    container.node().insertBefore(newRowDiv, referenceElement.node())

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

        addMap(mapDiv)
    }

}

function addMap(mapDiv) {
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

    return map
}

export { addMapRow }