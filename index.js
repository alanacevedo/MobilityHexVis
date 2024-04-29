import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { injectAllHTML } from "./js/injectHTML.js";
import { categories } from "./js/static.js";
import { loadData, loadRawODData } from "./js/loadData.js";
import { displayDataToAllMaps } from "./js/displayPathsOnMap.js";
import { addTooltipDiv, addLeafletMaps } from "./js/utils/domFunctions.js";
import { updateSvgPaths } from "./js/utils/drawFunctions.js";
import { addMapRow, displayDataOnRow, removeMapRow } from "./js/addMapRow.js";


// Injects contents from .html files into index.html
injectAllHTML()
// Data initially displayed by large single
d3.select(".categoryCheckboxes").selectAll(".customCheckbox").property("checked", true)

// adds a div that shows data for paths
addTooltipDiv()

// const allData = await loadData()
const data = await loadRawODData()

const [minDist, maxDist] = [data[0].distance, data.slice(-1)[0].distance]

const slices = [
    data.slice(0, 400),
    data.slice(400, 800),
    data.slice(800, 1200),
    data.slice(1200)
]

const mapMatrix = []

for (let i = 0; i < 4; i++) {
    addMapRow(i, mapMatrix)
}

for (let i = 0; i < 4; i++) {
    displayDataOnRow(slices[i], mapMatrix[i])
}

function handleBoundariesInput(string) {

    const numbers = string.split(" ").map(x => Number(x))
    const indexes = []

    for (const number of numbers) {
        if (isNaN(number) || (number <= minDist) || (number >= maxDist)) {
            console.error("input error")
            return
        }
        // búsqueda binaria, encontrar primer índice donde el valor sea mayor que number
        let [l, r] = [0, data.length]

        while (l < r) {
            const mid = (l + r) >> 1

            if (data[mid].distance < number) {
                l = mid + 1
            } else {
                r = mid
            }
        }

        // en l está el índice buscado
        indexes.push(l)
    }

    const slices = []
    let prevIndex = 0
    for (const index of indexes) {

    }

    removeMapRow(mapMatrix.length - 1, mapMatrix)

    console.log(mapMatrix)

}

function setListenersUp() {
    d3.select("#addRowButton").on("click", () => addMapRow(1, mapMatrix))

    const node = d3.select("#boundariesInput").node()
    node.setAttribute("placeholder", `Min: ${Number(minDist).toFixed(2)} Max: ${Number(maxDist).toFixed(2)}`)
    node.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
            handleBoundariesInput(e.target.value)
        }
    })
}

setTimeout(() => setListenersUp(), 500)