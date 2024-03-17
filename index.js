import { injectAllHTML } from "./js/injectHTML.js";
import { categories } from "./js/static.js";
import { displayGeneralMap } from "./js/displayGeneralMap.js";
import { loadKMeansData, loadRawData } from "./js/loadData.js";
import { displayMap } from "./js/displayMap.js";

injectAllHTML()

// Injects contents from .html files into index.html

const kMeansData = await loadKMeansData()
const rawData = await loadRawData()
const data = { kMeansData, rawData }
displayGeneralMap(data)

categories.forEach((cat) => displayMap(cat, data))

