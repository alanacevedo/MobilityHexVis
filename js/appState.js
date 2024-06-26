import { loadODData } from "./loadData"
import { getGroupPercentages } from "./utils/charts/distribution/utils"
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
    state.setState("boundaries", [])
    state.setState("mapMatrix", [])
    state.setState("snnK", 6)
    await updateData()
}

async function updateData() {
    const state = new AppState()
    const data = await loadODData(state.getState("startHour"), state.getState("endHour"))
    const baseGroupPercentages = getGroupPercentages(data)
    console.log(baseGroupPercentages)
    state.setState("data", data)
    state.setState("baseGroupPercentages", baseGroupPercentages)
}

export { AppState, initializeState, updateData }