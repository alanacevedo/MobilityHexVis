
// A partir de la data original, ordenada ascendentemente, y una o más distancias de boundary, también ordenadas ascendentemente,
// retorna los índices de aquellos datos donde la distancia es la primera en ser mayor que cada boundary entregado
function getBoundaryIndexesFromDistances(data, distances) {
    const [minDist, maxDist] = [data[0].distance, data.slice(-1)[0].distance]
    const indexes = []

    for (const distance of distances) {
        if (isNaN(distance) || (distance <= minDist) || (distance >= maxDist)) {
            console.error("input error")
            return []
        }
        // búsqueda binaria, encontrar primer índice donde el valor sea mayor que number
        let [l, r] = [0, data.length]

        while (l < r) {
            const mid = (l + r) >> 1

            if (data[mid].distance < distance) {
                l = mid + 1
            } else {
                r = mid
            }
        }

        // en l está el índice buscado
        indexes.push(l)
    }

    return indexes
}

function getRangeStringsFromBoundaries(boundaries) {
    const rangeStrings = []
    let prev = 0

    for (const curr of boundaries) {

        rangeStrings.push(`[${Number(prev).toFixed(1)}km - ${Number(curr.toFixed(1))}km)`)
        prev = curr
    }

    rangeStrings.push(`[${Number(prev).toFixed(1)}km - \u221e )`)


    return rangeStrings
}

export { getBoundaryIndexesFromDistances, getRangeStringsFromBoundaries }