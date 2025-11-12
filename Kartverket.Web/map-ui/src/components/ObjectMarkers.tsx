import { parseISO } from "date-fns";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

import { useJourney } from "../hooks/useJourney";
import { useObjectTypes } from "../hooks/useObjectTypes";
import { useServerObjectsQuery } from "../hooks/useServerObjectsQuery";
import { Colour, ObjectType, PlacedObject, PlaceMode, PlaceModeToString } from "../types";

const DEFAULT_ICON_MARKER = "/images/marker-icon.png";
const CURRENT_JOURNEY_COLOUR = "blue";
const CURRENT_OBJECT_COLOUR = "red";
const SERVER_OBJECTS_COLOUR = "green";

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

export const ObjectMarkers = () => {
	const map = useMap();
	const layerRef = useRef<L.LayerGroup | null>(null);
	const { currentJourney, currentObjectPoints, placeMode } = useJourney();
	const { getObjectTypeById, getStandardObjectType, isObjectTypeStandard } = useObjectTypes();
	const { data: serverObjects } = useServerObjectsQuery(currentJourney?.id);

	const perZoomIconCache = useRef<Record<string, L.Icon>>({});

	useEffect(() => {
		const layer = L.layerGroup().addTo(map);
		layerRef.current = layer;

		const buildIcon = (type: ObjectType, zoom: number): L.Icon => {
			const { iconSize, shadowSize } = calculateIconSize(zoom);
			const url = type?.imageUrl || DEFAULT_ICON_MARKER;
			const key = `${url}-${zoom}`;
			const cachedIcon = perZoomIconCache.current[key];
			if (cachedIcon) return cachedIcon;

			const icon = L.icon({
				iconUrl: url,
				iconSize: iconSize,
				popupAnchor: [1, -34],
				shadowSize: shadowSize,
			});

			perZoomIconCache.current[key] = icon;
			return icon;
		};

		const renderObject = (obj: PlacedObject, zoom: number, colour: Colour) => {
			const objectType = getObjectTypeById(obj.typeId) || getStandardObjectType(obj.geometryType);
			if (!objectType) return;

			const icon = buildIcon(objectType, zoom);
			const popupHtml = `<div>
				<p>${objectType?.name || "Ukjent objekt"}</p>
				<p>Type: ${PlaceModeToString[obj.geometryType as PlaceMode]}</p>
				${obj.points[0]?.createdAt ? `<p>Laget: ${parseISO(obj.points[0].createdAt).toLocaleString()}</p>` : ""}
				<div>
					${obj.title ? `<strong>${obj.title}</strong>` : ""}
					${obj.description ? `<p>${obj.description}</p>` : ""}
				</div>
			</div>`;

			switch (obj.geometryType) {
				case PlaceMode.Point: {
					L.marker([obj.points[0].lat, obj.points[0].lng], { icon }).bindPopup(popupHtml).addTo(layer);
					break;
				}
				case PlaceMode.Line: {
					L.polyline(
						obj.points.map((p) => [p.lat, p.lng]),
						{ color: colour }
					)
						.bindPopup(popupHtml)
						.addTo(layer);
					obj.points.forEach((point) => {
						L.marker([point.lat, point.lng], { icon }).bindPopup(popupHtml).addTo(layer);
					});
					break;
				}
				case PlaceMode.Area: {
					const firstPoint = obj.points[0];
					const lastPoint = obj.points[obj.points.length - 1];
					const polygonPoints =
						firstPoint === lastPoint
							? obj.points
							: [...obj.points, obj.points[0]].map((p) => ({ lat: p.lat, lng: p.lng }));

					L.polygon(
						polygonPoints.map((p) => [p.lat, p.lng]),
						{ color: colour }
					)
						.bindPopup(popupHtml)
						.addTo(layer);

					if (!isObjectTypeStandard(objectType.id) && objectType?.name) {
						const centroid: [number, number] = [
							polygonPoints.reduce((sum, p) => sum + p.lat, 0) / polygonPoints.length,
							polygonPoints.reduce((sum, p) => sum + p.lng, 0) / polygonPoints.length,
						];

						const areaIcon = L.divIcon({
							className: "polygon-label",
							html: `<div style="text-align:center; font-weight:bold; color:black">${objectType.name}</div>`,
							iconSize: [100, 40],
						});

						L.marker(centroid, { icon: areaIcon, interactive: false }).addTo(layer);
					}
					break;
				}
				default:
					break;
			}
		};

		const drawAll = (zoom: number) => {
			layer.clearLayers();

			if (currentJourney) {
				for (const obj of currentJourney.objects) {
					renderObject(obj, zoom, CURRENT_JOURNEY_COLOUR);
				}
			}

			if (currentObjectPoints?.length > 0) {
				renderObject(
					{
						id: "current-object",
						points: currentObjectPoints,
						geometryType: placeMode,
						deleted: false,
						createdAt: new Date().toISOString(),
					},
					zoom,
					CURRENT_OBJECT_COLOUR
				);
			}

			if (serverObjects) {
				for (const obj of serverObjects) {
					renderObject(obj, zoom, SERVER_OBJECTS_COLOUR);
				}
			}
		};

		drawAll(map.getZoom());

		const handleZoom = () => {
			const zoom = map.getZoom();
			drawAll(zoom);
		};

		map.on("zoomend", handleZoom);

		return () => {
			map.off("zoomend", handleZoom);
			layer.remove();
		};
	}, [map, currentJourney, currentObjectPoints, placeMode, serverObjects]);

	return null;
};
