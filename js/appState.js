import * as d3 from "d3"
import { loadODData, loadComunas, createComunaHexIndex, createHexIndex } from "./loadData"
import { getGroupPercentages, getTotalEntries } from "./utils/charts/distribution/utils"
let instance

// Singleton
class AppState {
    constructor() {
        if (instance) {
            return instance
        }

        this.state = {}
        instance = this
    }

    getState(key) {
        return this.state[key]
    }

    setState(key, value) {
        this.state[key] = value
    }
}

async function initializeState() {
    const state = new AppState()

    const comunas = await loadComunas()
    state.setState("comunas", comunas)

    state.setState("startHour", 5)
    state.setState("endHour", 12)
    state.setState("resolution", 7)
    state.setState("boundaries", [])
    state.setState("mapMatrix", [])
    state.setState("showOriginHex", true)
    state.setState("showDestinationHex", true)
    state.setState("showComunaBoundaries", false)
    state.setState("selectedH3s", new Set())
    state.setState("selectionMode", "hex")
    state.setState("originColor", "#00FFFF")
    state.setState("destinationColor", "#FF00FF")
    state.setState("highlightColor", "#FFFF00")
    state.setState("comunaBoundaryColor", "#FFFF00")
    state.setState("mixturaColorScale", d3.interpolateWarm)
    await updateData()
}

async function updateData() {
    const state = new AppState()
    const data = await loadODData(state.getState("startHour"), state.getState("endHour"), state.getState("resolution"))
    const hexIndex = createHexIndex(data);
    const comunas = state.getState("comunas")
    const [comunaHexIndex, hexComunaIndex] = createComunaHexIndex(comunas, data);
    const totalEntries = getTotalEntries(data)
    const baseGroupPercentages = getGroupPercentages(data, totalEntries)

    state.setState("data", data)
    state.setState("hexIndex", hexIndex)
    state.setState("comunaHexIndex", comunaHexIndex)
    state.setState("hexComunaIndex", hexComunaIndex)
    state.setState("baseGroupPercentages", baseGroupPercentages)
    state.setState("totalEntries", totalEntries)
}

export { AppState, initializeState, updateData }