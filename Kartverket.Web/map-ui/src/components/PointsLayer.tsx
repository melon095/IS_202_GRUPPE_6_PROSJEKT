import { GeoJsonObject } from "geojson";
import { useMemo } from "react";
import { GeoJSON } from "react-leaflet";
import { Point } from "../types";

export interface PointsLayerProps {
	points: Point[];
}

export default function PointsLayer(props: PointsLayerProps) {
	const geoJson = useMemo(
		() => ({
			type: "FeatureCollection",
			features: props.points.map((point, index) => ({
				type: "Feature",
				properties: { id: index },
				geometry: {
					type: "Point",
					coordinates: [point.lat, point.lng],
				},
			})),
		}),
		[props.points]
	) satisfies GeoJsonObject;

	return <GeoJSON data={geoJson} />;
}
