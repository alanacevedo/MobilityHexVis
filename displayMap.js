import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm'

import { accessToken } from "./static.js"

const INITIAL_CENTER = [-33.471258, -70.646552]
const INITIAL_ZOOM = 11
const MAX_ZOOM = 12

const map = L.map('map').setView(INITIAL_CENTER, INITIAL_ZOOM);


const osmLayer = L.tileLayer(
    `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${accessToken}`,
    { maxZoom: MAX_ZOOM }
).addTo(map)

L.svg({ clickable: true }).addTo(map)

const overlay = d3.select(map.getPanes().overlayPane)
const svg = overlay.select('svg').attr("pointer-events", "auto")
// create a group that is hidden during zooming
const g = svg.append('g').attr('class', 'leaflet-zoom-hide')

// Use Leaflets projection API for drawing svg path (creates a stream of projected points)
const projectPoint = function (x, y) {
    const point = map.latLngToLayerPoint(new L.LatLng(x, y))
    this.stream.point(point.x, point.y)
}

// Use d3's custom geo transform method to implement the above
const projection = d3.geoTransform({ point: projectPoint })
// creates geopath from projected points (SVG)
const pathCreator = d3.geoPath().projection(projection)

const colorMap = {
    abc1: "orange",
    c2: "red",
    c3: "green",
    d: "blue",
    e: "purple"
}

let line

// Function to place svg based on zoom
const initialize = (data) => {

    line = g.selectAll("linePath")
        .data(data)
        .join("path")
        .style("fill", "none")
        .style("stroke", (d) => (
            colorMap[d.category]
        ))
        .style("stroke-width", 1)

    map.on('zoomend', update)
    map.on("moveend", update)

    update()
}

const update = () => {
    line.attr("d", (d) => (
        pathCreator({

            "type": "LineString",
            "coordinates": [[d.lat_start, d.lon_start], [d.lat_end, d.lon_end]]
        }))
    )
}

d3.csv("/data/trips_by_category.csv", (d) => {
    d = d3.autoType(d)
    return d.count > 2 ? d : null
})
    .then((data) => {
        console.log(data)
        initialize(data)
    })

// reset whenever map is moved or zoomed



