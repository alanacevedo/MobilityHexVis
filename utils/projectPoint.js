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

    // Usa curva de Bézier cuadrática, podría usar otras más complicadas.
    // https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths

    const midPoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
    const xDif = (end.x - start.x)
    const yDif = (end.y - start.y)
    const theta = Math.atan(yDif / xDif)
    const distance = Math.sqrt((xDif * xDif) + (yDif * yDif))
    const offset = distance * 0.3
    const controlPoint = {
        x: midPoint.x + (offset * Math.cos(theta + Math.PI / 2)),
        y: midPoint.y + (offset * Math.sin(theta + Math.PI / 2))
    }


    return `M ${start.x} ${start.y}  Q ${controlPoint.x} ${controlPoint.y}, ${end.x} ${end.y}`
}

export { getPathFromLinkData }