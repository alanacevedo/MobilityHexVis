import * as d3 from "d3";

import { AppState } from "@js/appState.js";

function addColorGradientSvg() {
    const svg = d3.select("#color-scale");
    const width = svg.node().getBoundingClientRect().width;
    const height = 10;
    const margin = { left: 0, right: 0, top: 0, bottom: 0 };

    // Clear existing content
    svg.selectAll("*").remove();

    // Create a group for the color scale
    const gradientGroup = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Get the current mixtura color scale
    const state = new AppState();
    const mixturaColorScale = state.getState("mixturaColorScale") || d3.interpolateWarm;

    // Define the gradient in the SVG
    const defs = svg.append("defs");

    const gradient = defs.append("linearGradient")
        .attr("id", "mixturaGradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    // Add color stops to the gradient
    for (let i = 0; i <= 100; i++) {
        gradient.append("stop")
            .attr("offset", `${i}%`)
            .attr("stop-color", mixturaColorScale(i / 100)); // Remove the inversion
    }

    // Draw the rectangle with the gradient
    gradientGroup.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "url(#mixturaGradient)");

    // Add labels to the ends of the scale
    gradientGroup.append("text")
        .attr("x", 0)
        .attr("y", height + 15)
        .attr("text-anchor", "start")
        .style("font-size", "12px")
        .text("Low");

    gradientGroup.append("text")
        .attr("x", width)
        .attr("y", height + 15)
        .attr("text-anchor", "end")
        .style("font-size", "12px")
        .text("High");
}


export { addColorGradientSvg }