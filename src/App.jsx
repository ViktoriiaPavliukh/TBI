import React, { useState, useMemo } from "react";
import DataLoader from "./DataLoader";
import regionData from "./helpers/geo";
import MapChart from "./MapChart";

function App() {
    const [sentimentData, setSentimentData] = useState([]);
    const [error, setError] = useState(null);
    const combinedData = useMemo(() => {
        return sentimentData.map((item) => {
            const regionInfo = regionData.find(
                (r) =>
                    r.Country.trim().toLowerCase() ===
                        item.country.trim().toLowerCase() &&
                    r.Region.trim().toLowerCase() ===
                        item.region.trim().toLowerCase()
            );

            return {
                ...item,
                latitude: regionInfo?.Latitude ?? null,
                longitude: regionInfo?.Longitude ?? null,
            };
        });
    }, [sentimentData]);

    return (
        <div className="container">
            <DataLoader
                csvUrl="/data/geo_sentiments.csv"
                onDataLoaded={setSentimentData}
                onError={setError}
            />

            {error && <p style={{ color: "red" }}>{error}</p>}

            {sentimentData.length === 0 ? (
                <p className="text-center text-gray-600 mt-8">
                    Loading map data...
                </p>
            ) : (
                
                <MapChart
                    data={combinedData.filter((d) => d.latitude && d.longitude)}
                    mode="overall"
                />
            )}
        </div>
    );
}

export default App;
