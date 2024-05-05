import Chart from 'chart.js/auto';
import { AppState } from '../appState';
import { generateMaps } from './domFunctions';

const clickableLines = {
    id: "clickableLines",
    afterEvent(chart, args, pluginOptions) {

        if (args.event.type !== "click") {
            return
        }

        const clickX = args.event.x
        const delta = 4

        let removed = false

        const state = new AppState()
        const boundaries = state.getState("boundaries")

        boundaries.forEach((boundary, i) => {
            const xPixel = chart.scales.x.getPixelForValue(boundary)
            if (clickX - delta <= xPixel && xPixel <= clickX + delta && !removed) {
                boundaries.splice(i, 1)
                generateMaps()
                removed = true
            }
        })

        if (!removed) {
            boundaries.push(chart.scales.x.getValueForPixel(clickX))
            generateMaps()
        }

        chart.update()
        return

    },
    afterDatasetsDraw(chart, args, pluginOptions) {
        const { ctx, chartArea: { top, bottom } } = chart
        class Line {
            constructor(xCoord) {
                this.width = xCoord
            }

            draw(ctx) {
                ctx.restore()
                ctx.beginPath()
                ctx.lineWidth = 1
                ctx.strokeStyle = "rgba(255,255,255,0.8)"
                ctx.moveTo(this.width, top)
                ctx.lineTo(this.width, bottom)
                ctx.stroke()
                ctx.save()
            }
        }

        const state = new AppState()
        const boundaries = state.getState("boundaries")
        boundaries.forEach(boundary => {
            let drawLine = new Line(chart.scales.x.getPixelForValue(boundary))
            drawLine.draw(ctx)
        })


    }
}

function drawBoundariesChart(ctxNode, chartData) {

    const gridLineColor = "rgba(255,255,255,0.2)"

    const chart = new Chart(ctxNode, {
        type: 'scatter',
        data: {
            datasets: [{

                data: chartData,

            }]
        },
        options: {
            elements: {
                point: {
                    radius: 1
                }
            },
            animation: false,
            scales: {
                y: {
                    title: {
                        display: false
                    },
                    beginAtZero: true,
                    grid: {
                        color: gridLineColor,
                    },
                },
                x: {
                    grid: {
                        color: gridLineColor
                    },
                    type: "linear",
                    max: chartData.slice(-1)[0].x
                },
            },

            parsing: false,
            plugins: {
                legend: {
                    display: false
                }
            }

        },
        plugins: [clickableLines]
    });
}

function getChartData(data) {
    const chartData = []

    let prevDist = data[0].distance
    let count = 0

    data.forEach(entry => {
        if (entry.distance === prevDist) {
            count += entry.count
        } else {
            chartData.push({
                x: prevDist,
                y: count
            })

            prevDist = entry.distance
            count = entry.count
        }
    })

    chartData.push({
        x: prevDist,
        y: count
    })

    return chartData
}

export { drawBoundariesChart, getChartData }