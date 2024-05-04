import Chart from 'chart.js/auto';
import { AppState } from '../appState';

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
            const x = boundary.chartX
            if (clickX - delta <= x && x <= clickX + delta) {
                boundaries.splice(i, 1)
                removed = true
            }
        })

        if (!removed) {
            const boundaryValue = chart.scales.x.getValueForPixel(clickX)
            boundaries.push({
                value: boundaryValue,
                chartX: clickX
            })
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
            let drawLine = new Line(boundary.chartX)
            drawLine.draw(ctx)
        })


    }
}

function drawBoundariesChart(ctxNode, chartData) {
    const gridLineColor = "rgba(255,255,255,0.2)"

    new Chart(ctxNode, {
        type: 'line',
        data: {
            datasets: [{

                data: chartData,

            }]
        },
        options: {
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