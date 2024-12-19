import * as d3 from "d3";
import { AppState } from "../../appState";

function updateSvgPaths(map) {
    const g = d3.select(map.getPanes().overlayPane).select("svg").select("g")
    const zoom = map.getZoom()

    // Update hexagons
    g.selectAll("path.hexagon")
        .attr("d", d => {
            const pathData = d.hexBoundary.map(latLng => {
                const point = map.latLngToLayerPoint(L.latLng(latLng));
                return [point.x, point.y];
            });
            const lineGenerator = d3.line();
            return lineGenerator(pathData) + "Z";
        })
        .style("stroke-width", 0.5)

    // Update highlight hexagons
    g.selectAll("path.highlightHexagon")
        .attr("d", d => {
            const pathData = d.hexBoundary.map(latLng => {
                const point = map.latLngToLayerPoint(L.latLng(latLng));
                return [point.x, point.y];
            });
            const lineGenerator = d3.line();
            return lineGenerator(pathData) + "Z";
        })
        .style("stroke-width", 0.5)

    // Update comuna boundaries
    const projection = d3.geoTransform({
        point: function (lon, lat) {
            const point = map.latLngToLayerPoint(new L.LatLng(lat, lon));
            this.stream.point(point.x, point.y);
        }
    });

    const path = d3.geoPath().projection(projection);

    g.selectAll("path.comunaBoundary")
        .attr("d", path)
        .style("stroke-width", zoom / 8)

    g.selectAll("path.comunaFill")
        .attr("d", path)
}


function updateHighlightColor(newColor) {
    const state = new AppState();
    const mapMatrix = state.getState("mapMatrix");
    const globalMap = state.getState("globalMap");
    const allMaps = [...mapMatrix.flat(), globalMap].filter(Boolean);

    allMaps.forEach(map => {
        const svg = d3.select(map.getPanes().overlayPane).select("svg");
        svg.selectAll("path.highlightHexagon")
            .style("fill", newColor);
    });
}


function updateMixturaColorScale() {
    const state = new AppState();
    const mixturaColorScale = state.getState("mixturaColorScale") || d3.interpolateWarm;
    const colorScale = d3.scaleSequential(mixturaColorScale).domain([1, 0.5]);

    d3.select("#mixturaColorScalePicker")
        .style("background", `linear-gradient(to right, ${d3.range(0, 1, 0.01).map(t => mixturaColorScale(t)).join(',')})`);


    updateColorScaleSvg();
    // Update the color scale for all maps
    const allMaps = [...state.getState("mapMatrix").flat(), state.getState("globalMap")].filter(Boolean);
    allMaps.forEach(map => {
        const svg = d3.select(map.getPanes().overlayPane).select("svg");
        svg.selectAll("path.hexagon")
            .filter(d => d.gini !== undefined)
            .style("fill", d => colorScale(d.gini));
    });
}


function updateColorScaleSvg() {
    const svg = d3.select("#color-scale");

    // Get the current mixtura color scale
    const state = new AppState();
    const mixturaColorScale = state.getState("mixturaColorScale") || d3.interpolateWarm;

    // Update the gradient
    const gradient = svg.select("#mixturaGradient");
    gradient.selectAll("stop").remove();

    for (let i = 0; i <= 100; i++) {
        gradient.append("stop")
            .attr("offset", `${i}%`)
            .attr("stop-color", mixturaColorScale(i / 100)); // Remove the inversion
    }
}

function updateComunaBoundaryColor(newColor) {
    const state = new AppState();
    const mapMatrix = state.getState("mapMatrix");
    const globalMap = state.getState("globalMap");
    const allMaps = [...mapMatrix.flat(), globalMap].filter(Boolean);

    allMaps.forEach(map => {
        const svg = d3.select(map.getPanes().overlayPane).select("svg");
        svg.selectAll("path.comunaBoundary")
            .style("stroke", newColor);
    });
}

export { updateSvgPaths, updateHighlightColor, updateMixturaColorScale, updateComunaBoundaryColor }