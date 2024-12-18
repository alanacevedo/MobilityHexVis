function createChartCanvasChild(distChartDiv) {
    distChartDiv.innerHTML = ""
    /*
    memleak?
    quizás debería encontrar el canvas chart node con Chart.getChart y luego chart.destroy()
    */

    const distChartCtxNode = document.createElement("canvas")
    distChartCtxNode.classList.add("distChartCanvas")
    distChartCtxNode.style.height = "100%"
    distChartCtxNode.style.width = "100%"
    distChartDiv.appendChild(distChartCtxNode)

    return distChartCtxNode
}

export { createChartCanvasChild }