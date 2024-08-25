import { injectAllHTML } from "./js/injectHTML.js";
import { addTooltipDiv, generateMaps, addColorGradientSvg } from "./js/utils/domFunctions.js";
import { setupSideMenu } from "./js/utils/domFunctions.js";
import { initializeState } from "./js/appState.js";
import { app } from "./firebase.js";
import "./js/plugins/tcrs-moving-tooltip.min.js"
import 'toolcool-range-slider';
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { deserializeBinary } from "./js/loadData.js";
import JSZip from "jszip";


// Injects contents from .html files into index.html
injectAllHTML()

const storage = getStorage();
const testRef = ref(storage, "h3_7/od_9_15_7.zip")

const url = await getDownloadURL(testRef)
console.log(url)

const response = await fetch(url);
if (!response.ok) {
    throw new Error('Failed to fetch binary file');
}
const blob = await response.blob();

const zipContent = await JSZip.loadAsync(blob);

const fileName = Object.keys(zipContent.files)[0];
const binaryArrayBuffer = await zipContent.files[fileName].async("arraybuffer");
console.log(binaryArrayBuffer)
deserializeBinary(binaryArrayBuffer)

// adds a div that shows data for paths
addTooltipDiv()
addColorGradientSvg()

// initializes state default values
await initializeState()

// displays maps with default values
generateMaps()

// timeout para que se pueda cargar recursivamente todo el HTML
setTimeout(() => {
    setupSideMenu()
}, 500)