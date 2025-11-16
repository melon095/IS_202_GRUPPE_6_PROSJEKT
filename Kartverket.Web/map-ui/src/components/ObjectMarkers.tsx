import { useLeafletContext } from "@react-leaflet/core";
import { parseISO } from "date-fns";
import L from "leaflet";
import { useEffect, useRef } from "react";

import { useObjectTypes } from "../hooks/useObjectTypes";
import { Colour, ObjectType, PlacedObject, PlaceMode, PlaceModeToString } from "../types";

const DEFAULT_ICON_MARKER = "/images/marker-icon.png";

const BASE_ZOOM = 13;
const BASE_ICON_SIZE: [number, number] = [25, 41];
const MINIMUM_ZOOM_FOR_AREA_LABELS = 11;

interface IconSize {
	iconSize: [number, number];
	popupAnchor: [number, number];
}

export interface ObjectDefinition {
	colour: Colour;
	objects: PlacedObject[];
}

export interface ObjectMarkerProps {
	objects: ObjectDefinition[];
	placeMode: PlaceMode;
}

const calculateIconSize = (currentZoom: number): IconSize => {
	const zoomDiff = currentZoom - BASE_ZOOM;
	const scale = Math.pow(2, zoomDiff * 0.5);
	const clampedScale = Math.max(0.3, Math.min(2, scale));

	const iconWidth = Math.round(BASE_ICON_SIZE[0] * clampedScale);
	const iconHeight = Math.round(BASE_ICON_SIZE[1] * clampedScale);
	const popupAnchor: [number, number] = [1, -Math.floor(iconHeight / 2)];

	return {
		iconSize: [iconWidth, iconHeight],
		popupAnchor,
	};
};

export const ObjectMarkers = ({ objects, placeMode }: ObjectMarkerProps) => {
	const leaflet = useLeafletContext();
	const layerRef = useRef<L.LayerGroup | null>(null);

	const { getObjectTypeById, getStandardObjectType, isObjectTypeStandard } = useObjectTypes();

	const perZoomIconCache = useRef<Record<string, L.Icon>>({});
	const canvasRenderer = useRef<L.Renderer>(L.canvas({ padding: 0.5 }));

	useEffect(() => {
		if (!leaflet.map || !leaflet.layerContainer) return;

		const layer = L.layerGroup();

		leaflet.layerContainer.addLayer(layer);

		layerRef.current = layer;

		const buildIcon = (type: ObjectType, zoom: number): L.Icon => {
			const { iconSize, popupAnchor } = calculateIconSize(zoom);
			const url = type?.imageUrl || DEFAULT_ICON_MARKER;
			const key = `${url}-${zoom}`;
			const cachedIcon = perZoomIconCache.current[key];
			if (cachedIcon) return cachedIcon;

			const icon = L.icon({
				iconUrl: url,
				iconSize: iconSize,
				popupAnchor,
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
					<p>${obj.title ?? ""}</p>
					<p>${obj.description ?? ""}</p>
				</div>
			</div>`;

			switch (obj.geometryType) {
				case PlaceMode.Point: {
					if (obj.points.length === 0) return;

					const point = obj.points[0];

					const marker = L.marker(point, {
						icon,
						interactive: placeMode === PlaceMode.None,
					});

					if (placeMode === PlaceMode.None) {
						marker.bindPopup(popupHtml);
					}

					marker.addTo(layer);
					break;
				}

				case PlaceMode.Line: {
					const polyline = L.polyline(obj.points, {
						color: colour,
						renderer: canvasRenderer.current,
						interactive: placeMode === PlaceMode.None,
					});

					if (placeMode === PlaceMode.None) {
						polyline.bindPopup(popupHtml);
					}

					polyline.addTo(layer);

					obj.points.forEach((point) => {
						const marker = L.marker(point, {
							icon,
							interactive: placeMode === PlaceMode.None,
						});
						marker.addTo(layer);
					});
					break;
				}

				case PlaceMode.Area: {
					const firstPoint = obj.points[0];
					const lastPoint = obj.points[obj.points.length - 1];
					const polygonPoints = firstPoint === lastPoint ? obj.points : [...obj.points, obj.points[0]];

					const polygon = L.polygon(polygonPoints, {
						color: colour,
						renderer: canvasRenderer.current,
						interactive: placeMode === PlaceMode.None,
					});

					if (placeMode === PlaceMode.None) {
						polygon.bindPopup(popupHtml);
					}

					polygon.addTo(layer);

					const isStandardType = isObjectTypeStandard(objectType.id);
					const isWithingZoomForLabels = leaflet.map.getZoom() >= MINIMUM_ZOOM_FOR_AREA_LABELS;

					if (!isStandardType && objectType?.name && isWithingZoomForLabels) {
						const centroid: [number, number] = [
							polygonPoints.reduce((sum, p) => sum + p.lat, 0) / polygonPoints.length,
							polygonPoints.reduce((sum, p) => sum + p.lng, 0) / polygonPoints.length,
						];

						const areaIcon = L.divIcon({
							className: "polygon-label",
							html: `<div style="text-align:center; font-weight:bold; color:black">${objectType.name}</div>`,
							iconSize: [100, 40],
						});

						const labelMarker = L.marker(centroid, { icon: areaIcon, interactive: false });
						labelMarker.addTo(layer);
					}
					break;
				}
				default:
					break;
			}
		};

		const drawAll = (zoom: number) => {
			layer.clearLayers();

			for (const objectDef of objects) {
				for (const obj of objectDef.objects) {
					renderObject(obj, zoom, objectDef.colour);
				}
			}
		};

		drawAll(leaflet.map.getZoom());

		const handleZoom = () => {
			const zoom = leaflet.map.getZoom();
			drawAll(zoom);
		};

		leaflet.map.on("zoomend", handleZoom);

		return () => {
			leaflet.map.off("zoomend", handleZoom);
			layer.remove();
		};
	}, [leaflet, objects, placeMode, getObjectTypeById, getStandardObjectType, isObjectTypeStandard]);

	return null;
};
