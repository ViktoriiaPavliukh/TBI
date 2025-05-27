import React, { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";

const MapChart = ({ data = [], mode }) => {
    const chartRef = useRef(null);
    const rootRef = useRef(null);

    if (!Array.isArray(data) || data.length === 0) {
        return (
            <div className="w-full h-[600px] flex justify-center items-center text-gray-600 font-semibold select-none text-xl">
                No data to display
            </div>
        );
    }

    useLayoutEffect(() => {
        if (!Array.isArray(data)) return;

        // Якщо вже є створений root — видаляємо перед новим рендером
        if (rootRef.current) {
            rootRef.current.dispose();
        }

        const root = am5.Root.new("chartdiv");
        rootRef.current = root;

        // Створюємо карту з проекцією Меркатора
        const chart = root.container.children.push(
            am5map.MapChart.new(root, {
                panX: "rotateX",
                panY: "translateY",
                projection: am5map.geoMercator(),
                layout: root.verticalLayout,
            })
        );
        chartRef.current = chart;

        // Створюємо серію полігонів (країн)
        const polygonSeries = chart.series.push(
            am5map.MapPolygonSeries.new(root, {
                geoJSON: am5geodata_worldLow,
                exclude: ["AQ"], // виключаємо Антарктиду
                calculateAggregates: true,
            })
        );

        
        polygonSeries.mapPolygons.template.setAll({
            tooltipText: "{name}\nClick for details",
            interactive: true,
            stroke: am5.color(0x4a4a4a),
            strokeWidth: 1,
        });

        // Функція для вибору кольору залежно від значення sentimentScore
        function getColor(sentiment) {
            if (sentiment > 0.3) return am5.color(0x4caf50); // зелений
            if (sentiment < -0.3) return am5.color(0xf44336); // червоний
            return am5.color(0xffeb3b); // жовтий
        }

        // Підготовка даних для фарбування
        const heatmapData = data.map((d) => {
            let sentimentScore = 0;
            if (mode === "overall") {
                sentimentScore =
                    (d.positive - d.negative) /
                    (d.positive + d.neutral + d.negative);
            } else if (mode === "positive") {
                sentimentScore = d.positive;
            } else if (mode === "neutral") {
                sentimentScore = d.neutral;
            } else if (mode === "negative") {
                sentimentScore = d.negative;
            }
            return {
                id: d.id, // має співпадати з id полігону в geoJSON
                value: sentimentScore,
                fill: getColor(sentimentScore),
                positive: d.positive,
                neutral: d.neutral,
                negative: d.negative,
            };
        });

        // Адаптер для кольору полігонів
        polygonSeries.mapPolygons.template.adapters.add(
            "fill",
            (fill, target) => {
                const polygonId = target.dataItem?.get("id");
                const dataItem = heatmapData.find((d) => d.id === polygonId);
                return dataItem ? dataItem.fill : fill;
            }
        );

        // Створюємо ховер-стан полігонів
        polygonSeries.mapPolygons.template.states.create("hover", {
            fill: am5.color(0x6699ff),
        });

        // Показуємо детальну інформацію у тултіпі
        polygonSeries.mapPolygons.template.set("tooltipHTML", (target) => {
            const polygonId = target.dataItem?.get("id");
            const dataItem = heatmapData.find((d) => d.id === polygonId);
            if (!dataItem) return target.get("name");
            return `
        <strong>${target.get("name")}</strong><br/>
        Positive: ${dataItem.positive}<br/>
        Neutral: ${dataItem.neutral}<br/>
        Negative: ${dataItem.negative}<br/>
        Score: ${dataItem.value.toFixed(2)}
      `;
        });

        return () => {
            root.dispose();
            rootRef.current = null;
            chartRef.current = null;
        };
    }, [data, mode]);

    return <div id="chartdiv" className="w-full h-[600px]"></div>;
};

export default MapChart;
