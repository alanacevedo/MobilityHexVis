import { injectAllHTML } from "./js/injectHTML.js";
import { displayMap } from "./js/displayMap.js";
import { loadKMeansData, loadRawData } from "./js/loadData.js";

injectAllHTML()

// Injects contents from .html files into index.html

const kMeansData = await loadKMeansData()
const rawData = await loadRawData()
const data = { kMeansData, rawData }
displayMap(data)


