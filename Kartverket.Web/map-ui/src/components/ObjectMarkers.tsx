import { parseISO } from "date-fns";
import L from "leaflet";
import React from "react";
import { Marker, Polygon, Polyline, Popup } from "react-leaflet";

import { useJourney } from "../contexts/JourneyContext";
import { useObjectTypes } from "../contexts/ObjectTypesContext";
import { useServerObjectsQuery } from "../hooks/useServerObjectsQuery";
import { Colour, PlacedObject, PlaceMode, PlaceModeToString } from "../types";

interface ObjectGeometryProps {
	obj: PlacedObject;
	colour: Colour;
}

const DEFAULT_ICON_MARKER = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const DEFAULT_SHADOW_MARKER = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const ObjectGeometry = React.memo(({ obj, colour }: ObjectGeometryProps) => {
	const { getObjectTypeById } = useObjectTypes();
	if (!obj?.points?.length) return null;

	const objectType = getObjectTypeById(obj.typeId);

	const icon = L.icon({
		iconUrl: objectType?.markerImageUrl || DEFAULT_ICON_MARKER,
		shadowUrl: DEFAULT_SHADOW_MARKER,

		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],
		shadowSize: [41, 41],
	});

	const firstPoint = obj.points[0];

	const popup = (
		<Popup>
			<div>
				<p>{objectType?.name || "Ukjent objekt"}</p>
				<p>Type: {PlaceModeToString[obj.geometryType as PlaceMode]}</p>
				{firstPoint.createdAt && <>Laget: {parseISO(firstPoint.createdAt).toLocaleString()}</>}
				<div>
					{obj.title && <strong>{obj.title}</strong>}
					{obj.description && <p>{obj.description}</p>}
				</div>
			</div>
		</Popup>
	);

	switch (obj.geometryType) {
		case PlaceMode.Point: {
			return (
				<Marker position={[firstPoint.lat, firstPoint.lng]} icon={icon}>
					{popup}
				</Marker>
			);
		}

		case PlaceMode.Line: {
			return (
				<>
					{obj.points.map((point, idx) => (
						<React.Fragment key={idx}>
							<Marker key={idx} position={[point.lat, point.lng]} icon={icon}>
								{popup}
							</Marker>
							<Polyline
								key={`line-${idx}`}
								positions={obj.points.map((p) => [p.lat, p.lng])}
								pathOptions={{ color: colour }}
							/>
							;
						</React.Fragment>
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
				<Polygon positions={polygonPoints} pathOptions={{ color: colour }}>
					{popup}
				</Polygon>
			);
		}

		default: {
			return (
				<>
					{obj.points.map((point, idx) => (
						<Marker key={idx} position={[point.lat, point.lng]} icon={icon}>
							{popup}
						</Marker>
					))}
					<Polyline positions={obj.points.map((p) => [p.lat, p.lng])} pathOptions={{ color: colour }} />
				</>
			);
		}
	}
});

export const ObjectMarkers = React.memo(() => {
	const { currentJourney, currentObjectPoints, placeMode } = useJourney();
	const { data: serverObjects, isLoading, isError } = useServerObjectsQuery(currentJourney?.id);

	const renderObjects = (objects: PlacedObject[], colour: string) =>
		objects.map((obj, idx) => <ObjectGeometry key={obj.id || idx} obj={obj} colour={colour} />);

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
