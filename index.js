import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { injectAllHTML } from "./js/injectHTML.js";
import { categories } from "./js/static.js";
import { loadData } from "./js/loadData.js";
import { displayDataToAllMaps } from "./js/displayPathsOnMap.js";
import { addTooltipDiv, addLeafletMaps } from "./js/utils/domFunctions.js";
import { updateSvgPaths } from "./js/utils/drawFunctions.js";
import { addMapRow } from "./js/addMapRow.js";


// Injects contents from .html files into index.html
injectAllHTML()
// Data initially displayed by large single
d3.select(".categoryCheckboxes").selectAll(".customCheckbox").property("checked", true)

// const allData = await loadData()

// adds a div that shows data for paths
addTooltipDiv()

// add leaflet maps to the respective divs
const maps = addLeafletMaps()

const pathFuncSelect = d3.select("#mapPathFuncSelect")



setTimeout(() => d3.select("#addRowButton").on("click", () => addMapRow(1)), 500)
/*

displayDataToAllMaps(maps, allData.rawData, pathFuncSelect.property("value"))


pathFuncSelect.on("change", e => {
    displayDataToAllMaps(maps, allData.rawData, pathFuncSelect.property("value"))
})

*/