import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import OldApp from "./routes/OldApp";
import Explorer from "./routes/Explorer";

function App() {
	return (
		<Router>
			<Routes>
				<Route
					path="/new"
					element={
						<div className="e-scope">
							<Explorer />
						</div>
					}
				/>
				<Route
					path="/"
					element={
						<div className="o-scope">
							<OldApp />
						</div>
					}
				/>
			</Routes>
		</Router>
	);
}

function Home() {
	return <h2>Welcome to the new home page</h2>;
}

export default App;
