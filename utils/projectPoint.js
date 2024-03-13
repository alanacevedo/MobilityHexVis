import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm'

const line = d3.line()
    .x(d => d.x)
    .y(d => d.y)

// projects latlong coordinates to leaflet map coordinates for drawing svg
// returns object {x: number, y: number}
function projectPoint(latlon, LMap) {
    return LMap.latLngToLayerPoint(new L.LatLng(latlon[0], latlon[1]))
}

function getPathFromLinkData(linkData, LMap) {
    const [latlon_start, latlon_end, count] = linkData
    const start = projectPoint(latlon_start, LMap)
    const end = projectPoint(latlon_end, LMap)
    return line([start, end])
}

export { getPathFromLinkData }