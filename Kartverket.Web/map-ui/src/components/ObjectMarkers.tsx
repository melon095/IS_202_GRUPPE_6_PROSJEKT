import React from "react";
import { Marker, Polygon, Polyline } from "react-leaflet";

import { useJourney } from "../contexts/JourneyContext";
import { useServerObjectsQuery } from "../hooks/useServerObjectsQuery";
import { Colour, PlacedObject, PlaceMode } from "../types";

interface ObjectGeometryProps {
	obj: PlacedObject;
	colour: Colour;
}

const ObjectGeometry = React.memo(({ obj, colour }: ObjectGeometryProps) => {
	if (!obj?.points?.length) return null;

	switch (obj.geometryType) {
		case PlaceMode.Point: {
			const point = obj.points[0];
			return <Marker position={[point.lat, point.lng]} />;
		}

		case PlaceMode.Line: {
			return (
				<>
					{obj.points.map((point, index) => (
						<>
							<Marker key={index} position={[point.lat, point.lng]} />
							<Polyline
								positions={obj.points.map((p) => [p.lat, p.lng])}
								pathOptions={{ color: colour }}
							/>
							;
						</>
					))}
				</>
			);
		}

		case PlaceMode.Area: {
			const firstPoint = obj.points[0];
			const lastPoint = obj.points[obj.points.length - 1];

			const polygonPoints =
				firstPoint === lastPoint
					? obj.points
					: [...obj.points, obj.points[0]].map((p) => ({ lat: p.lat, lng: p.lng }));

			return (
				<>
					{obj.points.map((point, index) => (
						<Marker key={index} position={[point.lat, point.lng]} />
					))}
					<Polygon positions={polygonPoints} pathOptions={{ color: colour }} />
				</>
			);
		}

		default:
			return null;
	}
});

export const ObjectMarkers = React.memo(() => {
	const { currentJourney, currentObjectPoints, placeMode } = useJourney();
	const { data: serverObjects, isLoading, isError } = useServerObjectsQuery(currentJourney?.id);

	const renderObjects = (objects: PlacedObject[], colour: string) =>
		objects.map((obj) => <ObjectGeometry key={obj.id || Math.random()} obj={obj} colour={colour} />);

	return (
		<>
			{currentJourney && (
				<>
					{renderObjects(currentJourney.objects, "blue")}

					{currentObjectPoints?.length > 0 && (
						<ObjectGeometry
							obj={{
								id: "current-object",
								points: currentObjectPoints,
								geometryType: placeMode,
								deleted: false,
								createdAt: new Date().toISOString(),
							}}
							colour="red"
						/>
					)}
				</>
			)}

			{!isLoading && !isError && renderObjects(serverObjects || [], "green")}
		</>
	);
});
