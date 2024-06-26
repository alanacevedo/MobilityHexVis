function getGroupPercentages(data) {
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

    const groupPercentages = {}
    Object.entries(groupCount).forEach(([key, val]) => {
        groupPercentages[key] = val / total * 100
    })

    return groupPercentages
}

export { getGroupPercentages }