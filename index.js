import { injectAllHTML } from "./js/injectHTML.js";
import { addTooltipDiv, generateMaps } from "./js/utils/domFunctions.js";
import { setListenersUp } from "./js/utils/domFunctions.js";
import { initializeState } from "./js/appState.js";

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
    setListenersUp()
}, 500)