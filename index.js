import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { injectAllHTML } from "./js/injectHTML.js";
import { categories } from "./js/static.js";
import { loadData } from "./js/loadData.js";
import { displayPathsOnMap } from "./js/displayPathsOnMap.js";
import { addTooltipDiv, addLeafletMaps } from "./js/utils/domFunctions.js";
import { updateSvgPaths, getScales } from "./js/utils/drawFunctions.js";

// Injects contents from .html files into index.html
injectAllHTML()

// Data initially displayed by large single
d3.select(".categoryCheckboxes").selectAll(".customCheckbox").property("checked", true)

const allData = await loadData()

// adds a div that shows data for paths
addTooltipDiv()

// add leaflet maps to the respective divs
const maps = addLeafletMaps()

const largeSingleMap = maps["largeSingle"]

// Set the data to be displayed in each map
categories.forEach((cat) => {
    const { data, maxCount } = allData.kMeansData
    const scales = getScales(maxCount)
    const map = maps[cat]
    const pathData = data[cat]

    displayPathsOnMap(cat, pathData, map, scales)
    displayPathsOnMap(cat, pathData, largeSingleMap, scales)

    // large single checkbox
    d3.select("#cbox" + cat).on("change", (e) => {
        const shouldDisplay = e.target.checked
        displayPathsOnMap(cat, shouldDisplay ? pathData : [], largeSingleMap, scales)
        updateSvgPaths(largeSingleMap)
    })

})

// Display the data on each map
categories.concat(["largeSingle"]).forEach(cat => {
    const map = maps[cat]
    updateSvgPaths(map)
    map.on('zoomend', () => updateSvgPaths(map))
})



// used for selecting path creation function
const pathFuncSelect = d3.select("#mapPathFuncSelect")
pathFuncSelect.on("change", e => {
    categories.concat(["largeSingle"]).forEach(cat => updateSvgPaths(maps[cat]))
})

