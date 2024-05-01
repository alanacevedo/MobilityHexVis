import * as d3 from "d3";
import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm'


// projects latlong coordinates to leaflet map coordinates for drawing svg
// returns object {x: number, y: number}
function projectPoint(latlon, LMap) {
    return LMap.latLngToLayerPoint(new L.LatLng(latlon[0], latlon[1]))
}

function getPathFromLinkData(linkData, pathType, LMap) {
    const latlon_start = [linkData.lat_O, linkData.lon_O]
    const latlon_end = [linkData.lat_D, linkData.lon_D]
    const start = projectPoint(latlon_start, LMap)
    const end = projectPoint(latlon_end, LMap)
    const drawPathFunction = drawPathFunctionMap[pathType]
    return drawPathFunction(start, end)

}

const drawPathFunctionMap = {
    line: drawLinePath,
    protoCurve: drawCurvedPath
}

function drawLinePath(start, end) {
    const line = d3.line().x(d => d.x).y(d => d.y)
    return line([start, end])
}

function drawCurvedPath(start, end) {
    // Usa curva de Bézier cuadrática, podría usar otras más complicadas.
    // https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths

    const midPoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
    const xDif = (end.x - start.x)
    const yDif = (end.y - start.y)
    const theta = Math.atan2(yDif, xDif)
    const distance = Math.sqrt((xDif * xDif) + (yDif * yDif))
    const offset = distance * 0.35
    const controlPoint = {
        x: midPoint.x + (offset * Math.cos(theta + Math.PI / 2)),
        y: midPoint.y + (offset * Math.sin(theta + Math.PI / 2))
    }

    // Calculate arrowhead points
    const angle = Math.atan2(end.y - controlPoint.y, end.x - controlPoint.x);

    // Define the length of the arrowhead (adjust as needed)
    // Define the length of the arrowhead and the fraction to subtract from the endpoint
    const arrowLength = 20;
    const arrowStartFraction = 0.3; // Adjust as needed

    // Calculate the adjusted endpoint for the arrowhead, a little before actual edge end
    const adjustedEnd = {
        x: end.x - arrowStartFraction * arrowLength * Math.cos(angle),
        y: end.y - arrowStartFraction * arrowLength * Math.sin(angle)
    };

    // Calculate the coordinates of the points of the arrowhead
    const arrowheadPointFront = {
        x: adjustedEnd.x - arrowLength * Math.cos(angle),
        y: adjustedEnd.y - arrowLength * Math.sin(angle)
    };

    // Define the angle offset for the points to the left and right of the front point
    const angleOffset = Math.PI / 8; // Adjust as needed

    // Calculate the coordinates of the points to the left and right of the front point
    const arrowheadPoint1 = {
        x: adjustedEnd.x - arrowLength * Math.cos(angle + angleOffset),
        y: adjustedEnd.y - arrowLength * Math.sin(angle + angleOffset)
    };

    const arrowheadPoint2 = {
        x: adjustedEnd.x - arrowLength * Math.cos(angle - angleOffset),
        y: adjustedEnd.y - arrowLength * Math.sin(angle - angleOffset)
    };
    // Construct the path string
    const pathString = `M ${start.x} ${start.y} Q ${controlPoint.x} ${controlPoint.y}, ${end.x} ${end.y}`;

    // Add arrowhead to the path string
    const arrowheadPath = `L ${arrowheadPoint1.x} ${arrowheadPoint1.y} L ${arrowheadPointFront.x} ${arrowheadPointFront.y} L ${arrowheadPoint2.x} ${arrowheadPoint2.y} L ${end.x} ${end.y}`;

    return pathString + arrowheadPath;
}

export { getPathFromLinkData, projectPoint }