import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

import { categories } from "./static.js";
import { updateSvgPaths, setDataSettingsOnMap } from "./utils/drawFunctions.js";

function displayDataToAllMaps(maps, givenData, displayTypeString) {
    if (displayTypeString === "forceDirected") {
        displayForceDirectedToAllMaps(maps, givenData)
        return
    }

    defaultDisplayDataToAllMaps(maps, givenData, displayTypeString)
}

function defaultDisplayDataToAllMaps(maps, givenData, displayTypeString) {
    // Set the data to be displayed in each map

    const largeSingleMap = maps["largeSingle"]

    categories.forEach((cat) => {
        const { data, maxCount } = givenData

        const map = maps[cat]
        const pathData = data[cat]

        setDataSettingsOnMap(cat, pathData, map)
        setDataSettingsOnMap(cat, pathData, largeSingleMap)

        // large single checkbox
        d3.select("#cbox" + cat).on("change", (e) => {
            const shouldDisplay = e.target.checked
            setDataSettingsOnMap(cat, shouldDisplay ? pathData : [], largeSingleMap)
            updateSvgPaths(largeSingleMap, displayTypeString)
        })

        // Display the data on each map
        updateSvgPaths(map, displayTypeString)
        map.on('zoomend', () => updateSvgPaths(map, displayTypeString))

    })

    updateSvgPaths(largeSingleMap, displayTypeString)
    largeSingleMap.on('zoomend', () => updateSvgPaths(largeSingleMap, displayTypeString))
}

function displayForceDirectedToAllMaps(maps, givenData) {
    const largeSingleMap = maps["largeSingle"]

    categories.forEach(cat => {
        const map = maps[cat]
        const g = d3.select(map.getPanes().overlayPane).select("svg").select("g")
        g.selectAll("path.cat" + cat)
            .data([])
            .join("path")
            .attr("class", "cat" + cat)
    })
}

export { displayDataToAllMaps }