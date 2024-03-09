import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/+esm'

// projects latlong coordinates to leaflet map coordinates for drawing svg
// returns object {x: number, y: number}
function projectPoint(lat, lon, LMap) {
    return LMap.latLngToLayerPoint(new L.LatLng(lat, lon))
}

export { projectPoint }