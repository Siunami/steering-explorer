import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import "./App.css";

function Sankey() {
	const svgRef = useRef();
	const iframeRef = useRef();
	const [featureNumber, setFeatureNumber] = useState(0);
	const [data, setData] = useState({});

	useEffect(() => {
		fetchData(featureNumber, true);
	}, []);

	useEffect(() => {
		// Use the transformed data to update your Sankey diagram
		createSankeyDiagram(data);
	}, [data]);

	const updateNeuronViewer = (id) => {
		if (iframeRef.current) {
			const newSrc = `https://neuronpedia.org/gemma-2b/6-res-jb/${id}?embed=true`;
			iframeRef.current.src = newSrc;
			setFeatureNumber(id);
		}
	};

	const createSankeyDiagram = (data) => {
		// Clear existing SVG content
		d3.select(svgRef.current).selectAll("*").remove();

		// Check if data is valid
		if (
			!data ||
			!data.nodes ||
			!data.links ||
			data.nodes.length === 0 ||
			data.links.length === 0
		) {
			console.error("Invalid data for Sankey diagram:", data);
			return;
		}

		// Log the data
		console.log("Creating Sankey diagram with data:", data);

		// Create a map of node IDs to node objects
		const nodeMap = new Map(data.nodes.map((node) => [node.id, node]));

		// Update links to use node objects instead of IDs
		const updatedLinks = data.links
			.map((link) => {
				const source = nodeMap.get(link.source);
				const target = nodeMap.get(link.target);
				if (!source || !target) {
					console.error(`Invalid link: ${JSON.stringify(link)}`);
					return null;
				}
				return { ...link, source, target };
			})
			.filter(Boolean);

		const sankeyData = {
			nodes: data.nodes,
			links: updatedLinks,
		};

		const width = 800;
		const height = 600;
		const nodeWidth = 15;
		const nodePadding = 10;

		const svg = d3
			.select(svgRef.current)
			.attr("width", width)
			.attr("height", height)
			.attr("viewBox", [0, 0, width, height])
			.attr("style", "max-width: 100%; height: auto;");

		const sankeyGenerator = sankey()
			.nodeWidth(nodeWidth)
			.nodePadding(nodePadding)
			.extent([
				[1, 5],
				[width - 1, height - 5],
			]);

		const { nodes, links } = sankeyGenerator(sankeyData);

		// Add links
		svg
			.append("g")
			.attr("fill", "none")
			.attr("stroke-opacity", 0.5)
			.selectAll("g")
			.data(links)
			.join("g")
			.attr("stroke", (d) => d3.rgb(d.source.name.replace(/ .*/, "")).darker())
			.append("path")
			.attr("d", sankeyLinkHorizontal())
			.attr("stroke-width", (d) => Math.max(1, d.width));

		// Add nodes
		const node = svg.append("g").selectAll("g").data(nodes).join("g");

		node
			.append("rect")
			.attr("x", (d) => d.x0)
			.attr("y", (d) => d.y0)
			.attr("height", (d) => d.y1 - d.y0)
			.attr("width", (d) => d.x1 - d.x0)
			.attr("fill", (d) => d3.rgb(d.name.replace(/ .*/, "")))
			.attr("opacity", 0.8);

		node
			.append("text")
			.attr("x", (d) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
			.attr("y", (d) => (d.y1 + d.y0) / 2)
			.attr("dy", "0.35em")
			.attr("text-anchor", (d) => (d.x0 < width / 2 ? "start" : "end"))
			.text((d) => d.name);

		// Add dragging behavior and click behavior
		node.call(d3.drag().subject((d) => d)).on("click", handleNodeClick);

		function handleNodeClick(event, d) {
			console.log("Clicked node:", d);
			updateNeuronViewer(d.id);

			fetchData(
				d.id,
				[d.targetLinks[0].source.id, d.targetLinks[0].target.id],
				false
			);
		}
	};

	const fetchData = async (index, link = [], isNew = false) => {
		console.log(index);
		try {
			const response = await fetch(
				`http://localhost:5000/get_data?index=${index}&type=cosine`
			);
			if (!response.ok) {
				throw new Error("Network response was not ok");
			}
			const rawData = await response.json();
			console.log("Fetched data:", rawData);

			// Transform the data
			const transformedData = transformData(
				rawData,
				index,
				isNew ? null : data
			);
			console.log("Transformed data:", transformedData);

			if (!transformedData) {
				throw new Error("Failed to transform data");
			}

			setData(transformedData);
		} catch (error) {
			console.error("There was a problem with the fetch operation:", error);
		}
	};

	function transformData(inputData, index, existingData = null) {
		const { indices, values } = inputData;

		if (!indices || !values || indices.length === 0 || values.length === 0) {
			console.error("Invalid input data:", inputData);
			return null;
		}

		let nodes = [];
		let links = [];

		if (existingData && existingData.nodes && existingData.links) {
			nodes = [...existingData.nodes];
			links = [...existingData.links];
		}

		console.log(existingData);

		// Create a Set of all unique indices
		const uniqueIndices = new Set([Number(index), ...indices]);

		// Add new nodes
		uniqueIndices.forEach((index) => {
			if (!nodes.some((node) => node.id === index.toString())) {
				nodes.push({
					id: index.toString(),
					name: `Feature ${index}`,
				});
			}
		});

		// Add new links
		indices.slice(1).forEach((targetIndex, i) => {
			console.log(indices[0]);

			const newLink = {
				source: indices[0].toString(),
				target: targetIndex.toString(),
				value: Math.max(0.00001, values[i + 1]), // Ensure non-zero positive value
			};

			// Check if the link already exists
			const existingLinkIndex = links.findIndex(
				(link) =>
					link.source === newLink.source && link.target === newLink.target
			);

			if (existingLinkIndex === -1) {
				links.push(newLink);
			} else {
				// Update the existing link's value
				links[existingLinkIndex].value = Math.max(
					links[existingLinkIndex].value,
					newLink.value
				);
			}
		});

		return { nodes, links };
	}

	return (
		<div className="App">
			<div className="top-bar">
				<input
					type="number"
					value={featureNumber}
					onChange={(e) => setFeatureNumber(e.target.value)}
					placeholder="Enter feature number"
				/>
				<button onClick={() => fetchData(featureNumber)}>Fetch Data</button>
			</div>
			<svg ref={svgRef}></svg>
			<div className="iframe-container">
				<h2>Feature {featureNumber}</h2>
				<iframe
					ref={iframeRef}
					src="https://neuronpedia.org/gemma-2b/6-res-jb/10138?embed=true"
					title="Neuronpedia"
					className="neuronpedia-iframe"
				></iframe>
			</div>
		</div>
	);
}

export default Sankey;
