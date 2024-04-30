import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { injectAllHTML } from "./js/injectHTML.js";
import { loadRawODData } from "./js/loadData.js";
import { addTooltipDiv, handleBoundariesInput } from "./js/utils/domFunctions.js";
import { setListenersUp } from "./js/utils/domFunctions.js";


// Injects contents from .html files into index.html
injectAllHTML()

// adds a div that shows data for paths
addTooltipDiv()

const data = await loadRawODData()
const mapMatrix = []

handleBoundariesInput("", mapMatrix, data)
// timeout para que se pueda cargar recursivamente todo el HTML
setTimeout(() => setListenersUp(mapMatrix, data), 500)