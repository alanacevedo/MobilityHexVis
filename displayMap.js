import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as d3Tile from "https://cdn.jsdelivr.net/npm/d3-tile@1/+esm"

import { accessToken } from "./static.js"
const url = (x, y, z) => `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/${z}/${x}/${y}?access_token=${accessToken}`

const height = 600
const width = 600

const svg = d3.select("#canvas")

const tile = d3Tile.tile()
      .extent([[0, 0], [width, height]])
      .tileSize(512)
      .clampX(false);

const zoom = d3.zoom()
    .scaleExtent([1 << 8, 1 << 22])
    .extent([[0, 0], [width, height]])
    .on("zoom", ({transform}) => zoomed(transform));

let image = svg.append("g")
.attr("pointer-events", "none")
.selectAll("image");

svg
      .call(zoom)
      .call(zoom.transform, d3.zoomIdentity
        .translate(width >> 1, height >> 1)
        .scale(1 << 12));

  function zoomed(transform) {
    const tiles = tile(transform);

    image = image.data(tiles, d => d).join("image")
        .attr("xlink:href", d => url(...d3Tile.tileWrap(d)))
        .attr("x", ([x]) => (x + tiles.translate[0]) * tiles.scale)
        .attr("y", ([, y]) => (y + tiles.translate[1]) * tiles.scale)
        .attr("width", tiles.scale)
        .attr("height", tiles.scale);
  }