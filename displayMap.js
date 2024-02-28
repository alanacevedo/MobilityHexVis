import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as d3Tile from "https://cdn.jsdelivr.net/npm/d3-tile@1/+esm"
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm'

// https://bost.ocks.org/mike/leaflet/
// https://d3-graph-gallery.com/graph/bubblemap_leaflet_basic.html

import { accessToken, VanAreas } from "./static.js"

const INITIAL_CENTER = [-33.471258, -70.646552]
const INITIAL_ZOOM = 11
const MAX_ZOOM = 12

const map = L.map('map').setView([49.2527, -123.1207], 11.5);


const osmLayer = L.tileLayer(
    `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${accessToken}`,
    { maxZoom: MAX_ZOOM }
).addTo(map)

L.svg({clickable:true}).addTo(map)

const overlay = d3.select(map.getPanes().overlayPane)
const svg = overlay.select('svg').attr("pointer-events", "auto")
  // create a group that is hidden during zooming
const g = svg.append('g').attr('class', 'leaflet-zoom-hide')

// Use Leaflets projection API for drawing svg path (creates a stream of projected points)
const projectPoint = function(x, y) {
    const point = map.latLngToLayerPoint(new L.LatLng(y, x))
    this.stream.point(point.x, point.y)
  }
  
// Use d3's custom geo transform method to implement the above
const projection = d3.geoTransform({point: projectPoint})
// creates geopath from projected points (SVG)
const pathCreator = d3.geoPath().projection(projection)

// lonlat
const link = [[[-123.167556, 49.235430], [-123.068615, 49.245292]]]

let areaPaths, line

// Function to place svg based on zoom
const initialize = (data) => {
    areaPaths = g.selectAll('path')
    .data(VanAreas.features)
    .join('path')
    .attr('fill-opacity', 0.3)
    .attr('stroke', 'black')
    .attr("z-index", 3000)
    .attr('stroke-width', 2.5)
    .attr("class", "leaflet-interactive")
    .on("mouseover", function(d){
                d3.select(this).attr("fill", "red")
            })
    .on("mouseout", function(d){
                d3.select(this).attr("fill", "black")
            })
    

    line = g.selectAll("linePath")
    .data(link)
    .join("path")
    .style("fill", "none")
    .style("stroke", "orange")
    .style("stroke-width", 7)

    map.on('zoomend', update)
    map.on("moveend", update)

    update()
}

const update = () => {
    areaPaths.attr('d', pathCreator)
    line.attr("d", function(d) {
        return pathCreator({
            
            "type": "LineString",
            "coordinates": d
        })
    })
  }

d3.csv("/data/trips_by_category.csv", (d) => {
    d = d3.autoType(d)
    return d.count > 15 ? d : null
})
.then((data) => {
    console.log(data)
    initialize()
})

  // reset whenever map is moved or zoomed
  
  

