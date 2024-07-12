export const fetchData = async (index) => {
	console.log("fetching: " + index);
	try {
		const response = await fetch(
			`http://localhost:5000/get_data?index=${index}`
		);
		if (!response.ok) {
			throw new Error("Network response was not ok");
		}
		const rawData = await response.json();
		return rawData;
	} catch (error) {
		console.error("There was a problem with the fetch operation:", error);
	}
};

export const fetchDescriptions = async (keys) => {
	console.log("fetching descriptions for keys:", keys);
	try {
		const response = await fetch(`http://localhost:5000/get_description`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ keys }),
		});

		if (!response.ok) {
			throw new Error("Network response was not ok");
		}

		const data = await response.json();
		return data.descriptions;
	} catch (error) {
		console.error("There was a problem fetching the descriptions:", error);
		return {};
	}
};

export const fetchSearchResults = async (searchQuery, setSearchResults) => {
	if (searchQuery.trim().length < 2) {
		setSearchResults([]);
		return;
	}
	try {
		const response = await fetch(`http://localhost:5000/search/${searchQuery}`);
		const data = await response.json();
		setSearchResults(data.slice(0, 40));
	} catch (error) {
		console.error("Error fetching search results:", error);
	}
};

export const fetchTopEffects = async (feature) => {
	console.log("fetching top effects for feature: " + feature);
	try {
		const response = await fetch(
			`http://localhost:5000/get_top_effects?feature=${feature}`
		);
		if (!response.ok) {
			throw new Error("Network response was not ok");
		}
		const rawData = await response.json();
		return rawData;
	} catch (error) {
		console.error("There was a problem fetching top effects:", error);
	}
};
