import { loadODData, loadComunas } from "./loadData"
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

    state.setState("startHour", 5)
    state.setState("endHour", 12)
    state.setState("resolution", 7)
    state.setState("boundaries", [])
    state.setState("mapMatrix", [])
    state.setState("showOriginHex", true)
    state.setState("showDestinationHex", true)
    state.setState("showComunaBoundaries", false)
    state.setState("selectedH3s", new Set())
    await updateData()
}

async function updateData() {
    const state = new AppState()
    const { data, hexIndex } = await loadODData(state.getState("startHour"), state.getState("endHour"), state.getState("resolution"))
    const comunas = await loadComunas()
    const totalEntries = getTotalEntries(data)
    const baseGroupPercentages = getGroupPercentages(data, totalEntries)

    state.setState("data", data)
    state.setState("hexIndex", hexIndex)
    state.setState("baseGroupPercentages", baseGroupPercentages)
    state.setState("totalEntries", totalEntries)
    state.setState("comunas", comunas)
}

export { AppState, initializeState, updateData }