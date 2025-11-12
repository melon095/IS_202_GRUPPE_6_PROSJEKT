import { parseISO } from "date-fns";
import L from "leaflet";
import React, { useMemo } from "react";
import { Marker, Polygon, Polyline, Popup, useMap } from "react-leaflet";

import { useJourney } from "../hooks/useJourney";
import { useObjectTypes } from "../hooks/useObjectTypes";
import { useServerObjectsQuery } from "../hooks/useServerObjectsQuery";
import { Colour, PlacedObject, PlaceMode, PlaceModeToString } from "../types";

interface ObjectGeometryProps {
	obj: PlacedObject;
	colour: Colour;
}

const DEFAULT_ICON_MARKER = "/images/marker-icon.png";
const DEFAULT_COLOUR = "blue";
const DEFAULT_AREA_ICON = L.divIcon({ className: "polygon-label", html: "" });

const BASE_ZOOM = 13;
const BASE_ICON_SIZE: [number, number] = [25, 41];
const BASE_SHADOW_SIZE: [number, number] = [41, 41];

const calculateIconSize = (currentZoom: number): { iconSize: [number, number]; shadowSize: [number, number] } => {
	const zoomDiff = currentZoom - BASE_ZOOM;
	const scale = Math.pow(2, zoomDiff * 0.5);

	const clampedScale = Math.max(0.3, Math.min(2, scale));

	const iconWidth = Math.round(BASE_ICON_SIZE[0] * clampedScale);
	const iconHeight = Math.round(BASE_ICON_SIZE[1] * clampedScale);
	const shadowWidth = Math.round(BASE_SHADOW_SIZE[0] * clampedScale);
	const shadowHeight = Math.round(BASE_SHADOW_SIZE[1] * clampedScale);

	return {
		iconSize: [iconWidth, iconHeight],
		shadowSize: [shadowWidth, shadowHeight],
	};
};

const ObjectGeometry = React.memo(({ obj, colour }: ObjectGeometryProps) => {
	const { getObjectTypeById, getStandardObjectType, isObjectTypeStandard } = useObjectTypes();
	const map = useMap();
	const [zoom, setZoom] = React.useState(map.getZoom());

	const { objectType, isStandardObjectType } = useMemo(() => {
		let objectType = getObjectTypeById(obj.typeId);
		let isStandardObjectType = false;

		if (!objectType) {
			objectType = getStandardObjectType(obj.geometryType);
			isStandardObjectType = true;
		} else {
			isStandardObjectType = isObjectTypeStandard(objectType.id);
		}

		return { objectType, isStandardObjectType };
	}, [obj.typeId, obj.geometryType, getObjectTypeById, getStandardObjectType, isObjectTypeStandard]);

	React.useEffect(() => {
		const handleZoom = () => {
			setZoom(map.getZoom());
		};

		map.on("zoomend", handleZoom);
		return () => {
			map.off("zoomend", handleZoom);
		};
	}, [map]);

	const icon = useMemo(() => {
		const { iconSize, shadowSize } = calculateIconSize(zoom);

		return L.icon({
			iconUrl: objectType?.imageUrl || DEFAULT_ICON_MARKER,
			iconSize: iconSize,
			popupAnchor: [1, -34],
			shadowSize: shadowSize,
		});
	}, [objectType, zoom]);

	if (!obj?.points?.length) return null;

	const effectiveColour = objectType?.colour || colour || DEFAULT_COLOUR;

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
								pathOptions={{ color: effectiveColour }}
							/>
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

			const centroid: [number, number] = [
				polygonPoints.reduce((sum, p) => sum + p.lat, 0) / polygonPoints.length,
				polygonPoints.reduce((sum, p) => sum + p.lng, 0) / polygonPoints.length,
			];

			let areaIcon = DEFAULT_AREA_ICON;
			if (!isStandardObjectType && objectType !== null && objectType?.name) {
				areaIcon = L.divIcon({
					className: "polygon-label",
					html: `<div style="text-align:center; font-weight:bold; color:black">${objectType.name}</div>`,
					iconSize: [100, 40],
				});
			}

			return (
				<>
					<Polygon positions={polygonPoints} pathOptions={{ color: effectiveColour }}>
						{popup}
					</Polygon>
					{isStandardObjectType ? null : <Marker position={centroid} icon={areaIcon} interactive={false} />}
				</>
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
					<Polyline
						positions={obj.points.map((p) => [p.lat, p.lng])}
						pathOptions={{ color: effectiveColour }}
					/>
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
