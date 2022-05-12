/* 
SET UP 
*/
const wMap = 840;
const hMap = 640;
const mMap = { top: 20, right: 20, bottom: 20, left: 20 };

/* 
CREATING EMPTY SVG ROOT ELEMENT ON PAGE LOAD 
*/
const svg = d3
	.select("#map-container")
	.append("svg")
	.attr("width", wMap)
	.attr("height", hMap);

/* 
DEFINE MAP PROJECTION & PATH GENERATOR
*/
const projection = d3.geoAlbersUsa().translate([wMap / 2, hMap / 2]);
//.fitExtent([[m.top, m.left], [w - m.bottom, h - m.right]], states);

const path = d3.geoPath().projection(projection);

/*
MAKING THE MAP
*/
function makeMap(data) {
	// projection.fitExtent([[m.top, m.left], [w - m.bottom, h - m.right]], states);
	states = topojson.feature(data, data.objects.states);
	// we already defined the projection & path outside the D3 JSON request
	svg
		.selectAll("path")
		.data(states.features)
		.join("path")
		.attr("d", path)
		.attr("class", "states");
}

/*
PLOT POINTS & TOOLTIP
*/
function colorPoint(d) {
	if (d.RETIREMENT_YEAR === "") {
		return "#495057";
	}
}

function plotPoints(data) {
	let size = d3
		.scaleLinear()
		.domain(d3.extent(data, (d) => d.CAPACITY_MW))
		.range([3, 8]);

	let tooltip = d3
		.select("body")
		.append("div")
		.attr("class", "tooltip")
		.classed("hidden", true);

	let mouseover = function (event, d) {
		d3.select(".tooltip")
			.html(
				`<p>
        <b>${d.ENTITY_NAME}</b> in ${d.COUNTY}, ${d.STATE_NAME}</p>
        <p><i>${d.TECHNOLOGY}</i></p>
        <br>
        <p><b>Operating Since:</b> ${d.OP_YEAR}
        <br>
        <b>Retirement Year:</b> ${d.RETIREMENT_YEAR}
        <br>
        <b>Capacity:</b> ${d.CAPACITY_MW} MW
        </p>`
			)
			.style("left", event.pageX - 20 + "px")
			.style("top", event.pageY + 20 + "px")
			.transition()
			.duration(300)
			.style("opacity", 1);

		d3.select(".tooltip").classed("hidden", false);
	};

	let mouseout = function (event, d) {
		d3.select(".tooltip").transition().duration(300).style("opacity", 0);
	};

	points = svg
		.selectAll(".point")
		.data(data)
		.join("circle")
		.attr("cx", (d) => projection([+d.LNG, +d.LAT])[0])
		.attr("cy", (d) => projection([+d.LNG, +d.LAT])[1])
		.attr("r", (d) => size(d.CAPACITY_MW))
		.attr("class", "point")
		.style("fill", (d) => colorPoint(d))
		.on("mouseover", mouseover)
		.on("mouseout", mouseout);
}

/* 
LOADING UNITED STATES TOPOJSON DATA 
https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json 
*/
d3.json("data/counties-10m.json").then((data, error) => {
	if (error) {
		console.log(log); // handling error
	} else {
		//console.log(data); // inspect topojson object

		makeMap(data);

		d3.json("data/power-plants-eia.json").then((data, error) => {
			if (error) {
				console.log(log);
			} else {
				let filtered = data.filter((d) => {
					return projection([+d.LNG, +d.LAT]) != null && d.TYPE === "Coal";
				});
				plotPoints(filtered);
			}
		});
	}
});