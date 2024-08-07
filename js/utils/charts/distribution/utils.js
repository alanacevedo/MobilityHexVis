function getGroupPercentages(data, globalTotal) {

    const groupCount = {}
    let total = 0


    data.forEach(flowObj => {
        const group = flowObj.group
        const count = flowObj.count

        if (!(group in groupCount)) {
            groupCount[group] = 0
        }

        groupCount[group] += count
        total += count
    })

    const groupPercentages = {
        group: {},
        global: {},
        rowPercentage: total / globalTotal * 100
    }

    Object.entries(groupCount).forEach(([key, val]) => {
        groupPercentages.group[key] = val / total * 100
        groupPercentages.global[key] = val / globalTotal * 100

    })

    return groupPercentages
}

function getTotalEntries(data) {
    let total = 0

    data.forEach(flowObj => {
        total += flowObj.count
    })

    return total
}

export { getGroupPercentages, getTotalEntries }