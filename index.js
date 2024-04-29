import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { injectAllHTML } from "./js/injectHTML.js";
import { categories } from "./js/static.js";
import { loadData, loadRawODData } from "./js/loadData.js";
import { displayDataToAllMaps } from "./js/displayPathsOnMap.js";
import { addTooltipDiv, addLeafletMaps } from "./js/utils/domFunctions.js";
import { updateSvgPaths } from "./js/utils/drawFunctions.js";
import { addMapRow, displayDataOnRow } from "./js/addMapRow.js";


// Injects contents from .html files into index.html
injectAllHTML()
// Data initially displayed by large single
d3.select(".categoryCheckboxes").selectAll(".customCheckbox").property("checked", true)

// adds a div that shows data for paths
addTooltipDiv()

// const allData = await loadData()
const data = await loadRawODData()
const slices = [
    data.slice(0, 400),
    data.slice(400, 800),
    data.slice(800, 1200),
    data.slice(1200)
]

console.log(slices)

const mapMatrix = []

for (let i = 0; i < 4; i++) {
    addMapRow(i, mapMatrix)
}

for (let i = 0; i < 4; i++) {
    displayDataOnRow(slices[i], mapMatrix[i])
}



//const maps = addLeafletMaps()

const pathFuncSelect = d3.select("#mapPathFuncSelect")

setTimeout(() => d3.select("#addRowButton").on("click", () => addMapRow(1, mapMatrix)), 500)
/*

displayDataToAllMaps(maps, allData.rawData, pathFuncSelect.property("value"))


pathFuncSelect.on("change", e => {
    displayDataToAllMaps(maps, allData.rawData, pathFuncSelect.property("value"))
})

*/