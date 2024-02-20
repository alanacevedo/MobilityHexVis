import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as d3Tile from "https://cdn.jsdelivr.net/npm/d3-tile@1/+esm"
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm'

// https://bost.ocks.org/mike/leaflet/
// https://d3-graph-gallery.com/graph/bubblemap_leaflet_basic.html

import { accessToken } from "./static.js"
const url = (x, y, z) => `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/${z}/${x}/${y}?access_token=${accessToken}`

const INITIAL_CENTER = [-33.471258, -70.646552]
const INITIAL_ZOOM = 11
const MAX_ZOOM = 12

const map = L
  .map('map')
  .setView(INITIAL_CENTER, INITIAL_ZOOM); 

L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${accessToken}`,
      {maxZoom: MAX_ZOOM}
).addTo(map)

L.svg().addTo(map)

const markers = [
      {lat: -33.518213, lon: -70.742712}, 
      {lat:-33.442615, lon: -70.568191}, 
]

d3.select("#map")
 .select("svg")
 .selectAll("circles")
 .data(markers)
 .join("circle")
 .attr("cx", d => map.latLngToLayerPoint([d.lat, d.lon]).x)
 .attr("cy", d => map.latLngToLayerPoint([d.lat, d.lon]).y)
 .attr("r", 14)
 .style("fill", "red")
 .attr("stroke", "red")
 .attr("stroke-width", 3)
 .attr("fill-opacity", .4)

 function update() {
      d3.selectAll("circle")
        .attr("cx", d => map.latLngToLayerPoint([d.lat, d.lon]).x)
        .attr("cy", d => map.latLngToLayerPoint([d.lat, d.lon]).y)
    }

map.on("moveend", update)