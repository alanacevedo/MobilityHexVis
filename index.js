import { injectAllHTML } from "./js/injectHTML.js";
import { addTooltipDiv, generateMaps, addColorGradientSvg } from "./js/utils/domFunctions.js";
import { setupSideMenu } from "./js/utils/domFunctions.js";
import { initializeState } from "./js/appState.js";
import "./js/plugins/tcrs-moving-tooltip.min.js"
import 'toolcool-range-slider';

// Injects contents from .html files into index.html
injectAllHTML()

// adds a div that shows data for paths
addTooltipDiv()

// initializes state default values
await initializeState()

// displays maps with default values
generateMaps()

// timeout para que se pueda cargar recursivamente todo el HTML
setTimeout(() => {
    setupSideMenu()
}, 500)