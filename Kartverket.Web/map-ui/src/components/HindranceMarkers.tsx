import { parseISO } from "date-fns";
import L from "leaflet";
import React, { useMemo } from "react";
import { Marker, Polygon, Polyline, Popup, useMap } from "react-leaflet";

import { useHindranceTypes } from "../contexts/HindranceTypesContext";
import { useJourney } from "../contexts/JourneyContext";
import { useServerHindranceQuery } from "../hooks/useServerHindrancesQuery";
import { Colour, PlacedHindrance, PlaceMode, PlaceModeToString } from "../types";

interface HindranceGeometryProps {
	hindrance: PlacedHindrance;
	colour: Colour;
}

const DEFAULT_ICON_MARKER = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const DEFAULT_SHADOW_MARKER = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const BASE_ZOOM = 13;
const BASE_ICON_SIZE: [number, number] = [25, 41];
const BASE_SHADOW_SIZE: [number, number] = [41, 41];

const calculateIconSize = (
	currentZoom: number
): { iconSize: [number, number]; shadowSize: [number, number]; iconAnchor: [number, number] } => {
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
		iconAnchor: [Math.round(iconWidth / 2), iconHeight],
	};
};
const HindranceGeometry = React.memo(({ hindrance, colour }: HindranceGeometryProps) => {
	const { getHindranceTypeById } = useHindranceTypes();
	const map = useMap();
	const [zoom, setZoom] = React.useState(map.getZoom());

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
		const hindranceType = getHindranceTypeById(hindrance.typeId);
		const sizes = calculateIconSize(zoom);

		return L.icon({
			iconUrl: hindranceType?.markerImageUrl || DEFAULT_ICON_MARKER,
			shadowUrl: DEFAULT_SHADOW_MARKER,
			iconSize: sizes.iconSize,
			iconAnchor: sizes.iconAnchor,
			popupAnchor: [1, -34],
			shadowSize: sizes.shadowSize,
		});
	}, [hindrance.typeId, zoom, getHindranceTypeById]);

	if (!hindrance?.points?.length) return null;

	const hindranceType = getHindranceTypeById(hindrance.typeId);

	const firstPoint = hindrance.points[0];

	const popup = (
		<Popup>
			<div>
				<p>{hindranceType?.name || "Ukjent objekt"}</p>
				<p>Type: {PlaceModeToString[hindrance.geometryType as PlaceMode]}</p>
				{firstPoint.createdAt && <>Laget: {parseISO(firstPoint.createdAt).toLocaleString()}</>}
				<div>
					{hindrance.title && <strong>{hindrance.title}</strong>}
					{hindrance.description && <p>{hindrance.description}</p>}
				</div>
			</div>
		</Popup>
	);

	switch (hindrance.geometryType) {
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
					{hindrance.points.map((point, idx) => (
						<React.Fragment key={idx}>
							<Marker key={idx} position={[point.lat, point.lng]} icon={icon}>
								{popup}
							</Marker>
							<Polyline
								key={`line-${idx}`}
								positions={hindrance.points.map((p) => [p.lat, p.lng])}
								pathOptions={{ color: colour }}
							/>
							;
						</React.Fragment>
					))}
				</>
			);
		}

		case PlaceMode.Area: {
			const firstPoint = hindrance.points[0];
			const lastPoint = hindrance.points[hindrance.points.length - 1];

			const polygonPoints =
				firstPoint === lastPoint
					? hindrance.points
					: [...hindrance.points, hindrance.points[0]].map((p) => ({ lat: p.lat, lng: p.lng }));

			return (
				<Polygon positions={polygonPoints} pathOptions={{ color: colour }}>
					{popup}
				</Polygon>
			);
		}

		default: {
			return (
				<>
					{hindrance.points.map((point, idx) => (
						<Marker key={idx} position={[point.lat, point.lng]} icon={icon}>
							{popup}
						</Marker>
					))}
					<Polyline positions={hindrance.points.map((p) => [p.lat, p.lng])} pathOptions={{ color: colour }} />
				</>
			);
		}
	}
});

export const HindranceMarkers = React.memo(() => {
	const { currentJourney, currentHindrancePoints, placeMode } = useJourney();
	const { data: serverHindrances, isLoading, isError } = useServerHindranceQuery(currentJourney?.id);

	const renderHindrances = (hindrances: PlacedHindrance[], colour: string) =>
		hindrances.map((h, idx) => <HindranceGeometry key={h.id || idx} hindrance={h} colour={colour} />);

	return (
		<>
			{currentJourney && (
				<>
					{renderHindrances(currentJourney.hindrances, "blue")}

					{currentHindrancePoints?.length > 0 && (
						<HindranceGeometry
							hindrance={{
								id: "current-hindrance",
								points: currentHindrancePoints,
								geometryType: placeMode,
								deleted: false,
								createdAt: new Date().toISOString(),
							}}
							colour="red"
						/>
					)}
				</>
			)}

			{!isLoading && !isError && renderHindrances(serverHindrances || [], "green")}
		</>
	);
});
