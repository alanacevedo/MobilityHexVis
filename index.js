import { injectAllHTML } from "./js/injectHTML.js";
import { addTooltipDiv, generateMaps } from "./js/utils/domFunctions.js";
import { hideLoadingOverlay, initializeLoadingOverlay, showLoadingOverlay } from "./js/utils/loadingOverlay.js";
import { setupSideMenu } from "./js/utils/domFunctions.js";
import { initializeState } from "./js/appState.js";
import "./js/plugins/tcrs-moving-tooltip.min.js"
import 'toolcool-range-slider';

initializeLoadingOverlay()
showLoadingOverlay()

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
    hideLoadingOverlay()
}, 500)