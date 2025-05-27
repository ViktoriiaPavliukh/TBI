
import React, { useState } from "react";
import DataLoader from "./DataLoader";
import MapChart from "./MapChart"; // ваш компонент карти

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [mode, setMode] = useState("overall");

    if (error) return <div className="text-red-600 p-4">{error}</div>;

    if (!data)
        return (
            <DataLoader
                onDataLoaded={(loadedData) => setData(loadedData)}
                onError={(msg) => setError(msg)}
            />
        );

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">
                Sentiment Heatmap Dashboard
            </h1>

            <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="mb-4 p-2 border rounded"
            >
                <option value="overall">Overall</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
            </select>

            <MapChart data={data} mode={mode} />
        </div>
    );
};

export default Dashboard;
