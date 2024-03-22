import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm'
import { accessToken } from "../token.js";
import { categories, INITIAL_CENTER, INITIAL_ZOOM, MAX_ZOOM, LINK_COUNT_THRESHOLD } from "../static.js";


function addTooltipDiv() {
    d3.select("body").append('div')
        .attr('class', 'tooltip')
        .style("position", "absolute")
        .style("z-index", "1000")
        .attr('width', 200)
        .attr('height', 200)
        .attr('id', 'tooltip')
}

function addLeafletMaps() {
    const maps = {}

    categories.concat(["largeSingle"]).forEach((cat) => {
        maps[cat] = addLeafletMap(cat)
    })

    return maps
}

// TODO: Credit Leaflet in About section
function addLeafletMap(cat) {
    const capitalizedCat = cat.charAt(0).toUpperCase() + cat.slice(1)
    const map = L.map('map' + capitalizedCat, { attributionControl: false }).setView(INITIAL_CENTER, INITIAL_ZOOM)
    L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${accessToken}`,
        { maxZoom: MAX_ZOOM }
    ).addTo(map)

    L.svg({ clickable: true }).addTo(map)

    const overlay = d3.select(map.getPanes().overlayPane)
    const svg = overlay.select('svg').attr("pointer-events", "auto")

    // create a group that is hidden during zooming, because svg lines are updated after the zoom finishes
    svg.append('g').attr('class', 'leaflet-zoom-hide')
    return map
}

export { addTooltipDiv, addLeafletMaps }