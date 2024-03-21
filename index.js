import { injectAllHTML } from "./js/injectHTML.js";
import { categories } from "./js/static.js";
import { displayLargeSingle } from "./js/displayLargeSingle.js";
import { loadData } from "./js/loadData.js";
import { displayMap } from "./js/displayMap.js";
import { addTooltipDiv, addLeafletMaps } from "./js/utils/domFunctions.js";

// Injects contents from .html files into index.html
injectAllHTML()

const data = await loadData()

// adds a div that shows data for paths
addTooltipDiv()

// add leaflet maps to the respective divs
const maps = addLeafletMaps()

displayLargeSingle(data, maps["largeSingle"])

categories.forEach((cat) => displayMap(cat, data, maps[cat]))

