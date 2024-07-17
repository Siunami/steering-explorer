import React, { useEffect, useState, useRef } from "react";

const normalizeValues = (values) => {
	const sum = values.reduce((acc, val) => acc + val, 0);
	return values.map((val) => val / sum);
};

export const FeatureLink = ({ featureNumber, setFeatureNumber }) => (
	<span
		className="feature-link"
		onClick={() => setFeatureNumber(featureNumber)}
		title={`Set to feature ${featureNumber}`}
	>
		<span className="feature-link-icon">🔍</span>
	</span>
);

const FeatureDetailsRow = ({
	row,
	index,
	handleRowUpdate,
	previousBarRef,
	setFeatureNumber,
}) => {
	const rowRef = useRef();
	const barRefs = useRef([]);
	const updatedIndices = row.indices;
	const normalizedValues = normalizeValues(row.values);
	const descriptions = row.descriptions;
	const [svgPath, setSvgPath] = useState(null);
	const color = "rgba(0, 50, 200, 0.3)";

	const updateSvgPath = () => {
		if (previousBarRef && rowRef.current) {
			const barRect = previousBarRef.getBoundingClientRect();
			const rowRect = rowRef.current.getBoundingClientRect();
			const svgRect = rowRef.current.parentElement.getBoundingClientRect();

			// Calculate relative positions
			const startLeft = barRect.left - svgRect.left;
			const startRight = barRect.right - svgRect.left;
			const startY = barRect.bottom - svgRect.top;
			const endLeft = rowRect.left - svgRect.left;
			const endRight = rowRect.right - svgRect.left;
			const endY = rowRect.top - svgRect.top + 2;

			// Calculate control points for the Bézier curves
			const midY = (startY + endY) / 2;

			const path = `
				M ${startLeft},${startY}
				C ${startLeft},${midY} ${endLeft},${midY} ${endLeft},${endY}
				L ${endRight},${endY}
				C ${endRight},${midY} ${startRight},${midY} ${startRight},${startY}
				Z
			`;

			setSvgPath(path);
		}
	};

	useEffect(() => {
		updateSvgPath();
		window.addEventListener("resize", updateSvgPath);
		return () => window.removeEventListener("resize", updateSvgPath);
	}, [previousBarRef, rowRef, row]);

	const handleBarClick = (barRef, barIndex) => {
		handleRowUpdate(barRef, index);
		// setFeatureNumber(updatedIndices[barIndex]);
	};

	if (!row) return null;

	return (
		<div className="feature-details-row">
			{svgPath && (
				<svg
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						pointerEvents: "none",
					}}
				>
					<path d={svgPath} fill={color} stroke="transparent" />
				</svg>
			)}
			<div ref={rowRef} className="feature-details">
				{normalizedValues.map((value, i) => {
					return (
						<div
							key={i}
							ref={(el) => (barRefs.current[i] = el)}
							style={{
								width: `${value * 100}%`,
							}}
							feature-number={updatedIndices[i]}
							className="feature-bar"
							onClick={() => handleBarClick(barRefs.current[i], i)}
							onDoubleClick={() => setFeatureNumber(updatedIndices[i])}
						>
							<span className="feature-bar-index row">{updatedIndices[i]}</span>
							<span className="feature-bar-description" title={descriptions[i]}>
								{descriptions[i]}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export function NewFeatureDetails({ feature, updateRow, setFeatureNumber }) {
	const [barRefs, setBarRefs] = useState([]);

	const handleRowUpdate = (ref, rowIndex) => {
		if (barRefs[rowIndex] === ref) {
			// If the clicked bar is the same as the stored one, slice all later rows
			setBarRefs((prevRefs) => prevRefs.slice(0, rowIndex));
			updateRow(feature, ref, rowIndex, true); // Pass true to indicate slicing
		} else {
			updateRow(feature, ref, rowIndex, false);
			setBarRefs((prevRefs) => {
				const newRefs = [...prevRefs];
				newRefs[rowIndex] = ref;
				return newRefs;
			});
		}
	};

	// Check if feature.rows exists and is an array before mapping
	const rows = feature.rows && Array.isArray(feature.rows) ? feature.rows : [];

	return (
		<div>
			{rows.map((row, rowIndex) => (
				<FeatureDetailsRow
					key={rowIndex}
					row={row}
					index={rowIndex}
					handleRowUpdate={handleRowUpdate}
					previousBarRef={rowIndex > 0 ? barRefs[rowIndex - 1] : null}
					setFeatureNumber={setFeatureNumber}
				/>
			))}
		</div>
	);
}

const HEIGHT = 600;

function SankeyElement({
	text,
	description,
	height,
	setFeatureNumber,
	handleRowUpdate,
	barRefs = null,
	i = null,
}) {
	return (
		<div
			className="column sankey-element"
			style={{ height: `${height}px` }}
			onClick={() => handleRowUpdate()}
			feature-number={text}
			ref={(el) => {
				if (barRefs && i) barRefs.current[i] = el;
			}}
		>
			<div
				onClick={() => setFeatureNumber(text)}
				className="sankey-element-text"
			>
				<div>{text}</div>
				<div>{description}</div>
			</div>
		</div>
	);
}

function SankeyRow({
	row,
	index,
	handleRowUpdate,
	previousBarRef,
	setFeatureNumber,
}) {
	const rowRef = useRef();
	const barRefs = useRef([]);
	const updatedIndices = row.indices;
	const normalizedValues = normalizeValues(row.values);
	const descriptions = row.descriptions;
	const [svgPath, setSvgPath] = useState(null);
	const color = "rgba(0, 50, 200, 0.3)";

	const updateSvgPath = () => {
		// ... (keep the existing updateSvgPath logic)
	};

	useEffect(() => {
		updateSvgPath();
		window.addEventListener("resize", updateSvgPath);
		return () => window.removeEventListener("resize", updateSvgPath);
	}, [previousBarRef, rowRef, row]);

	const handleBarClick = (barRef, barIndex) => {
		handleRowUpdate(barRef, index);
		// setFeatureNumber(updatedIndices[barIndex]);
	};

	if (!row) return null;

	return (
		<div className="sankey-row">
			{svgPath && (
				<svg
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						pointerEvents: "none",
					}}
				>
					<path d={svgPath} fill={color} stroke="transparent" />
				</svg>
			)}
			<div ref={rowRef} className="sankey-details">
				{normalizedValues.map((value, i) => {
					return (
						// <div
						// 	key={i}
						// 	ref={(el) => (barRefs.current[i] = el)}
						// 	style={{
						// 		width: `${value * 100}%`,
						// 	}}
						// 	feature-number={updatedIndices[i]}
						// 	className="feature-bar"
						// 	onClick={() => handleBarClick(barRefs.current[i], i)}
						// 	onDoubleClick={() => setFeatureNumber(updatedIndices[i])}
						// >
						// 	<span className="feature-bar-index row">{updatedIndices[i]}</span>
						// 	<span className="feature-bar-description" title={descriptions[i]}>
						// 		{descriptions[i]}
						// 	</span>
						// </div>
						<SankeyElement
							text={updatedIndices[i]}
							description={descriptions[i]}
							height={value * HEIGHT}
							setFeatureNumber={setFeatureNumber}
							handleRowUpdate={() => handleBarClick(barRefs.current[i], i)}
							barRefs={barRefs}
							i={i}
						/>
					);
				})}
			</div>
		</div>
	);
}

export function Sankey({ feature, updateRow, setFeatureNumber }) {
	const [barRefs, setBarRefs] = useState([]);

	const handleRowUpdate = (ref, rowIndex) => {
		if (barRefs[rowIndex] === ref) {
			// If the clicked bar is the same as the stored one, slice all later rows
			setBarRefs((prevRefs) => prevRefs.slice(0, rowIndex));
			updateRow(feature, ref, rowIndex, true); // Pass true to indicate slicing
		} else {
			updateRow(feature, ref, rowIndex, false);
			setBarRefs((prevRefs) => {
				const newRefs = [...prevRefs];
				newRefs[rowIndex] = ref;
				return newRefs;
			});
		}
	};

	// Check if feature.rows exists and is an array before mapping
	const rows = feature.rows && Array.isArray(feature.rows) ? feature.rows : [];

	return (
		<div className="row">
			<SankeyElement
				text={feature.feature}
				description={feature.description}
				height={HEIGHT}
				setFeatureNumber={setFeatureNumber}
			/>

			{rows.map((row, rowIndex) => (
				<SankeyRow
					key={rowIndex}
					row={row}
					index={rowIndex}
					handleRowUpdate={handleRowUpdate}
					previousBarRef={rowIndex > 0 ? barRefs[rowIndex - 1] : null}
					setFeatureNumber={setFeatureNumber}
				/>
			))}
		</div>
	);
}

// const FeatureDetails = ({ data, setFeatureNumber }) => {
// 	const [rows, setRows] = useState([data]);
// 	const [barRefs, setBarRefs] = useState([null]);

// 	useEffect(() => {
// 		console.log("rows:");
// 		console.log(rows);
// 	}, [rows]);

// 	const handleRows = async (feature, ref, rowIndex) => {
// 		if (!rows) return;
// 		if (barRefs.includes(ref)) {
// 			const index = barRefs.indexOf(ref);
// 			setBarRefs([...barRefs.slice(0, index)]);
// 			setRows([...rows.slice(0, index)]);
// 		} else {
// 			const data = await fetchData(feature);
// 			setBarRefs([...barRefs.slice(0, rowIndex + 1), ref]);
// 			setRows([...rows.slice(0, rowIndex + 1), data]);
// 		}
// 	};

// 	if (!data) {
// 		return <div>Loading...</div>;
// 	}

// 	return (
// 		<div className="feature-rows">
// 			{rows.map((row, i) => (
// 				<FeatureDetailsRow
// 					values={row.values}
// 					indices={row.indices}
// 					handleRows={handleRows}
// 					barRef={barRefs[i]}
// 					index={i}
// 					setFeatureNumber={setFeatureNumber}
// 				/>
// 			))}
// 		</div>
// 	);
// };

// const FeatureView = ({ feature, setFeatureNumber }) => {
// 	const [data, setData] = useState(null);

// 	const getData = async (feature) => {
// 		console.log("Fetching data for feature:", feature);
// 		const fetchedData = await fetchData(feature);
// 		setData(fetchedData);
// 	};

// 	useEffect(() => {
// 		getData(feature);
// 	}, []);

// 	useEffect(() => {
// 		getData(feature);
// 	}, [feature]);

// 	useEffect(() => {
// 		if (data) {
// 			console.log(feature);
// 			console.log("Data updated:", data);
// 			console.log("Values:", data.values);
// 			console.log("Indices:", data.indices);
// 		}
// 	}, [data]);

// 	return (
// 		<div className="feature-view row">
// 			{data ? (
// 				<div className="column">
// 					<h3 className="feature-title">Feature {feature}</h3>
// 					<FeatureDetails data={data} setFeatureNumber={setFeatureNumber} />
// 				</div>
// 			) : (
// 				<div>Loading...</div>
// 			)}
// 		</div>
// 	);
// };

// export default FeatureView;
