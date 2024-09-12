
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


    if (flow.index > 0) {
        console.log(flow)
    }
}

function getGiniIndex(counts) {
    /**
     * Calcula el índice de Gini a partir de un objeto 'counts' donde las llaves 
     * corresponden a cuartiles socioeconómicos (u otras categorías) y los valores 
     */

    // Convertir el objeto counts en un array de pares [key, value] y ordenarlo por las llaves (cuartiles)
    const entries = Object.entries(counts).sort((a, b) => a[0] - b[0]);

    // Número total de observaciones
    const n = entries.reduce((sum, [, count]) => sum + count, 0);

    let numerator = 0; // Acumulará el valor ponderado por la posición
    let cumulativeCount = 0; // Acumulará el número de ocurrencias hasta la posición actual
    let cumulativeValue = 0; // Acumulará la suma de los valores multiplicados por sus ocurrencias

    // Recorrer las entradas para calcular las sumas necesarias
    for (let i = 0; i < entries.length; i++) {
        const [value, count] = entries[i]; // Destructurar para obtener el valor (cuartil) y su ocurrencia (count)

        cumulativeCount += count; // Acumular el número de ocurrencias
        numerator += cumulativeCount * value * count; // Sumar el producto ponderado por la posición
        cumulativeValue += value * count; // Sumar los valores multiplicados por sus ocurrencias
    }

    // https://en.wikipedia.org/wiki/Gini_coefficient#Alternative_expressions
    const gini = 1 - (2 / (n - 1)) * (n - numerator / cumulativeValue);


    if (!(gini >= 0 && gini <= 1)) console.error("Gini inválido", gini, flow)

    return gini
}


export { addSimpsonIndexToFlow, getGiniIndex } 