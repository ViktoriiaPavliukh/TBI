import React, { useEffect } from "react";
import Papa from "papaparse";
import countryNameToCode from "./helpers/countryNameToCode";

const DataLoader = ({ onDataLoaded, onError }) => {
    useEffect(() => {
        Papa.parse("/data/geo_sentiments.csv", {
            download: true,
            header: true,
            dynamicTyping: true,
            complete: (results) => {
                if (results.errors.length) {
                    onError("Error parsing CSV data");
                } else {
                    const transformed = results.data
                        .map((item) => {
                            const isoCode =
                                countryNameToCode[item.Country?.trim()];
                            if (!isoCode) return null;

                            const random = item.RandomValue;
                            const positive = random === 2 ? 1 : 0;
                            const neutral = random === 1 ? 1 : 0;
                            const negative = random === 0 ? 1 : 0;

                            return {
                                id: isoCode,
                                country: item.Country,
                                region: item.Region,
                                positive,
                                neutral,
                                negative,
                            };
                        })
                        .filter(Boolean);
                    console.log(transformed);
                    onDataLoaded(transformed);
                }
            },
            error: () => {
                onError("Failed to load CSV data");
            },
        });
    }, [onDataLoaded, onError]);

    return (
        <div className="p-4 text-gray-600 text-center font-light text-2xl"> Sentiment Heatmap Dashboard</div>
    );
};

export default DataLoader;
