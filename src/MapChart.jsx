import React, { useLayoutEffect, useRef, useState } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";

const MapChart = ({ data = [], mode = "overall" }) => {
    const chartRef = useRef(null);
    const rootRef = useRef(null);
    const polygonSeriesRef = useRef(null);
    const [modalData, setModalData] = useState(null);
    const [selectedCountryId, setSelectedCountryId] = useState("");

    function getSentimentScore(d) {
        if (mode === "overall") {
            return (
                (d.positive - d.negative) /
                (d.positive + d.neutral + d.negative || 1)
            );
        }
        if (mode === "positive") return d.positive;
        if (mode === "neutral") return d.neutral;
        if (mode === "negative") return d.negative;
        return 0;
    }

    function getColor(sentiment) {
        if (sentiment > 0.3) return am5.color(0x4caf50); 
        if (sentiment < -0.3) return am5.color(0xf44336); 
        return am5.color(0xffeb3b);
    }

    function focusOnCountry(id) {
        if (!polygonSeriesRef.current) return;
        const polygon = polygonSeriesRef.current
            .getDataItemById(id)
            ?.get("mapPolygon");
        if (polygon && chartRef.current) {
            const chart = chartRef.current;
            const geoPoint = polygon.geoCentroid();
            if (geoPoint) {
                chart.zoomToGeoPoint(geoPoint, 5, true); // zoom level 5, animated
            }
        }
    }

    // Handle dropdown change
    function handleCountrySelect(id) {
        setSelectedCountryId(id);
        focusOnCountry(id);
    }

    useLayoutEffect(() => {
        if (rootRef.current) {
            rootRef.current.dispose();
        }

        const root = am5.Root.new("chartdiv");
        rootRef.current = root;

        const chart = root.container.children.push(
            am5map.MapChart.new(root, {
                panX: "rotateX",
                panY: "translateY",
                projection: am5map.geoMercator(),
                layout: root.verticalLayout,
                wheelY: "zoomXY",
            })
        );
        chartRef.current = chart;

        const polygonSeries = chart.series.push(
            am5map.MapPolygonSeries.new(root, {
                geoJSON: am5geodata_worldLow,
                exclude: ["AQ"],
                calculateAggregates: true,
            })
        );
        polygonSeriesRef.current = polygonSeries;

        polygonSeries.mapPolygons.template.setAll({
            tooltipText: "{name}\nClick for details",
            interactive: true,
            stroke: am5.color(0x4a4a4a),
            strokeWidth: 1,
        });

        polygonSeries.mapPolygons.template.states.create("hover", {
            fill: am5.color(0x6699ff),
        });

        const heatmapData = data.map((d) => {
            const sentimentScore = getSentimentScore(d);
            return {
                id: d.id,
                value: sentimentScore,
                fill: getColor(sentimentScore),
                positive: d.positive,
                neutral: d.neutral,
                negative: d.negative,
                name: d.country,
            };
        });

        polygonSeries.mapPolygons.template.adapters.add(
            "fill",
            (fill, target) => {
                const polygonId = target.dataItem?.get("id");
                const dataItem = heatmapData.find((d) => d.id === polygonId);
                return dataItem ? dataItem.fill : fill;
            }
        );

        polygonSeries.mapPolygons.template.events.on("click", (ev) => {
            const id = ev.target.dataItem?.get("id");
            if (!id) return;

            const clickedData = heatmapData.find((d) => d.id === id);
            if (clickedData) {
                setModalData(clickedData);
            }
        });

        // Point series (bubbles)
        const pointSeries = chart.series.push(
            am5map.MapPointSeries.new(root, {
                valueField: "value",
                calculateAggregates: true,
            })
        );

        pointSeries.bullets.push(() => {
            const circle = am5.Circle.new(root, {
                radius: 6,
                tooltipText: "{title}\nScore: {value}",
                fill: am5.color(0x888888),
            });

            circle.adapters.add("fill", (fill, target) => {
                const dataItem = target.dataItem;
                if (!dataItem) return fill;

                const value = dataItem.get("value");
                if (value > 0.3) return am5.color(0x4caf50);
                if (value < -0.3) return am5.color(0xf44336);
                return am5.color(0xffeb3b);
            });

            return am5.Bullet.new(root, {
                sprite: circle,
            });
        });

        pointSeries.data.setAll(
            data
                .filter((d) => d.latitude && d.longitude)
                .map((d) => {
                    const sentimentScore = getSentimentScore(d);
                    return {
                        geometry: {
                            type: "Point",
                            coordinates: [d.longitude, d.latitude],
                        },
                        title: `${d.country}, ${d.region}`,
                        value: sentimentScore,
                    };
                })
        );

        return () => {
            root.dispose();
            rootRef.current = null;
            chartRef.current = null;
            polygonSeriesRef.current = null;
        };
    }, [data, mode]);

    return (
        <>
            <select
                className="p-2 border border-gray-300 rounded mb-4 mx-auto block max-w-xs"
                value={selectedCountryId}
                onChange={(e) => handleCountrySelect(e.target.value)}
            >
                <option value="">Select a country</option>
                {data.map((d) => (
                    <option key={d.id} value={d.id}>
                        {d.country} {d.region ? `- ${d.region}` : ""}
                    </option>
                ))}
            </select>

            <div
                id="chartdiv"
                className="bg-white w-[320px] sm:w-[640px] md:w-[768px] lg:w-[1000px] h-[90vh] min-h-[800px]"
            />

            {modalData && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white text-gray-800 rounded-lg p-6 max-w-sm w-full shadow-lg relative">
                        <button
                            className="absolute top-2 right-2 text-gray-500 hover:text-black"
                            onClick={() => setModalData(null)}
                        >
                            ×
                        </button>
                        <h2 className="text-lg font-semibold mb-2">
                            {modalData.name}
                        </h2>
                        <p>Positive: {modalData.positive}</p>
                        <p>Neutral: {modalData.neutral}</p>
                        <p>Negative: {modalData.negative}</p>
                    </div>
                </div>
            )}
        </>
    );
};

export default MapChart;
