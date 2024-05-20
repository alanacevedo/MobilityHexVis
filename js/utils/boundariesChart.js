import Chart from 'chart.js/auto';
import * as d3 from "d3";
import { AppState } from '../appState';
import { generateMaps } from './domFunctions';

const TOOLTIPID = 'chartjs-tooltip'

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
                        display: true,
                        text: "Ocurrencias (miles)"
                    },
                    beginAtZero: true,
                    grid: {
                        color: gridLineColor,
                    },
                    ticks: {
                        callback: (label) => label / 1000

                    }
                },
                x: {
                    title: {
                        display: true,
                        text: "Distancia (km)"
                    },
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
            },
            onHover: handleOnHover

        },
        plugins: [clickableLines]
    });

    d3.select("#" + ctxNode.id).node().addEventListener('mouseleave', () => {
        d3.select("#" + TOOLTIPID).node().style.display = 'none'
    })


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

function handleOnHover(event, activeElements, chartElement) {
    const tooltipNode = d3.select("#" + TOOLTIPID).node()

    const xScale = chartElement.scales.x;
    const xValue = xScale.getValueForPixel(event.x);

    if (xValue < 0) {
        return
    }

    // Position the tooltip
    tooltipNode.innerHTML = `${xValue.toFixed(2)} km.`;
    tooltipNode.style.left = event.native.clientX + 'px';
    tooltipNode.style.top = event.native.clientY - 20 + 'px';
    tooltipNode.style.display = 'block'; // Ensure the tooltip is visible
}

export { drawBoundariesChart, getChartData }