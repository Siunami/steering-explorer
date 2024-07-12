import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import FeatureView, {
	NewFeatureDetails,
	FeatureLink,
	Sankey,
} from "./FeatureView";
import {
	fetchData,
	fetchDescriptions,
	fetchSearchResults,
	fetchTopEffects,
} from "./utils";

function App() {
	// History bar
	const historyRef = useRef(null);
	const [history, setHistory] = useState([]);
	const [showScrollButton, setShowScrollButton] = useState(false);

	// Top bar state
	const iframeRef = useRef();
	const [value, setValue] = useState();
	const [featureNumber, setFeatureNumber] = useState(null);
	const [featureDescription, setFeatureDescription] = useState("");
	const [similar, setSimilar] = useState(null);

	const [newFeatures, setNewFeatures] = useState([]);

	// Search query
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [isSearchFocused, setIsSearchFocused] = useState(false);

	// Add this new ref
	const featureViewContainerRef = useRef(null);

	useEffect(() => {
		if (featureNumber) setValue(featureNumber);
	}, [featureNumber]);

	useEffect(() => {
		const handleScroll = () => {
			if (historyRef.current) {
				setShowScrollButton(historyRef.current.scrollLeft > 0);
			}
		};

		const historyElement = historyRef.current;
		if (historyElement) {
			historyElement.addEventListener("scroll", handleScroll);
		}

		return () => {
			if (historyElement) {
				historyElement.removeEventListener("scroll", handleScroll);
			}
		};
	}, []);

	const scrollToStart = () => {
		if (historyRef.current) {
			historyRef.current.scrollTo({ left: 0, behavior: "smooth" });
		}
	};

	const fetchDescription = async (featureNumber) => {
		const data = await fetchDescriptions([featureNumber]);
		if (data[featureNumber]) {
			setFeatureDescription(data[featureNumber]);
		} else {
			setFeatureDescription("");
		}
		setHistory([
			...history.filter((item) => item.feature !== featureNumber),
			{
				feature: featureNumber,
				description: data[featureNumber] ? data[featureNumber] : "",
			},
		]);
		scrollToStart();
	};

	const getSimilar = async (feature) => {
		const data = await fetchData(feature);
		setSimilar(data);
	};

	const getData = async (feature) => {
		// Fetch top effects instead of all data
		const topEffects = await fetchTopEffects(feature);
		if (!topEffects) {
			alert("Error fetching feature effects");
			return;
		}
		const description = await fetchDescriptions([feature]);

		// Filter out zero values and their corresponding indices
		const filteredIndices = [];
		const filteredValues = [];
		topEffects.indices.forEach((index, i) => {
			if (topEffects.values[i] !== 0 && filteredIndices.length <= 10) {
				filteredIndices.push(index);
				filteredValues.push(topEffects.values[i]);
			}
		});

		// Fetch descriptions for filtered indices
		const descriptions = await fetchDescriptions(filteredIndices);
		const orderedDescriptions = filteredIndices.map(
			(index) => descriptions[index] || ""
		);

		let dataset = {
			indices: filteredIndices,
			values: filteredValues,
			descriptions: orderedDescriptions,
		};

		let newFeature = {
			feature,
			description: description[feature],
			rows: [dataset],
		};

		setNewFeatures((prevFeatures) => {
			// Check if the feature already exists
			const existingIndex = prevFeatures.findIndex(
				(f) => f.feature === feature
			);

			if (existingIndex !== -1) {
				// If it exists, remove it from its current position
				const updatedFeatures = prevFeatures.filter(
					(f) => f.feature !== feature
				);
				// Add the updated feature to the beginning of the array
				return [newFeature, ...updatedFeatures];
			} else {
				// If it doesn't exist, add it to the beginning of the array
				return [newFeature, ...prevFeatures];
			}
		});

		// Scroll to top of featureViewContainerRef after state update
		setTimeout(() => {
			if (featureViewContainerRef.current) {
				const containerTop = featureViewContainerRef.current.offsetTop;
				window.scrollTo({
					top: containerTop,
					behavior: "smooth",
				});
			}
		}, 20);
	};

	useEffect(() => {
		if (featureNumber) {
			fetchDescription(featureNumber);
			getSimilar(featureNumber);
		}
	}, [featureNumber]);

	const updateRow = async (feature, ref, rowIndex, shouldSlice) => {
		let newRows = [...feature.rows];

		if (shouldSlice) {
			// Remove this row and all subsequent rows
			newRows = newRows.slice(0, rowIndex + 1);
		} else {
			// Fetch top effects instead of all data
			const topEffects = await fetchTopEffects(
				ref.getAttribute("feature-number")
			);
			if (!topEffects) {
				alert("Error fetching feature effects");
				return;
			}
			// Filter out zero values and their corresponding indices
			const filteredIndices = [];
			const filteredValues = [];
			topEffects.indices.forEach((index, i) => {
				if (topEffects.values[i] !== 0 && filteredIndices.length <= 10) {
					filteredIndices.push(index);
					filteredValues.push(topEffects.values[i]);
				}
			});

			// Fetch descriptions for filtered indices
			const descriptions = await fetchDescriptions(filteredIndices);
			const orderedDescriptions = filteredIndices.map(
				(index) => descriptions[index] || ""
			);

			let dataset = {
				indices: filteredIndices,
				values: filteredValues,
				descriptions: orderedDescriptions,
				ref: ref, // Store the ref in the dataset
			};
			newRows = [...newRows.slice(0, rowIndex + 1), dataset];
		}

		setNewFeatures((prevFeatures) =>
			prevFeatures.map((f) =>
				f.feature === feature.feature ? { ...f, rows: newRows } : f
			)
		);
	};

	useEffect(() => {
		const delayDebounceFn = setTimeout(async () => {
			await fetchSearchResults(searchQuery, setSearchResults);
		}, 300); // Debounce delay

		return () => clearTimeout(delayDebounceFn);
	}, [searchQuery]);

	useEffect(() => {
		console.log(newFeatures);
	}, [newFeatures]);

	return (
		<div className="App">
			<div className="neuron-history-container">
				<div className="neuron-history row" ref={historyRef}>
					{[...history].reverse().map((item) => {
						return (
							<div onClick={(ev) => setFeatureNumber(item.feature)}>
								<div>
									<b>{item.feature}</b>
								</div>
								<div>{item.description.slice(0, 30) + "..."}</div>
							</div>
						);
					})}
					{showScrollButton && (
						<button
							className="scroll-left-button"
							onClick={scrollToStart}
						></button>
					)}
				</div>
			</div>
			<div className="neuron-view row">
				<div className="neuron-bar column">
					<h3>Find by</h3>
					<div className="input-group">
						<input
							type="number"
							value={value}
							onChange={(e) => setValue(e.target.value)}
							placeholder="Enter feature number"
						/>
						<button onClick={() => setFeatureNumber(value)}>Set</button>
					</div>
					<div>
						<input
							style={{
								width: "calc(100% - 16px)",
							}}
							type="text"
							placeholder="Search by description"
							value={searchQuery}
							onFocus={() => {
								fetchSearchResults(searchQuery, setSearchResults);
								setIsSearchFocused(true);
							}}
							onBlur={() => {
								setTimeout(() => {
									setIsSearchFocused(false);
									setSearchResults([]);
								}, 100);
							}}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
						{isSearchFocused && searchResults.length > 0 && (
							<div className="search-results">
								{searchResults.map((result, index) => (
									<div
										key={index}
										className="search-result-item"
										onMouseDown={() => {
											setFeatureNumber(result[1]);
											setSearchResults([]);
										}}
									>
										<span className="result-number">{result[1]}</span>
										<div className="result-description">{result[0]}</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
				{featureNumber && (
					<>
						<div className="neuron-bar row">
							<div className="column">
								<h3>Feature {featureNumber}</h3>
								<p>{featureDescription}</p>
								<div style={{ color: "gray" }}>
									<i>Related features</i>
								</div>
								<div className="row wrap">
									{similar &&
										similar.indices.slice(1).map((index) => {
											return (
												<div
													onClick={(ev) => setFeatureNumber(index)}
													className="related-neurons"
												>
													{index}
												</div>
											);
										})}
								</div>
							</div>
							<button
								className="add-feature-button"
								onClick={() => {
									getData(featureNumber);
								}}
							>
								Inspect feature
								<span className="down-arrow">→</span>
							</button>
						</div>
						<iframe
							ref={iframeRef}
							src={
								"https://neuronpedia.org/gemma-2b/6-res-jb/" +
								featureNumber +
								"?embed=true"
							}
							title="Neuronpedia"
							className="neuronpedia-iframe"
						></iframe>
					</>
				)}
			</div>
			<div className="feature-view-container" ref={featureViewContainerRef}>
				{newFeatures.map((feature, i) => {
					return (
						<div className="feature-view row" key={feature.feature}>
							<div className="column">
								<div className="row">
									<h3 className="feature-title">Feature {feature.feature}</h3>
									<FeatureLink
										featureNumber={feature.feature}
										setFeatureNumber={setFeatureNumber}
									/>
								</div>
								<div>{feature.description}</div>
								<NewFeatureDetails
									feature={feature}
									updateRow={updateRow}
									setFeatureNumber={setFeatureNumber}
								/>
							</div>
						</div>
					);
				})}
				{/* {newFeatures.map((feature, i) => {
					return (
						<div className="feature-view row" key={feature.feature}>
							<div className="column">
								<div className="row">
									<h3 className="feature-title">Feature {feature.feature}</h3>
									<FeatureLink
										featureNumber={feature.feature}
										setFeatureNumber={setFeatureNumber}
									/>
								</div>
								<div>{feature.description}</div>
								<Sankey
									feature={feature}
									updateRow={updateRow}
									setFeatureNumber={setFeatureNumber}
								/>
							</div>
						</div>
					);
				})} */}
			</div>
		</div>
	);
}

export default App;
