import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm'

// projects latlong coordinates to leaflet map coordinates for drawing svg
// returns object {x: number, y: number}
function projectPoint(lat, lon, LMap) {
    return LMap.latLngToLayerPoint(new L.LatLng(lat, lon))
}

// receives an array of links and adds the corresponding x, y, fx, fy attributes in-place.
// fx and fy are to fix nodes so they dont move with the simulation.
// https://d3js.org/d3-force/simulation#simulation_nodes

function addProjectionsToLinks(links, LMap) {
    links.forEach((link) => {
        const startProjection = projectPoint(link.lat_start, link.lon_start, LMap, L)
        const endProjection = projectPoint(link.lat_end, link.lon_end, LMap, L)
        const [startX, startY, endX, endY] = [startProjection.x, startProjection.y, endProjection.x, endProjection.y]

        link.startX = startX
        link.startY = startY
        link.endX = endX
        link.endY = endY
    })
}

export { projectPoint, addProjectionsToLinks }