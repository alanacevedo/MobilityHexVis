
// http://www.countrysideinfo.co.uk/simpsons.htm
function addSimpsonIndexToFlow(flow) {
    let total = 0
    let partial_sum = 0

    for (const group in flow.counts) {
        const n = flow.counts[group]
        total += n
        partial_sum += n * (n - 1)
    }

    const d_index = partial_sum / (total * (total - 1))

    flow.index = 1 - d_index
    flow.total = total
}

export { addSimpsonIndexToFlow } 