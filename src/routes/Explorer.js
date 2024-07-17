import React, { useEffect, useRef, useState } from "react";
import "../App.css";
import { fetchSearchResults, fetchDescriptions, fetchData } from "../utils";

function History({ history, setFeatureNumber }) {
	const historyRef = useRef(null);

	const [showScrollButton, setShowScrollButton] = useState(false);

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

	return (
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
	);
}

function SearchBox({ setSimilar, setFeatureNumber }) {
	const [value, setValue] = useState("");

	// Search query
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [isSearchFocused, setIsSearchFocused] = useState(false);

	useEffect(() => {
		const delayDebounceFn = setTimeout(async () => {
			if (searchQuery.trim().length < 2) {
				setSearchResults([]);
				return;
			}
			let results = await fetchSearchResults(searchQuery);
			setSearchResults(results.slice(0, 40));
		}, 300); // Debounce delay

		return () => clearTimeout(delayDebounceFn);
	}, [searchQuery]);

	return (
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
	);
}

function FeatureView({ featureNumber, setFeatureNumber }) {
	// ... existing state variables ...
	const [isExpanded, setIsExpanded] = useState(false);
	const featureViewRef = useRef(null);
	const toggleButtonRef = useRef(null);

	// Top bar state
	const iframeRef = useRef();

	const [similar, setSimilar] = useState(null);
	const [featureDescription, setFeatureDescription] = useState("");

	const getSimilar = async (feature) => {
		const data = await fetchData(feature);
		setSimilar(data);
	};

	const getDescriptions = async (feature) => {
		const data = await fetchDescriptions(feature);
		setFeatureDescription(data);
	};

	useEffect(() => {
		if (featureNumber) {
			getDescriptions(featureNumber);
			getSimilar(featureNumber);
		}
	}, [featureNumber]);

	const toggleExpand = () => {
		setIsExpanded(!isExpanded);
		if (featureViewRef.current) {
			featureViewRef.current.style.transform = isExpanded
				? "translateX(0)"
				: "translateX(-300px)";
		}

		if (toggleButtonRef.current) {
			toggleButtonRef.current.style.transform = isExpanded
				? "translateX(250px)"
				: "translateX(0)";
		}
	};

	// const getSimilar = async (feature) => {
	// 	const data = await fetchData(feature);
	// 	setSimilar(data);
	// };

	// useEffect(() => {
	// 	const delayDebounceFn = setTimeout(async () => {
	// 		await fetchSearchResults(searchQuery, setSearchResults);
	// 	}, 300); // Debounce delay

	// 	return () => clearTimeout(delayDebounceFn);
	// }, [searchQuery]);

	// useEffect(() => {
	// 	if (featureNumber) {
	// 		fetchDescriptions(featureNumber);
	// 		getSimilar(featureNumber);
	// 	}
	// }, [featureNumber]);

	return (
		<>
			<button
				className="toggle-button"
				onClick={toggleExpand}
				ref={toggleButtonRef}
			>
				{isExpanded ? ">>" : "<<"}
			</button>
			<div className="feature-view-container column" ref={featureViewRef}>
				<SearchBox
					setSimilar={setSimilar}
					setFeatureNumber={setFeatureNumber}
				/>
			</div>
		</>
	);
}

function Dashboard() {
	return (
		<div>
			<p>Dashboard</p>
		</div>
	);
}

export default function Explorer() {
	const [history, setHistory] = useState([]);
	const [featureNumber, setFeatureNumber] = useState(null);

	return (
		<div className="App">
			<History history={history} setFeatureNumber={setFeatureNumber} />

			<div className="container row">
				<FeatureView
					featureNumber={featureNumber}
					setFeatureNumber={setFeatureNumber}
				/>
				<Dashboard />
			</div>
		</div>
	);
}
