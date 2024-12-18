import "./js/plugins/tcrs-moving-tooltip.min.js"
import 'toolcool-range-slider';

import { injectAllHTML } from "./js/dom/injectHTML.js";
import { generateMaps } from "./js/dom/maps.js";
import { hideLoadingOverlay, initializeLoadingOverlay, showLoadingOverlay } from "./js/utils/loadingOverlay.js";
import { setupSideMenu } from "./js/dom/sideMenu.js";
import { initializeState } from "./js/appState.js";
import { addColorGradientSvg } from "./js/dom/colorGradientSvg.js";


initializeLoadingOverlay()
showLoadingOverlay()

// Injects contents from .html files into index.html
injectAllHTML()

// initializes state default values
await initializeState()

// displays maps with default values
generateMaps()
addColorGradientSvg()

// timeout para que se pueda cargar recursivamente todo el HTML
setTimeout(() => {
    setupSideMenu()
    hideLoadingOverlay()
}, 500)